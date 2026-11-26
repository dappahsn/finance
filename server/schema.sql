CREATE DATABASE IF NOT EXISTS catat_in
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE catat_in;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_methods (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transactions (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS budgets (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
);
