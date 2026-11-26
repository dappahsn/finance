import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { parsePositiveInt, slugify } from '../utils/formatters.js';

const router = Router();
router.use(requireAuth);

function formatCategory(row) {
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    type: row.type,
    icon: row.icon,
    colorClass: row.color_class,
    bgClass: row.bg_class,
    isDefault: row.user_id === null,
  };
}

router.get('/', async (request, response, next) => {
  const { type } = request.query;
  if (type && type !== 'income' && type !== 'expense') {
    response.status(400).json({ error: "Filter type harus 'income' atau 'expense'." });
    return;
  }

  try {
    const params = [request.user.id];
    let sql = `
      SELECT id, user_id, slug, name, type, icon, color_class, bg_class
      FROM categories
      WHERE (user_id IS NULL OR user_id = ?)
    `;
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    sql += ' ORDER BY user_id IS NOT NULL ASC, id ASC';

    const [rows] = await pool.execute(sql, params);
    response.json({ categories: rows.map(formatCategory) });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
  const {
    name,
    type = 'expense',
    icon = 'category',
    colorClass = 'text-primary',
    bgClass = 'bg-primary-fixed',
  } = request.body ?? {};

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    response.status(400).json({ error: 'Nama kategori wajib diisi (maksimal 100 karakter).' });
    return;
  }
  if (type !== 'income' && type !== 'expense') {
    response.status(400).json({ error: "Jenis kategori harus 'income' atau 'expense'." });
    return;
  }

  const trimmedName = name.trim();
  const slug = slugify(trimmedName) || `kategori-${Date.now()}`;

  try {
    const [existing] = await pool.execute(
      `SELECT id FROM categories
       WHERE (user_id IS NULL OR user_id = ?)
         AND (LOWER(name) = LOWER(?) OR slug = ?)
       LIMIT 1`,
      [request.user.id, trimmedName, slug],
    );
    if (existing.length > 0) {
      response.status(409).json({ error: 'Kategori dengan nama tersebut sudah ada.' });
      return;
    }

    const [result] = await pool.execute(
      `INSERT INTO categories (user_id, slug, name, type, icon, color_class, bg_class)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        request.user.id,
        slug,
        trimmedName,
        type,
        String(icon).slice(0, 60),
        String(colorClass).slice(0, 60),
        String(bgClass).slice(0, 60),
      ],
    );

    const [rows] = await pool.execute(
      'SELECT id, user_id, slug, name, type, icon, color_class, bg_class FROM categories WHERE id = ? LIMIT 1',
      [result.insertId],
    );
    response.status(201).json({ category: formatCategory(rows[0]) });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      response.status(409).json({ error: 'Kategori sudah tersedia.' });
      return;
    }
    next(error);
  }
});

router.patch('/:id', async (request, response, next) => {
  const categoryId = parsePositiveInt(request.params.id);
  if (!categoryId) {
    response.status(400).json({ error: 'ID kategori tidak valid.' });
    return;
  }

  const { name, icon, colorClass, bgClass } = request.body ?? {};
  const updates = [];
  const params = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
      response.status(400).json({ error: 'Nama kategori maksimal 100 karakter.' });
      return;
    }
    updates.push('name = ?');
    params.push(name.trim());
  }
  if (icon !== undefined) {
    updates.push('icon = ?');
    params.push(String(icon).slice(0, 60));
  }
  if (colorClass !== undefined) {
    updates.push('color_class = ?');
    params.push(String(colorClass).slice(0, 60));
  }
  if (bgClass !== undefined) {
    updates.push('bg_class = ?');
    params.push(String(bgClass).slice(0, 60));
  }

  if (updates.length === 0) {
    response.status(400).json({ error: 'Tidak ada data yang diperbarui.' });
    return;
  }

  try {
    params.push(categoryId, request.user.id);
    const [result] = await pool.execute(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params,
    );
    if (result.affectedRows === 0) {
      response.status(404).json({
        error: 'Kategori custom tidak ditemukan atau bukan milik akun ini.',
      });
      return;
    }

    const [rows] = await pool.execute(
      'SELECT id, user_id, slug, name, type, icon, color_class, bg_class FROM categories WHERE id = ? LIMIT 1',
      [categoryId],
    );
    response.json({ category: formatCategory(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (request, response, next) => {
  const categoryId = parsePositiveInt(request.params.id);
  if (!categoryId) {
    response.status(400).json({ error: 'ID kategori tidak valid.' });
    return;
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, request.user.id],
    );
    if (result.affectedRows === 0) {
      response.status(404).json({
        error: 'Kategori custom tidak ditemukan atau kategori bawaan tidak dapat dihapus.',
      });
      return;
    }
    response.status(204).end();
  } catch (error) {
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      response.status(409).json({
        error: 'Kategori masih digunakan oleh transaksi yang ada.',
      });
      return;
    }
    next(error);
  }
});

export default router;
