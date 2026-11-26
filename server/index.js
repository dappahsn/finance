import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

const requiredEnvironment = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET',
];
const missingEnvironment = requiredEnvironment.filter(
  (key) => !process.env[key]?.trim(),
);

if (missingEnvironment.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvironment.join(', ')}`,
  );
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long.');
  process.exit(1);
}

const port = Number(process.env.API_PORT || 3001);
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
const authCookieName = 'catat_session';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
});

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
  };
}

function setSessionCookie(response, userId) {
  const token = jwt.sign({ sub: userId }, jwtSecret, { expiresIn: '7d' });
  response.cookie(authCookieName, token, cookieOptions);
}

function validateCredentials(email, password) {
  if (
    typeof email !== 'string' ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return 'Masukkan alamat email yang valid.';
  }
  if (typeof password !== 'string' || password.length < 8) {
    return 'Kata sandi harus memiliki minimal 8 karakter.';
  }
  return null;
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/api/auth/session', async (request, response, next) => {
  const token = request.cookies[authCookieName];
  if (!token) {
    response.json({ user: null });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      response.clearCookie(authCookieName, clearCookieOptions);
      response.json({ user: null });
      return;
    }

    const [rows] = await pool.execute(
      'SELECT id, email, full_name FROM users WHERE id = ? LIMIT 1',
      [payload.sub],
    );
    if (rows.length === 0) {
      response.clearCookie(authCookieName, clearCookieOptions);
      response.json({ user: null });
      return;
    }

    response.json({ user: publicUser(rows[0]) });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      response.clearCookie(authCookieName, clearCookieOptions);
      response.json({ user: null });
      return;
    }
    next(error);
  }
});

app.post('/api/auth/register', authLimiter, async (request, response, next) => {
  const { fullName, email, password } = request.body ?? {};
  const credentialsError = validateCredentials(email, password);
  if (credentialsError) {
    response.status(400).json({ error: credentialsError });
    return;
  }
  if (typeof fullName !== 'string' || !fullName.trim() || fullName.length > 120) {
    response.status(400).json({ error: 'Nama lengkap wajib diisi (maksimal 120 karakter).' });
    return;
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (email, full_name, password_hash) VALUES (?, ?, ?)',
      [normalizedEmail, fullName.trim(), passwordHash],
    );
    const user = {
      id: result.insertId,
      email: normalizedEmail,
      full_name: fullName.trim(),
    };
    setSessionCookie(response, String(user.id));
    response.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      response.status(409).json({ error: 'Email ini sudah terdaftar.' });
      return;
    }
    next(error);
  }
});

app.post('/api/auth/login', authLimiter, async (request, response, next) => {
  const { email, password } = request.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    response.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
    return;
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, email, full_name, password_hash FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      response.status(401).json({ error: 'Email atau kata sandi tidak sesuai.' });
      return;
    }

    setSessionCookie(response, String(user.id));
    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/logout', (_request, response) => {
  response.clearCookie(authCookieName, clearCookieOptions);
  response.status(204).end();
});

app.use((error, _request, response, _next) => {
  console.error('API request failed:', error);
  if (response.headersSent) return;
  response.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

async function startServer() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(254) NOT NULL UNIQUE,
      full_name VARCHAR(120) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}

startServer().catch(async (error) => {
  console.error('Failed to start API server:', error);
  await pool.end();
  process.exitCode = 1;
});
