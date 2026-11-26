import cookieParser from 'cookie-parser';
import express from 'express';
import { ensureSchema, pool, port } from './db.js';
import authRouter from './routes/auth.js';
import budgetsRouter from './routes/budgets.js';
import categoriesRouter from './routes/categories.js';
import dashboardRouter from './routes/dashboard.js';
import paymentMethodsRouter from './routes/paymentMethods.js';
import transactionsRouter from './routes/transactions.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());

app.get('/api/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/payment-methods', paymentMethodsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/dashboard', dashboardRouter);

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
});

app.use((error, _request, response, _next) => {
  console.error('API request failed:', error);
  if (response.headersSent) return;
  response.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

async function startServer() {
  await ensureSchema();

  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}

startServer().catch(async (error) => {
  console.error('Failed to start API server:', error);
  await pool.end();
  process.exitCode = 1;
});
