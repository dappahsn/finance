import jwt from 'jsonwebtoken';
import { isProduction, jwtSecret, pool } from '../db.js';

export const authCookieName = 'catat_session';

export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const clearCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

export function publicUser(row) {
  return {
    id: Number(row.id),
    email: row.email,
    fullName: row.full_name,
  };
}

export function setSessionCookie(response, userId) {
  const token = jwt.sign({ sub: String(userId) }, jwtSecret, {
    expiresIn: '7d',
  });
  response.cookie(authCookieName, token, cookieOptions);
}

/**
 * Resolves the authenticated user from the HttpOnly session cookie.
 * Returns null and clears invalid/stale cookies when authentication fails.
 */
export async function resolveSessionUser(request, response) {
  const token = request.cookies?.[authCookieName];
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      response.clearCookie(authCookieName, clearCookieOptions);
      return null;
    }

    const [rows] = await pool.execute(
      'SELECT id, email, full_name FROM users WHERE id = ? LIMIT 1',
      [payload.sub],
    );
    if (rows.length === 0) {
      response.clearCookie(authCookieName, clearCookieOptions);
      return null;
    }

    return publicUser(rows[0]);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      response.clearCookie(authCookieName, clearCookieOptions);
      return null;
    }
    throw error;
  }
}

/** Express middleware that protects routes requiring an authenticated user. */
export async function requireAuth(request, response, next) {
  try {
    const user = await resolveSessionUser(request, response);
    if (!user) {
      response.status(401).json({
        error: 'Sesi tidak valid atau sudah berakhir. Silakan masuk terlebih dahulu.',
      });
      return;
    }
    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
