import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { formatTransactionRow, getPeriodBounds } from '../utils/formatters.js';

const router = Router();
router.use(requireAuth);

router.get('/summary', async (request, response, next) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const { start, end } = getPeriodBounds('Bulan Ini');

  try {
    const [[initialRow]] = await pool.execute(
      `SELECT COALESCE(SUM(initial_balance), 0) AS total_initial
       FROM payment_methods
       WHERE user_id = ?`,
      [request.user.id],
    );

    const [[allTimeRow]] = await pool.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'completed' AND type = 'income' THEN amount ELSE 0 END), 0) AS all_income,
         COALESCE(SUM(CASE WHEN status = 'completed' AND type = 'expense' THEN amount ELSE 0 END), 0) AS all_expense
       FROM transactions
       WHERE user_id = ?`,
      [request.user.id],
    );

    const [[monthRow]] = await pool.execute(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'completed' AND type = 'income' THEN amount ELSE 0 END), 0) AS month_income,
         COALESCE(SUM(CASE WHEN status = 'completed' AND type = 'expense' THEN amount ELSE 0 END), 0) AS month_expense
       FROM transactions
       WHERE user_id = ? AND occurred_at >= ? AND occurred_at <= ?`,
      [request.user.id, start, end],
    );

    const [[budgetRow]] = await pool.execute(
      `SELECT
         COUNT(*) AS budget_count,
         COALESCE(SUM(b.limit_amount), 0) AS total_limit,
         COALESCE(SUM(spent_by_cat.spent), 0) AS total_spent
       FROM budgets b
       LEFT JOIN (
         SELECT category_id, SUM(amount) AS spent
         FROM transactions
         WHERE user_id = ?
           AND type = 'expense'
           AND status = 'completed'
           AND YEAR(occurred_at) = ?
           AND MONTH(occurred_at) = ?
         GROUP BY category_id
       ) spent_by_cat ON spent_by_cat.category_id = b.category_id
       WHERE b.user_id = ? AND b.period_year = ? AND b.period_month = ?`,
      [
        request.user.id,
        currentYear,
        currentMonth,
        request.user.id,
        currentYear,
        currentMonth,
      ],
    );

    const [recentRows] = await pool.execute(
      `SELECT
         t.id, t.user_id, t.category_id, t.payment_method_id, t.tx_code,
         t.title, t.type, t.amount, t.status, t.occurred_at, t.notes,
         c.slug AS category_slug, c.name AS category_name, c.icon AS category_icon,
         c.color_class AS category_color_class, c.bg_class AS category_bg_class,
         pm.name AS payment_method_name
       FROM transactions t
       INNER JOIN categories c ON c.id = t.category_id
       INNER JOIN payment_methods pm ON pm.id = t.payment_method_id
       WHERE t.user_id = ?
       ORDER BY t.occurred_at DESC, t.id DESC
       LIMIT 5`,
      [request.user.id],
    );

    const totalBalance =
      Number(initialRow.total_initial || 0) +
      Number(allTimeRow.all_income || 0) -
      Number(allTimeRow.all_expense || 0);
    const monthIncome = Number(monthRow.month_income || 0);
    const monthExpense = Number(monthRow.month_expense || 0);
    const totalLimit = Number(budgetRow.total_limit || 0);
    const totalSpent = Number(budgetRow.total_spent || 0);

    response.json({
      balance: totalBalance,
      monthlyCashflow: {
        year: currentYear,
        month: currentMonth,
        income: monthIncome,
        expense: monthExpense,
        net: monthIncome - monthExpense,
      },
      budgetSummary: {
        count: Number(budgetRow.budget_count || 0),
        totalLimit,
        totalSpent,
        remaining: Math.max(totalLimit - totalSpent, 0),
      },
      recentTransactions: recentRows.map(formatTransactionRow),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
