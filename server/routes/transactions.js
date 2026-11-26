import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import {
  formatTransactionRow,
  generateTxCode,
  getPeriodBounds,
  groupTransactionsByDate,
  parseNonNegativeInt,
  parsePositiveInt,
  toMysqlDatetime,
} from '../utils/formatters.js';

const router = Router();
router.use(requireAuth);

const VALID_STATUSES = new Set(['completed', 'pending', 'cancelled']);

const TRANSACTION_SELECT = `
  SELECT
    t.id,
    t.user_id,
    t.category_id,
    t.payment_method_id,
    t.tx_code,
    t.title,
    t.type,
    t.amount,
    t.status,
    t.occurred_at,
    t.notes,
    c.slug AS category_slug,
    c.name AS category_name,
    c.icon AS category_icon,
    c.color_class AS category_color_class,
    c.bg_class AS category_bg_class,
    pm.name AS payment_method_name
  FROM transactions t
  INNER JOIN categories c ON c.id = t.category_id
  INNER JOIN payment_methods pm ON pm.id = t.payment_method_id
`;

async function validateOwnedReferences(userId, categoryId, paymentMethodId) {
  if (categoryId !== undefined) {
    const [catRows] = await pool.execute(
      'SELECT id, type FROM categories WHERE id = ? AND (user_id IS NULL OR user_id = ?) LIMIT 1',
      [categoryId, userId],
    );
    if (catRows.length === 0) {
      return { error: 'Kategori tidak ditemukan.' };
    }
  }

  if (paymentMethodId !== undefined) {
    const [pmRows] = await pool.execute(
      'SELECT id FROM payment_methods WHERE id = ? AND user_id = ? LIMIT 1',
      [paymentMethodId, userId],
    );
    if (pmRows.length === 0) {
      return { error: 'Metode pembayaran tidak ditemukan.' };
    }
  }

  return { error: null };
}

