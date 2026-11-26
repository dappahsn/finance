import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { parsePositiveInt, slugify } from '../utils/formatters.js';

const router = Router();
router.use(requireAuth);

function resolvePeriod(queryOrBody) {
  const now = new Date();
  const year = parsePositiveInt(queryOrBody?.year) ?? now.getFullYear();
  const month = parsePositiveInt(queryOrBody?.month) ?? now.getMonth() + 1;
  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    return null;
  }
  return { year, month };
}

function formatBudgetRow(row) {
  const spent = Number(row.spent || 0);
  const limit = Number(row.limit_amount);
  const progress = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  return {
    id: String(row.id),
    categoryId: Number(row.category_id),
    name: row.category_name,
    slug: row.category_slug,
    icon: row.category_icon || 'savings',
    color: row.category_color_class || 'text-primary',
    background: row.category_bg_class || 'bg-primary-fixed',
    spent,
    limit,
    remaining: Math.max(limit - spent, 0),
    progress,
    year: Number(row.period_year),
    month: Number(row.period_month),
  };
}

const BUDGET_SELECT = `
  SELECT
    b.id,
    b.category_id,
    b.period_year,
    b.period_month,
    b.limit_amount,
    c.name AS category_name,
    c.slug AS category_slug,
    c.icon AS category_icon,
    c.color_class AS category_color_class,
    c.bg_class AS category_bg_class,
    COALESCE(SUM(t.amount), 0) AS spent
  FROM budgets b
  INNER JOIN categories c ON c.id = b.category_id
  LEFT JOIN transactions t
    ON t.user_id = b.user_id
    AND t.category_id = b.category_id
    AND t.type = 'expense'
    AND t.status = 'completed'
    AND YEAR(t.occurred_at) = b.period_year
    AND MONTH(t.occurred_at) = b.period_month
`;

