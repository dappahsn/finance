import 'dotenv/config';
import mysql from 'mysql2/promise';

const requiredEnvironment = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
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

export const port = Number(process.env.API_PORT || 3001);
export const isProduction = process.env.NODE_ENV === 'production';
export const jwtSecret = process.env.JWT_SECRET;

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const SCHEMA_TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS categories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    slug VARCHAR(60) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    icon VARCHAR(60) NOT NULL DEFAULT 'category',
    color_class VARCHAR(60) NOT NULL DEFAULT 'text-primary',
    bg_class VARCHAR(60) NOT NULL DEFAULT 'bg-primary-fixed',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_categories_user_slug (user_id, slug),
    KEY idx_categories_slug (slug),
    KEY idx_categories_user_type (user_id, type),
    CONSTRAINT fk_categories_user
      FOREIGN KEY (user_id) REFERENCES users (id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS payment_methods (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(80) NOT NULL,
    type ENUM('cash', 'bank', 'ewallet', 'card') NOT NULL DEFAULT 'cash',
    initial_balance BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_payment_methods_user_name (user_id, name),
    KEY idx_payment_methods_user_active (user_id, is_active),
    CONSTRAINT fk_payment_methods_user
      FOREIGN KEY (user_id) REFERENCES users (id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    payment_method_id BIGINT UNSIGNED NOT NULL,
    tx_code VARCHAR(40) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount BIGINT UNSIGNED NOT NULL,
    status ENUM('completed', 'pending', 'cancelled') NOT NULL DEFAULT 'completed',
    occurred_at DATETIME NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_transactions_user_occurred (user_id, occurred_at),
    KEY idx_transactions_user_cat_occurred (user_id, category_id, occurred_at),
    KEY idx_transactions_user_type (user_id, type),
    CONSTRAINT fk_transactions_user
      FOREIGN KEY (user_id) REFERENCES users (id)
      ON DELETE CASCADE,
    CONSTRAINT fk_transactions_category
      FOREIGN KEY (category_id) REFERENCES categories (id)
      ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_payment_method
      FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id)
      ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS budgets (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    period_year SMALLINT UNSIGNED NOT NULL,
    period_month TINYINT UNSIGNED NOT NULL,
    limit_amount BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_budgets_user_cat_period (user_id, category_id, period_year, period_month),
    KEY idx_budgets_user_period (user_id, period_year, period_month),
    CONSTRAINT fk_budgets_user
      FOREIGN KEY (user_id) REFERENCES users (id)
      ON DELETE CASCADE,
    CONSTRAINT fk_budgets_category
      FOREIGN KEY (category_id) REFERENCES categories (id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

const DEFAULT_CATEGORIES_SEED = `
  INSERT INTO categories (user_id, slug, name, type, icon, color_class, bg_class)
  SELECT seed.user_id, seed.slug, seed.name, seed.type, seed.icon, seed.color_class, seed.bg_class
  FROM (
    SELECT NULL AS user_id, 'makanan' AS slug, 'Makanan & Minuman' AS name, 'expense' AS type, 'restaurant' AS icon, 'text-primary' AS color_class, 'bg-primary-fixed' AS bg_class
    UNION ALL SELECT NULL, 'belanja', 'Belanja', 'expense', 'shopping_bag', 'text-secondary', 'bg-secondary-fixed'
    UNION ALL SELECT NULL, 'transportasi', 'Transportasi', 'expense', 'directions_car', 'text-tertiary', 'bg-tertiary-fixed'
    UNION ALL SELECT NULL, 'tagihan', 'Tagihan', 'expense', 'bolt', 'text-expense-rose', 'bg-expense-rose-subtle'
    UNION ALL SELECT NULL, 'gaji', 'Gaji & Bonus', 'income', 'work', 'text-income-green', 'bg-income-green-subtle'
    UNION ALL SELECT NULL, 'investasi', 'Investasi', 'income', 'trending_up', 'text-income-green', 'bg-income-green-subtle'
  ) AS seed
  WHERE NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.user_id IS NULL AND c.slug = seed.slug
  )
`;

/** Ensures the target database, all required tables, and default categories exist in MySQL. */
export async function ensureSchema() {
  const bootstrapConnection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
  });
  try {
    const dbName = process.env.DB_NAME.replaceAll('`', '``');
    await bootstrapConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await bootstrapConnection.end();
  }

  for (const ddl of SCHEMA_TABLES) {
    await pool.query(ddl);
  }
  await pool.query(DEFAULT_CATEGORIES_SEED);
}

/** Seeds starter payment methods for newly registered users. */
export async function seedUserDefaultPaymentMethods(connection, userId) {
  await connection.execute(
    `INSERT IGNORE INTO payment_methods (user_id, name, type, initial_balance)
     VALUES
       (?, 'Tunai', 'cash', 0),
       (?, 'Transfer Bank', 'bank', 0),
       (?, 'QRIS', 'ewallet', 0)`,
    [userId, userId, userId],
  );
}
