import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { parsePositiveInt } from '../utils/formatters.js';

const router = Router();
router.use(requireAuth);

const VALID_TYPES = new Set(['cash', 'bank', 'ewallet', 'card']);

function formatPaymentMethod(row) {
  const initialBalance = Number(row.initial_balance || 0);
  const netTransactions = Number(row.net_transactions || 0);
  return {
    id: Number(row.id),
    name: row.name,
    type: row.type,
    initialBalance,
    currentBalance: initialBalance + netTransactions,
    isActive: Boolean(row.is_active),
  };
}

router.get('/', async (request, response, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         pm.id,
         pm.name,
         pm.type,
         pm.initial_balance,
         pm.is_active,
         COALESCE(SUM(
           CASE
             WHEN t.status = 'completed' AND t.type = 'income' THEN CAST(t.amount AS SIGNED)
             WHEN t.status = 'completed' AND t.type = 'expense' THEN -CAST(t.amount AS SIGNED)
             ELSE 0
           END
         ), 0) AS net_transactions
       FROM payment_methods pm
       LEFT JOIN transactions t
         ON t.payment_method_id = pm.id AND t.user_id = pm.user_id
       WHERE pm.user_id = ?
       GROUP BY pm.id, pm.name, pm.type, pm.initial_balance, pm.is_active
       ORDER BY pm.is_active DESC, pm.id ASC`,
      [request.user.id],
    );

    response.json({ paymentMethods: rows.map(formatPaymentMethod) });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
  const { name, type = 'cash', initialBalance = 0 } = request.body ?? {};
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
    response
      .status(400)
      .json({ error: 'Nama metode pembayaran wajib diisi (maksimal 80 karakter).' });
    return;
  }
  if (!VALID_TYPES.has(type)) {
    response.status(400).json({ error: 'Tipe metode pembayaran tidak valid.' });
    return;
  }
  const parsedBalance = Number(initialBalance);
  if (!Number.isInteger(parsedBalance)) {
    response.status(400).json({ error: 'Saldo awal harus berupa bilangan bulat.' });
    return;
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO payment_methods (user_id, name, type, initial_balance)
       VALUES (?, ?, ?, ?)`,
      [request.user.id, name.trim(), type, parsedBalance],
    );

    const [rows] = await pool.execute(
      'SELECT id, name, type, initial_balance, is_active, 0 AS net_transactions FROM payment_methods WHERE id = ? LIMIT 1',
      [result.insertId],
    );
    response.status(201).json({ paymentMethod: formatPaymentMethod(rows[0]) });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      response
        .status(409)
        .json({ error: 'Metode pembayaran dengan nama ini sudah ada.' });
      return;
    }
    next(error);
  }
});

router.patch('/:id', async (request, response, next) => {
  const methodId = parsePositiveInt(request.params.id);
  if (!methodId) {
    response.status(400).json({ error: 'ID metode pembayaran tidak valid.' });
    return;
  }

  const { name, type, initialBalance, isActive } = request.body ?? {};
  const updates = [];
  const params = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
      response
        .status(400)
        .json({ error: 'Nama metode pembayaran maksimal 80 karakter.' });
      return;
    }
    updates.push('name = ?');
    params.push(name.trim());
  }
  if (type !== undefined) {
    if (!VALID_TYPES.has(type)) {
      response.status(400).json({ error: 'Tipe metode pembayaran tidak valid.' });
      return;
    }
    updates.push('type = ?');
    params.push(type);
  }
  if (initialBalance !== undefined) {
    const parsedBalance = Number(initialBalance);
    if (!Number.isInteger(parsedBalance)) {
      response.status(400).json({ error: 'Saldo awal harus berupa bilangan bulat.' });
      return;
    }
    updates.push('initial_balance = ?');
    params.push(parsedBalance);
  }
  if (isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(Boolean(isActive));
  }

  if (updates.length === 0) {
    response.status(400).json({ error: 'Tidak ada data yang diperbarui.' });
    return;
  }

  try {
    params.push(methodId, request.user.id);
    const [result] = await pool.execute(
      `UPDATE payment_methods SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params,
    );
    if (result.affectedRows === 0) {
      response.status(404).json({ error: 'Metode pembayaran tidak ditemukan.' });
      return;
    }

    const [rows] = await pool.execute(
      `SELECT
         pm.id,
         pm.name,
         pm.type,
         pm.initial_balance,
         pm.is_active,
         COALESCE(SUM(
           CASE
             WHEN t.status = 'completed' AND t.type = 'income' THEN CAST(t.amount AS SIGNED)
             WHEN t.status = 'completed' AND t.type = 'expense' THEN -CAST(t.amount AS SIGNED)
             ELSE 0
           END
         ), 0) AS net_transactions
       FROM payment_methods pm
       LEFT JOIN transactions t
         ON t.payment_method_id = pm.id AND t.user_id = pm.user_id
       WHERE pm.id = ? AND pm.user_id = ?
       GROUP BY pm.id, pm.name, pm.type, pm.initial_balance, pm.is_active`,
      [methodId, request.user.id],
    );
    response.json({ paymentMethod: formatPaymentMethod(rows[0]) });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      response
        .status(409)
        .json({ error: 'Metode pembayaran dengan nama ini sudah ada.' });
      return;
    }
    next(error);
  }
});

router.delete('/:id', async (request, response, next) => {
  const methodId = parsePositiveInt(request.params.id);
  if (!methodId) {
    response.status(400).json({ error: 'ID metode pembayaran tidak valid.' });
    return;
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM payment_methods WHERE id = ? AND user_id = ?',
      [methodId, request.user.id],
    );
    if (result.affectedRows === 0) {
      response.status(404).json({ error: 'Metode pembayaran tidak ditemukan.' });
      return;
    }
    response.status(204).end();
  } catch (error) {
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      response.status(409).json({
        error: 'Metode pembayaran masih dipakai oleh transaksi. Nonaktifkan saja jika tidak digunakan lagi.',
      });
      return;
    }
    next(error);
  }
});

export default router;