router.get('/', async (request, response, next) => {
  const period = resolvePeriod(request.query);
  if (!period) {
    response.status(400).json({ error: 'Periode bulan atau tahun tidak valid.' });
    return;
  }

  const filter = request.query.filter === 'mendekati' ? 'mendekati' : 'semua';

  try {
    const [rows] = await pool.execute(
      `${BUDGET_SELECT}
       WHERE b.user_id = ? AND b.period_year = ? AND b.period_month = ?
       GROUP BY
         b.id, b.category_id, b.period_year, b.period_month, b.limit_amount,
         c.name, c.slug, c.icon, c.color_class, c.bg_class
       ORDER BY b.id ASC`,
      [request.user.id, period.year, period.month],
    );

    const allBudgets = rows.map(formatBudgetRow);
    const totalLimit = allBudgets.reduce((sum, item) => sum + item.limit, 0);
    const totalSpent = allBudgets.reduce((sum, item) => sum + item.spent, 0);

    const budgets =
      filter === 'mendekati'
        ? allBudgets.filter((item) => item.limit > 0 && item.spent / item.limit >= 0.8)
        : allBudgets;

    response.json({
      period,
      summary: {
        totalLimit,
        totalSpent,
        remaining: Math.max(totalLimit - totalSpent, 0),
        count: allBudgets.length,
      },
      budgets,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
  const { categoryId, categoryName, limitAmount, year, month } = request.body ?? {};
  const period = resolvePeriod({ year, month });
  const parsedLimit = parsePositiveInt(limitAmount);

  if (!period) {
    response.status(400).json({ error: 'Periode bulan atau tahun tidak valid.' });
    return;
  }
  if (!parsedLimit) {
    response.status(400).json({ error: 'Batas anggaran harus lebih dari 0.' });
    return;
  }

  const parsedCategoryId = parsePositiveInt(categoryId);
  const trimmedName =
    typeof categoryName === 'string' ? categoryName.trim() : '';

  if (!parsedCategoryId && (!trimmedName || trimmedName.length > 100)) {
    response.status(400).json({
      error: 'Isi nama kategori atau pilih kategori yang valid.',
    });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let targetCategoryId = parsedCategoryId;

    if (targetCategoryId) {
      const [catRows] = await connection.execute(
        'SELECT id FROM categories WHERE id = ? AND (user_id IS NULL OR user_id = ?) LIMIT 1',
        [targetCategoryId, request.user.id],
      );
      if (catRows.length === 0) {
        await connection.rollback();
        response.status(404).json({ error: 'Kategori tidak ditemukan.' });
        return;
      }
    } else {
      const [existingCat] = await connection.execute(
        `SELECT id FROM categories
         WHERE (user_id IS NULL OR user_id = ?) AND LOWER(name) = LOWER(?)
         LIMIT 1`,
        [request.user.id, trimmedName],
      );

      if (existingCat.length > 0) {
        targetCategoryId = Number(existingCat[0].id);
      } else {
        const slug = slugify(trimmedName) || `kategori-${Date.now()}`;
        const [catResult] = await connection.execute(
          `INSERT INTO categories (user_id, slug, name, type, icon, color_class, bg_class)
           VALUES (?, ?, ?, 'expense', 'savings', 'text-primary', 'bg-primary-fixed')`,
          [request.user.id, slug, trimmedName],
        );
        targetCategoryId = Number(catResult.insertId);
      }
    }

    const [budgetResult] = await connection.execute(
      `INSERT INTO budgets (user_id, category_id, period_year, period_month, limit_amount)
       VALUES (?, ?, ?, ?, ?)`,
      [
        request.user.id,
        targetCategoryId,
        period.year,
        period.month,
        parsedLimit,
      ],
    );

    await connection.commit();

    const [rows] = await pool.execute(
      `${BUDGET_SELECT}
       WHERE b.id = ? AND b.user_id = ?
       GROUP BY
         b.id, b.category_id, b.period_year, b.period_month, b.limit_amount,
         c.name, c.slug, c.icon, c.color_class, c.bg_class`,
      [budgetResult.insertId, request.user.id],
    );
    response.status(201).json({ budget: formatBudgetRow(rows[0]) });
  } catch (error) {
    await connection.rollback();
    if (error?.code === 'ER_DUP_ENTRY') {
      response
        .status(409)
        .json({ error: 'Kategori ini sudah memiliki anggaran pada bulan tersebut.' });
      return;
    }
    next(error);
  } finally {
    connection.release();
  }
});

router.patch('/:id', async (request, response, next) => {
  const budgetId = parsePositiveInt(request.params.id);
  const parsedLimit = parsePositiveInt(request.body?.limitAmount);

  if (!budgetId) {
    response.status(400).json({ error: 'ID anggaran tidak valid.' });
    return;
  }
  if (!parsedLimit) {
    response.status(400).json({ error: 'Batas anggaran harus lebih dari 0.' });
    return;
  }

  try {
    const [result] = await pool.execute(
      'UPDATE budgets SET limit_amount = ? WHERE id = ? AND user_id = ?',
      [parsedLimit, budgetId, request.user.id],
    );
    if (result.affectedRows === 0) {
      response.status(404).json({ error: 'Anggaran tidak ditemukan.' });
      return;
    }

    const [rows] = await pool.execute(
      `${BUDGET_SELECT}
       WHERE b.id = ? AND b.user_id = ?
       GROUP BY
         b.id, b.category_id, b.period_year, b.period_month, b.limit_amount,
         c.name, c.slug, c.icon, c.color_class, c.bg_class`,
      [budgetId, request.user.id],
    );
    response.json({ budget: formatBudgetRow(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (request, response, next) => {
  const budgetId = parsePositiveInt(request.params.id);
  if (!budgetId) {
    response.status(400).json({ error: 'ID anggaran tidak valid.' });
    return;
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?',
      [budgetId, request.user.id],
    );
    if (result.affectedRows === 0) {
      response.status(404).json({ error: 'Anggaran tidak ditemukan.' });
      return;
    }
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