router.get('/', async (request, response, next) => {
  const {
    period = 'Bulan Ini',
    startDate,
    endDate,
    category = 'all',
    type,
    paymentMethodId,
    status,
    q,
    limit: rawLimit = '100',
    offset: rawOffset = '0',
  } = request.query;

  const limit = Math.min(parsePositiveInt(rawLimit) ?? 100, 200);
  const offset = parseNonNegativeInt(rawOffset) ?? 0;

  const whereClauses = ['t.user_id = ?'];
  const params = [request.user.id];

  const { start, end } = getPeriodBounds(String(period), startDate, endDate);
  if (start) {
    whereClauses.push('t.occurred_at >= ?');
    params.push(start);
  }
  if (end) {
    whereClauses.push('t.occurred_at <= ?');
    params.push(end);
  }

  if (category && category !== 'all') {
    const parsedCatId = parsePositiveInt(category);
    if (parsedCatId) {
      whereClauses.push('t.category_id = ?');
      params.push(parsedCatId);
    } else {
      whereClauses.push('c.slug = ?');
      params.push(String(category));
    }
  }

  if (type === 'income' || type === 'expense') {
    whereClauses.push('t.type = ?');
    params.push(type);
  }

  const parsedPmId = parsePositiveInt(paymentMethodId);
  if (parsedPmId) {
    whereClauses.push('t.payment_method_id = ?');
    params.push(parsedPmId);
  }

  if (status && VALID_STATUSES.has(String(status))) {
    whereClauses.push('t.status = ?');
    params.push(String(status));
  }

  if (typeof q === 'string' && q.trim()) {
    const likePattern = `%${q.trim()}%`;
    whereClauses.push(
      '(t.title LIKE ? OR c.name LIKE ? OR pm.name LIKE ? OR t.tx_code LIKE ?)',
    );
    params.push(likePattern, likePattern, likePattern, likePattern);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  try {
    const [rows] = await pool.execute(
      `${TRANSACTION_SELECT}
       ${whereSql}
       ORDER BY t.occurred_at DESC, t.id DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params,
    );

    const [summaryRows] = await pool.execute(
      `SELECT
         COUNT(*) AS total_count,
         COALESCE(SUM(CASE WHEN t.status = 'completed' AND t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN t.status = 'completed' AND t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense
       FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id
       INNER JOIN payment_methods pm ON pm.id = t.payment_method_id
       ${whereSql}`,
      params,
    );

    const transactions = rows.map(formatTransactionRow);
    const totalIncome = Number(summaryRows[0]?.total_income || 0);
    const totalExpense = Number(summaryRows[0]?.total_expense || 0);

    response.json({
      transactions,
      groups: groupTransactionsByDate(transactions),
      summary: {
        totalIncome,
        totalExpense,
        netCashflow: totalIncome - totalExpense,
        count: Number(summaryRows[0]?.total_count || 0),
      },
      pagination: { limit, offset },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (request, response, next) => {
  const txId = parsePositiveInt(request.params.id);
  if (!txId) {
    response.status(400).json({ error: 'ID transaksi tidak valid.' });
    return;
  }

  try {
    const [rows] = await pool.execute(
      `${TRANSACTION_SELECT} WHERE t.id = ? AND t.user_id = ? LIMIT 1`,
      [txId, request.user.id],
    );
    if (rows.length === 0) {
      response.status(404).json({ error: 'Transaksi tidak ditemukan.' });
      return;
    }
    response.json({ transaction: formatTransactionRow(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
  const {
    title,
    type,
    amount,
    categoryId,
    paymentMethodId,
    occurredAt,
    status = 'completed',
    notes = null,
  } = request.body ?? {};

  if (typeof title !== 'string' || !title.trim() || title.trim().length > 150) {
    response
      .status(400)
      .json({ error: 'Judul transaksi wajib diisi (maksimal 150 karakter).' });
    return;
  }
  if (type !== 'income' && type !== 'expense') {
    response
      .status(400)
      .json({ error: "Jenis transaksi harus 'income' atau 'expense'." });
    return;
  }

  const parsedAmount = parsePositiveInt(amount);
  const parsedCategoryId = parsePositiveInt(categoryId);
  const parsedPaymentMethodId = parsePositiveInt(paymentMethodId);
  const mysqlOccurredAt = toMysqlDatetime(occurredAt);

  if (!parsedAmount) {
    response.status(400).json({ error: 'Nominal transaksi harus lebih dari 0.' });
    return;
  }
  if (!parsedCategoryId) {
    response.status(400).json({ error: 'Kategori wajib dipilih.' });
    return;
  }
  if (!parsedPaymentMethodId) {
    response.status(400).json({ error: 'Metode pembayaran wajib dipilih.' });
    return;
  }
  if (!mysqlOccurredAt) {
    response.status(400).json({ error: 'Format tanggal transaksi tidak valid.' });
    return;
  }
  if (!VALID_STATUSES.has(status)) {
    response.status(400).json({ error: 'Status transaksi tidak valid.' });
    return;
  }

  try {
    const refCheck = await validateOwnedReferences(
      request.user.id,
      parsedCategoryId,
      parsedPaymentMethodId,
    );
    if (refCheck.error) {
      response.status(400).json({ error: refCheck.error });
      return;
    }

    const txCode = generateTxCode();
    const cleanNotes =
      typeof notes === 'string' && notes.trim() ? notes.trim() : null;

    const [result] = await pool.execute(
      `INSERT INTO transactions
         (user_id, category_id, payment_method_id, tx_code, title, type, amount, status, occurred_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        request.user.id,
        parsedCategoryId,
        parsedPaymentMethodId,
        txCode,
        title.trim(),
        type,
        parsedAmount,
        status,
        mysqlOccurredAt,
        cleanNotes,
      ],
    );

    const [rows] = await pool.execute(
      `${TRANSACTION_SELECT} WHERE t.id = ? LIMIT 1`,
      [result.insertId],
    );
    response.status(201).json({ transaction: formatTransactionRow(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (request, response, next) => {
  const txId = parsePositiveInt(request.params.id);
  if (!txId) {
    response.status(400).json({ error: 'ID transaksi tidak valid.' });
    return;
  }

  const {
    title,
    type,
    amount,
    categoryId,
    paymentMethodId,
    occurredAt,
    status,
    notes,
  } = request.body ?? {};

  const updates = [];
  const params = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 150) {
      response
        .status(400)
        .json({ error: 'Judul transaksi maksimal 150 karakter.' });
      return;
    }
    updates.push('title = ?');
    params.push(title.trim());
  }
  if (type !== undefined) {
    if (type !== 'income' && type !== 'expense') {
      response
        .status(400)
        .json({ error: "Jenis transaksi harus 'income' atau 'expense'." });
      return;
    }
    updates.push('type = ?');
    params.push(type);
  }
  if (amount !== undefined) {
    const parsedAmount = parsePositiveInt(amount);
    if (!parsedAmount) {
      response.status(400).json({ error: 'Nominal harus lebih dari 0.' });
      return;
    }
    updates.push('amount = ?');
    params.push(parsedAmount);
  }

  let parsedCategoryId;
  if (categoryId !== undefined) {
    parsedCategoryId = parsePositiveInt(categoryId);
    if (!parsedCategoryId) {
      response.status(400).json({ error: 'ID kategori tidak valid.' });
      return;
    }
    updates.push('category_id = ?');
    params.push(parsedCategoryId);
  }

  let parsedPaymentMethodId;
  if (paymentMethodId !== undefined) {
    parsedPaymentMethodId = parsePositiveInt(paymentMethodId);
    if (!parsedPaymentMethodId) {
      response.status(400).json({ error: 'ID metode pembayaran tidak valid.' });
      return;
    }
    updates.push('payment_method_id = ?');
    params.push(parsedPaymentMethodId);
  }

  if (occurredAt !== undefined) {
    const mysqlOccurredAt = toMysqlDatetime(occurredAt);
    if (!mysqlOccurredAt) {
      response.status(400).json({ error: 'Format tanggal tidak valid.' });
      return;
    }
    updates.push('occurred_at = ?');
    params.push(mysqlOccurredAt);
  }

  if (status !== undefined) {
    if (!VALID_STATUSES.has(status)) {
      response.status(400).json({ error: 'Status transaksi tidak valid.' });
      return;
    }
    updates.push('status = ?');
    params.push(status);
  }

  if (notes !== undefined) {
    const cleanNotes =
      typeof notes === 'string' && notes.trim() ? notes.trim() : null;
    updates.push('notes = ?');
    params.push(cleanNotes);
  }

  if (updates.length === 0) {
    response.status(400).json({ error: 'Tidak ada data yang diperbarui.' });
    return;
  }

  try {
    const refCheck = await validateOwnedReferences(
      request.user.id,
      parsedCategoryId,
      parsedPaymentMethodId,
    );
    if (refCheck.error) {
      response.status(400).json({ error: refCheck.error });
      return;
    }

    params.push(txId, request.user.id);
    const [result] = await pool.execute(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params,
    );
    if (result.affectedRows === 0) {
      response.status(404).json({ error: 'Transaksi tidak ditemukan.' });
      return;
    }

    const [rows] = await pool.execute(
      `${TRANSACTION_SELECT} WHERE t.id = ? AND t.user_id = ? LIMIT 1`,
      [txId, request.user.id],
    );
    response.json({ transaction: formatTransactionRow(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (request, response, next) => {
  const txId = parsePositiveInt(request.params.id);
  if (!txId) {
    response.status(400).json({ error: 'ID transaksi tidak valid.' });
    return;
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [txId, request.user.id],
    );
    if (result.affectedRows === 0) {
      response.status(404).json({ error: 'Transaksi tidak ditemukan.' });
      return;
    }
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
