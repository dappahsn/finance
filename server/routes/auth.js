import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { pool, seedUserDefaultPaymentMethods } from '../db.js';
import {
  authCookieName,
  clearCookieOptions,
  publicUser,
  resolveSessionUser,
  setSessionCookie,
} from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
});

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

router.get('/session', async (request, response, next) => {
  try {
    const user = await resolveSessionUser(request, response);
    response.json({ user });
  } catch (error) {
    next(error);
  }
});

router.post('/register', authLimiter, async (request, response, next) => {
  const { fullName, email, password } = request.body ?? {};
  const credentialsError = validateCredentials(email, password);
  if (credentialsError) {
    response.status(400).json({ error: credentialsError });
    return;
  }
  if (typeof fullName !== 'string' || !fullName.trim() || fullName.length > 120) {
    response
      .status(400)
      .json({ error: 'Nama lengkap wajib diisi (maksimal 120 karakter).' });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await connection.execute(
      'INSERT INTO users (email, full_name, password_hash) VALUES (?, ?, ?)',
      [normalizedEmail, trimmedName, passwordHash],
    );

    const userId = Number(result.insertId);
    await seedUserDefaultPaymentMethods(connection, userId);
    await connection.commit();

    const user = {
      id: userId,
      email: normalizedEmail,
      full_name: trimmedName,
    };
    setSessionCookie(response, user.id);
    response.status(201).json({ user: publicUser(user) });
  } catch (error) {
    await connection.rollback();
    if (error?.code === 'ER_DUP_ENTRY') {
      response.status(409).json({ error: 'Email ini sudah terdaftar.' });
      return;
    }
    next(error);
  } finally {
    connection.release();
  }
});

router.post('/login', authLimiter, async (request, response, next) => {
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
      response
        .status(401)
        .json({ error: 'Email atau kata sandi tidak sesuai.' });
      return;
    }

    setSessionCookie(response, user.id);
    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_request, response) => {
  response.clearCookie(authCookieName, clearCookieOptions);
  response.status(204).end();
});

export default router;
