/**
 * JS NETWORK — MySQL data layer (replaces SQLite / better-sqlite3).
 *
 * Uses a mysql2 connection pool configured through environment variables
 * (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) so the same code runs
 * on a local MySQL server and on cPanel shared hosting.
 */
'use strict';

const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL connection pool. `dateStrings` keeps DATE/DATETIME values as
// 'YYYY-MM-DD' / 'YYYY-MM-DD HH:MM:SS' strings and `decimalNumbers` returns
// DECIMAL columns as JS numbers, matching what the frontend expects.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'js_network',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true,
  decimalNumbers: true
});

/**
 * Single query helper: run a raw SELECT-like statement and return just the
 * rows. (mysql2's promise API resolves to [rows, fields], so we unwrap.)
 */
async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result[0];
}

/**
 * Single execute helper: run an INSERT/UPDATE/DELETE and return the single
 * result header (use `result.insertId` / `result.affectedRows`).
 */
async function execute(sql, params = []) {
  const result = await pool.execute(sql, params);
  return result[0];
}

/**
 * Lightweight connectivity check used by the /api/health endpoint.
 */
async function pingDatabase() {
  await pool.query('SELECT 1');
  return true;
}

/**
 * Best-effort creation of the database itself (local development). Shared
 * hosting users usually lack CREATE DATABASE rights, so any failure here is
 * ignored — the database is then created manually in cPanel and the table
 * creation below still runs against it.
 */
async function ensureDatabase() {
  const dbName = (process.env.DB_NAME || 'js_network').replace(/[^a-zA-Z0-9_]/g, '');
  if (!dbName) return;
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4'
    });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.end();
  } catch (err) {
    console.error('[db] Could not auto-create the database (ignored):', err.message);
  }
}

/**
 * Create all tables if they do not exist (standard MySQL 5.7+ / 8.x syntax).
 */
async function initDatabase() {
  await ensureDatabase();
  await execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      type        ENUM('income', 'expense') NOT NULL,
      date        DATE NOT NULL,
      category    VARCHAR(255) NOT NULL DEFAULT '',
      head        VARCHAR(255) DEFAULT '',
      amount      DECIMAL(12, 2) NOT NULL,
      description TEXT,
      added_by    VARCHAR(100) NOT NULL DEFAULT 'admin',
      profit      DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_transactions_date (date),
      KEY idx_transactions_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS products (
      id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name           VARCHAR(255) NOT NULL,
      stock          INT NOT NULL DEFAULT 0,
      purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      price          DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_products_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS sales (
      id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
      customer_name  VARCHAR(255) NOT NULL,
      product_id     INT UNSIGNED NOT NULL,
      quantity       INT NOT NULL,
      unit_price     DECIMAL(12, 2) NOT NULL,
      purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      unit_profit    DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      profit         DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      total_amount   DECIMAL(12, 2) NOT NULL,
      date           DATE NOT NULL,
      added_by       VARCHAR(100) NOT NULL DEFAULT 'admin',
      created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_sales_date (date),
      KEY idx_sales_product_id (product_id),
      CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES products (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      type ENUM('income', 'expense') NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_categories_name (name),
      KEY idx_categories_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
      username   VARCHAR(100) NOT NULL,
      password   VARCHAR(255) NOT NULL,
      role       VARCHAR(50) NOT NULL DEFAULT 'user',
      can_edit   TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_users_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // `key_name` is used instead of `key` because KEY is a reserved MySQL word.
  await execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key_name VARCHAR(255) NOT NULL,
      value    LONGTEXT,
      PRIMARY KEY (key_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Seed the default admin account only when the users table is empty.
  // (Once created, the admin password is NOT reset on every start, so a
  // password changed from the UI survives restarts.)
  const userRows = await query('SELECT COUNT(*) AS count FROM users');
  if (Number(userRows[0].count) === 0) {
    await execute("INSERT INTO users (username, password, role, can_edit) VALUES ('admin', '123456', 'admin', 1)");
    console.log('[db] Seeded default admin account (username: admin, password: 123456).');
  }

  // Seed default categories only when the table is empty.
  const categoryRows = await query('SELECT COUNT(*) AS count FROM categories');
  if (Number(categoryRows[0].count) === 0) {
    await execute("INSERT INTO categories (name, type) VALUES ('Mobile Sale', 'income')");
    await execute("INSERT INTO categories (name, type) VALUES ('Accessories', 'income')");
    await execute("INSERT INTO categories (name, type) VALUES ('Servicing', 'income')");
    await execute("INSERT INTO categories (name, type) VALUES ('Shop Rent', 'expense')");
  }

  console.log('[db] Schema initialized (MySQL).');
  return pool;
}

/**
 * Lightweight in-place migration for databases created by an older release.
 * Fresh installs already have the full schema, so this only runs best-effort
 * ALTER statements and seeding safeguards. Wrapped in try/catch because some
 * shared-hosting DB users cannot read INFORMATION_SCHEMA.
 */
async function migrateDatabase() {
  try {
    await ensureColumn('transactions', 'profit', "DECIMAL(12, 2) NOT NULL DEFAULT 0.00");
    await ensureColumn('transactions', 'head', "VARCHAR(255) DEFAULT ''");
    await ensureColumn('users', 'role', "VARCHAR(50) NOT NULL DEFAULT 'user'");
    await ensureColumn('users', 'can_edit', "TINYINT(1) NOT NULL DEFAULT 0");
    await ensureColumn('products', 'purchase_price', "DECIMAL(12, 2) NOT NULL DEFAULT 0.00");
    await ensureColumn('sales', 'purchase_price', "DECIMAL(12, 2) NOT NULL DEFAULT 0.00");
    await ensureColumn('sales', 'unit_profit', "DECIMAL(12, 2) NOT NULL DEFAULT 0.00");
    await ensureColumn('sales', 'profit', "DECIMAL(12, 2) NOT NULL DEFAULT 0.00");

    // Sync head from category if head is blank
    try {
      await execute("UPDATE transactions SET head = category WHERE (head IS NULL OR head = '') AND category IS NOT NULL AND category != ''");
    } catch (_) {}

    // Guarantee the default admin user has the admin role and can_edit = 1.
    await execute("UPDATE users SET role = 'admin', can_edit = 1 WHERE username = 'admin'");
  } catch (err) {
    console.error('[db] Migration warning:', err.message);
  }
}

/**
 * Add a column to a table if it does not already exist.
 */
async function ensureColumn(table, column, definition) {
  const rows = await query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows.length === 0) {
    await execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`[db] Added \`${column}\` column to ${table} table.`);
  }
}

// ============================================================
// Transactions
// ============================================================

function mapTransactionRow(r) {
  if (!r) return r;
  const headVal = r.head || r.income_head || r.expense_head || r.category || r.description || '';
  return {
    ...r,
    head: headVal,
    category: headVal,
    amount: Number(r.amount) || 0
  };
}

/**
 * Add a new transaction.
 * @param {{type: string, date: string, category?: string, head?: string, amount: number, description: string, added_by: string, profit?: number}} data
 * @returns {Promise<number>} The new row id
 */
async function addTransaction(data) {
  const head = (data.head || data.income_head || data.expense_head || data.category || '').trim();
  try {
    const result = await execute(
      `INSERT INTO transactions (type, date, category, head, amount, description, added_by, profit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.type,
        data.date,
        head,
        head,
        Number(data.amount),
        data.description || '',
        data.added_by || '',
        Number(data.profit) || 0
      ]
    );
    return result.insertId;
  } catch (err) {
    const result = await execute(
      `INSERT INTO transactions (type, date, category, amount, description, added_by, profit)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.type,
        data.date,
        head,
        Number(data.amount),
        data.description || '',
        data.added_by || '',
        Number(data.profit) || 0
      ]
    );
    return result.insertId;
  }
}

/**
 * Get all transactions, newest first (whole shop — no user filter).
 * @returns {Promise<Array<object>>}
 */
async function getTransactions() {
  const rows = await query('SELECT * FROM transactions ORDER BY date DESC, id DESC');
  return rows.map(mapTransactionRow);
}

/**
 * Update an existing transaction by id.
 */
async function updateTransaction(id, data) {
  const existingRows = await query('SELECT * FROM transactions WHERE id = ?', [Number(id)]);
  if (!existingRows.length) throw new Error('Transaction not found.');
  const existing = existingRows[0];
  const type = data.type || existing.type;
  const date = data.date || existing.date;
  const head = (data.head || data.income_head || data.expense_head || data.category || existing.head || existing.category || '').trim();
  const amount = data.amount !== undefined ? Number(data.amount) : Number(existing.amount);
  const description = data.description !== undefined ? data.description : (existing.description || '');

  try {
    await execute(
      `UPDATE transactions
       SET type = ?, date = ?, category = ?, head = ?, amount = ?, description = ?
       WHERE id = ?`,
      [
        type,
        date,
        head,
        head,
        amount,
        description,
        Number(id)
      ]
    );
  } catch (err) {
    await execute(
      `UPDATE transactions
       SET type = ?, date = ?, category = ?, amount = ?, description = ?
       WHERE id = ?`,
      [
        type,
        date,
        head,
        amount,
        description,
        Number(id)
      ]
    );
  }
}

/**
 * Delete a transaction by id.
 */
async function deleteTransaction(id) {
  await execute('DELETE FROM transactions WHERE id = ?', [Number(id)]);
}

/**
 * Get summary totals: total income, total expense, and balance.
 * @returns {Promise<{totalIncome: number, totalExpense: number, balance: number}>}
 */
async function getSummary() {
  const rows = await query(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS total_expense
    FROM transactions
  `);
  const row = rows[0];
  const totalIncome = Number(row.total_income);
  const totalExpense = Number(row.total_expense);
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
}

/**
 * Get today's income and expense totals.
 * @returns {Promise<{todayIncome: number, todayExpense: number}>}
 */
async function getDailyStats() {
  const rows = await query(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income'  AND date = CURDATE() THEN amount END), 0) AS today_income,
      COALESCE(SUM(CASE WHEN type = 'expense' AND date = CURDATE() THEN amount END), 0) AS today_expense
    FROM transactions
  `);
  const row = rows[0];
  return { todayIncome: Number(row.today_income), todayExpense: Number(row.today_expense) };
}

/**
 * Calculate "Yesterday Balance" (cumulative net cash: Sum of all Income - Sum of all Expense for all records strictly before the selected date).
 * @param {string} selectedDate 'YYYY-MM-DD'
 * @returns {Promise<number>}
 */
async function getYesterdayBalance(selectedDate) {
  if (!selectedDate) return 0;
  const d = String(selectedDate).trim();
  // SQL failures propagate to the route so it can answer with HTTP 500
  // ({ error: "Database query failed" }) instead of silently returning 0.
  const rows = await query(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount END), 0) -
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS yesterday_balance
    FROM transactions
    WHERE date < ?
  `, [d]);
  return Number(rows[0]?.yesterday_balance) || 0;
}

/**
 * Calculate "Last Month Balance" (cumulative net cash: Sum of all Income - Sum of all Expense for all records strictly before the 1st day of the selected month).
 * @param {string} month 'YYYY-MM'
 * @returns {Promise<number>}
 */
async function getLastMonthBalance(month) {
  const m = (month || (new Date().toISOString().slice(0, 7))).trim();
  const firstDayOfMonth = `${m}-01`;
  // SQL failures propagate to the route so it can answer with HTTP 500
  // ({ error: "Database query failed" }) instead of silently returning 0.
  const rows = await query(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount END), 0) -
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) AS last_month_balance
    FROM transactions
    WHERE date < ?
  `, [firstDayOfMonth]);
  return Number(rows[0]?.last_month_balance) || 0;
}

/**
 * Calculate the "Previous Balance" (backward compatibility alias).
 * @param {string} fromDate 'YYYY-MM-DD'
 * @returns {Promise<number>}
 */
async function getPreviousBalance(fromDate) {
  return getYesterdayBalance(fromDate);
}

/**
 * Get this month's income, expense, and profit using MySQL date matching.
 * @param {string} [month] 'YYYY-MM'
 * @returns {Promise<{monthIncome: number, monthExpense: number, monthProfit: number}>}
 */
async function getMonthlyReport(month) {
  const m = (month || (new Date().toISOString().slice(0, 7))).trim();
  const pattern = `${m}-%`;
  // SQL failures propagate to the route so it can answer with HTTP 500.
  const rows = await query(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income'  AND (DATE_FORMAT(date, '%Y-%m') = ? OR date LIKE ?) THEN amount END), 0) AS month_income,
      COALESCE(SUM(CASE WHEN type = 'expense' AND (DATE_FORMAT(date, '%Y-%m') = ? OR date LIKE ?) THEN amount END), 0) AS month_expense
    FROM transactions
  `, [m, pattern, m, pattern]);
  const row = rows[0] || {};
  const monthIncome = Number(row.month_income) || 0;
  const monthExpense = Number(row.month_expense) || 0;
  return { monthIncome, monthExpense, monthProfit: monthIncome - monthExpense };
}

/**
 * Get all transactions for a single specific date (YYYY-MM-DD).
 * Fetches the manual text input head and amount fields (plus id, type, date).
 * @param {string} date 'YYYY-MM-DD'
 * @returns {Promise<Array<object>>}
 */
async function getDailyTransactions(date) {
  const d = (date || (new Date().toISOString().slice(0, 10))).trim();
  try {
    const rows = await query(
      `SELECT id, type, date, amount,
              COALESCE(NULLIF(head, ''), category, description, '') AS head
       FROM transactions
       WHERE date = ?
       ORDER BY id DESC`,
      [d]
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      date: typeof r.date === 'string' ? r.date.slice(0, 10) : (r.date ? new Date(r.date).toISOString().slice(0, 10) : ''),
      head: r.head || '—',
      category: r.head || '—',
      amount: Number(r.amount) || 0
    }));
  } catch (err) {
    console.error('[db] getDailyTransactions fallback:', err.message);
    const rows = await query(
      `SELECT id, type, date, amount,
              COALESCE(category, description, '') AS head
       FROM transactions
       WHERE date = ?
       ORDER BY id DESC`,
      [d]
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      date: typeof r.date === 'string' ? r.date.slice(0, 10) : (r.date ? new Date(r.date).toISOString().slice(0, 10) : ''),
      head: r.head || '—',
      category: r.head || '—',
      amount: Number(r.amount) || 0
    }));
  }
}

/**
 * Get all transactions for a selected month (YYYY-MM).
 * Uses MySQL date string matching: DATE_FORMAT(date, '%Y-%m') = ? OR date LIKE ?
 * Fetches the manual text input head and amount fields (plus id, type, date).
 * @param {string} month 'YYYY-MM'
 * @returns {Promise<Array<object>>}
 */
async function getMonthlyTransactions(month) {
  const m = (month || (new Date().toISOString().slice(0, 7))).trim();
  const pattern = `${m}-%`;
  try {
    const rows = await query(
      `SELECT id, type, date, amount,
              COALESCE(NULLIF(head, ''), category, description, '') AS head
       FROM transactions
       WHERE DATE_FORMAT(date, '%Y-%m') = ? OR date LIKE ?
       ORDER BY date DESC, id DESC`,
      [m, pattern]
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      date: typeof r.date === 'string' ? r.date.slice(0, 10) : (r.date ? new Date(r.date).toISOString().slice(0, 10) : ''),
      head: r.head || '—',
      category: r.head || '—',
      amount: Number(r.amount) || 0
    }));
  } catch (err) {
    console.error('[db] getMonthlyTransactions fallback:', err.message);
    const rows = await query(
      `SELECT id, type, date, amount,
              COALESCE(category, description, '') AS head
       FROM transactions
       WHERE DATE_FORMAT(date, '%Y-%m') = ? OR date LIKE ?
       ORDER BY date DESC, id DESC`,
      [m, pattern]
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      date: typeof r.date === 'string' ? r.date.slice(0, 10) : (r.date ? new Date(r.date).toISOString().slice(0, 10) : ''),
      head: r.head || '—',
      category: r.head || '—',
      amount: Number(r.amount) || 0
    }));
  }
}

/**
 * Get all transactions between two dates (inclusive), newest first.
 * Only fetches the manual text input head and amount fields (plus id, type, date).
 * @param {string} from 'YYYY-MM-DD'
 * @param {string} to   'YYYY-MM-DD'
 * @returns {Promise<Array<object>>}
 */
async function getFilteredTransactions(from, to) {
  try {
    const rows = await query(
      `SELECT id, type, date, amount,
              COALESCE(NULLIF(head, ''), category, description, '') AS head
       FROM transactions
       WHERE date BETWEEN ? AND ?
       ORDER BY date DESC, id DESC`,
      [from, to]
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      date: r.date,
      head: r.head || '—',
      category: r.head || '—',
      amount: Number(r.amount) || 0
    }));
  } catch (err) {
    const rows = await query(
      `SELECT id, type, date, amount,
              COALESCE(category, description, '') AS head
       FROM transactions
       WHERE date BETWEEN ? AND ?
       ORDER BY date DESC, id DESC`,
      [from, to]
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      date: r.date,
      head: r.head || '—',
      category: r.head || '—',
      amount: Number(r.amount) || 0
    }));
  }
}

// ============================================================
// Products (Inventory)
// ============================================================

/**
 * Add a new product. Selling price (price) is no longer set at creation
 * time — it is entered dynamically at the till. Defaults to 0.
 * @param {{name: string, purchase_price: number, stock: number, price?: number}} data
 * @returns {Promise<number>} The new product id
 */
async function addProduct(data) {
  const result = await execute(
    `INSERT INTO products (name, stock, purchase_price, price)
     VALUES (?, ?, ?, ?)`,
    [
      data.name.trim(),
      Number(data.stock) || 0,
      Number(data.purchase_price) || 0,
      Number(data.price) || 0
    ]
  );
  return result.insertId;
}

/**
 * Update an existing product (name, purchase price, or stock).
 */
async function updateProduct(id, data) {
  await execute(
    `UPDATE products
     SET name = ?, purchase_price = ?, stock = ?
     WHERE id = ?`,
    [
      data.name.trim(),
      Number(data.purchase_price) || 0,
      Number(data.stock) || 0,
      Number(id)
    ]
  );
}

/**
 * Get all products, ordered by name (case-insensitive).
 * @returns {Promise<Array<object>>}
 */
async function getProducts() {
  return query('SELECT id, name, stock, purchase_price, price, created_at FROM products ORDER BY LOWER(name) ASC');
}

/**
 * Get a single product by id.
 */
async function getProductById(id) {
  const rows = await query('SELECT id, name, stock, purchase_price, price FROM products WHERE id = ?', [Number(id)]);
  return rows.length ? rows[0] : null;
}

/**
 * Update product stock (used by restocking).
 */
async function updateProductStock(id, newStock) {
  await execute('UPDATE products SET stock = ? WHERE id = ?', [Number(newStock), Number(id)]);
}

/**
 * Delete a product by id.
 */
async function deleteProduct(id) {
  await execute('DELETE FROM products WHERE id = ?', [Number(id)]);
}

// ============================================================
// Sales
// ============================================================

/**
 * Record a sale: deducts stock from the product and inserts the sales row
 * atomically (single DB transaction). The selling price is entered by the
 * cashier and passed in as `unit_price`.
 * @param {{customer_name: string, product_id: number, quantity: number, unit_price: number, date: string, added_by: string, total_amount?: number}} data
 * @returns {Promise<{saleId: number, totalAmount: number, profit: number, unitProfit: number, unitPrice: number, purchasePrice: number, product: object}>}
 */
async function addSale(data) {
  const product = await getProductById(data.product_id);
  if (!product) {
    throw new Error('Product not found.');
  }

  const quantity = Number(data.quantity);
  if (!quantity || quantity <= 0) {
    throw new Error('Quantity must be greater than 0.');
  }
  if (Number(product.stock) < quantity) {
    throw new Error(`Insufficient stock. Only ${product.stock} item(s) available.`);
  }

  const unitPrice = Number(data.unit_price);
  if (Number.isNaN(unitPrice) || unitPrice < 0) {
    throw new Error('Please enter a valid selling price.');
  }

  const totalAmount = (data.total_amount !== undefined && Number(data.total_amount) > 0)
    ? Number(data.total_amount)
    : unitPrice * quantity;
  const saleDate = data.date || new Date().toISOString().slice(0, 10);
  const addedBy = data.added_by || '';

  const purchasePrice = Number(product.purchase_price) || 0;
  const unitProfit = unitPrice - purchasePrice;
  const profit = unitProfit * quantity;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Deduct stock
    await conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, Number(product.id)]);
    // Insert sale record (stores profit for tracking in reports)
    const saleRes = (await conn.execute(
      `INSERT INTO sales (customer_name, product_id, quantity, unit_price, purchase_price, unit_profit, profit, total_amount, date, added_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.customer_name.trim(),
        Number(product.id),
        quantity,
        unitPrice,
        purchasePrice,
        unitProfit,
        profit,
        totalAmount,
        saleDate,
        addedBy
      ]
    ))[0];
    await conn.commit();
    return {
      saleId: saleRes.insertId,
      totalAmount,
      profit,
      unitProfit,
      unitPrice,
      purchasePrice,
      product: { ...product, stock: Number(product.stock) - quantity }
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Record the matching Income ("Product Sale") transaction for a sale.
 * Called from the server right after the sale is inserted so the Dashboard
 * and History (which read from the transactions table) update instantly.
 * @param {{amount: number, date: string, description: string, added_by: string, profit?: number}} data
 * @returns {Promise<number>} The new transaction row id
 */
async function addSaleTransaction(data) {
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  try {
    const result = await execute(
      `INSERT INTO transactions (type, category, head, amount, date, description, added_by, profit)
       VALUES ('income', 'Product Sale', 'Product Sale', ?, ?, ?, ?, ?)`,
      [
        Number(data.amount),
        data.date || localToday,
        data.description || '',
        data.added_by || '',
        Number(data.profit) || 0
      ]
    );
    return result.insertId;
  } catch (err) {
    const result = await execute(
      `INSERT INTO transactions (type, category, amount, date, description, added_by, profit)
       VALUES ('income', 'Product Sale', ?, ?, ?, ?, ?)`,
      [
        Number(data.amount),
        data.date || localToday,
        data.description || '',
        data.added_by || '',
        Number(data.profit) || 0
      ]
    );
    return result.insertId;
  }
}

/**
 * Get all sales, newest first, joined with product names.
 * @returns {Promise<Array<object>>}
 */
async function getSales() {
  return query(`
    SELECT
      s.id,
      s.customer_name,
      s.product_id,
      p.name AS product_name,
      s.quantity,
      s.unit_price,
      s.purchase_price,
      s.unit_profit,
      s.profit,
      s.total_amount,
      s.date,
      s.added_by,
      s.created_at
    FROM sales s
    JOIN products p ON p.id = s.product_id
    ORDER BY s.date DESC, s.id DESC
  `);
}

/**
 * Get total sales revenue.
 * @returns {Promise<number>}
 */
async function getTotalSales() {
  const rows = await query('SELECT COALESCE(SUM(total_amount), 0) AS total_sales FROM sales');
  return Number(rows[0].total_sales);
}

// ============================================================
// Categories
// ============================================================

/**
 * Get all categories, optionally filtered by type.
 * @param {string} [type] 'income' or 'expense'
 * @returns {Promise<Array<object>>}
 */
async function getCategories(type) {
  if (type === 'income' || type === 'expense') {
    return query(
      `SELECT id, name, type FROM categories
       WHERE type = ?
       ORDER BY type ASC, LOWER(name) ASC`,
      [type]
    );
  }
  return query('SELECT id, name, type FROM categories ORDER BY type ASC, LOWER(name) ASC');
}

/**
 * Add a new category.
 * @returns {Promise<number>} The new category id
 */
async function addCategory(data) {
  const result = await execute(
    'INSERT INTO categories (name, type) VALUES (?, ?)',
    [data.name.trim(), data.type]
  );
  return result.insertId;
}

/**
 * Update an existing category by id.
 */
async function updateCategory(id, data) {
  await execute(
    'UPDATE categories SET name = ?, type = ? WHERE id = ?',
    [data.name.trim(), data.type, Number(id)]
  );
}

/**
 * Delete a category by id.
 */
async function deleteCategory(id) {
  await execute('DELETE FROM categories WHERE id = ?', [Number(id)]);
}

// ============================================================
// Users
// ============================================================

/**
 * Verify a user's credentials for login.
 * @returns {Promise<{id: number, username: string, role: string} | null>} The user (without password) or null if invalid.
 */
async function verifyUser(username, password) {
  const rows = await query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username.trim(), password]
  );
  if (!rows.length) return null;
  const user = rows[0];
  return {
    id: user.id,
    username: user.username,
    role: user.role || 'user',
    can_edit: Boolean(user.can_edit)
  };
}

/**
 * Get a user by ID.
 */
async function getUserById(id) {
  const rows = await query('SELECT id, username, role, can_edit FROM users WHERE id = ?', [Number(id)]);
  if (!rows.length) return null;
  return {
    id: rows[0].id,
    username: rows[0].username,
    role: rows[0].role || 'user',
    can_edit: Boolean(rows[0].can_edit)
  };
}

/**
 * Change a user's password after verifying their current password.
 * @returns {Promise<{id: number, username: string, role: string, can_edit: boolean}>}
 */
async function changePassword(id, currentPassword, newPassword) {
  const rows = await query('SELECT id, username, password, role, can_edit FROM users WHERE id = ?', [Number(id)]);
  if (!rows.length) {
    throw new Error('User not found.');
  }
  const user = rows[0];
  if (user.password !== currentPassword) {
    throw new Error('Current password is incorrect.');
  }
  await execute('UPDATE users SET password = ? WHERE id = ?', [newPassword, Number(id)]);
  return {
    id: user.id,
    username: user.username,
    role: user.role || 'user',
    can_edit: Boolean(user.can_edit)
  };
}

/**
 * Get all users (without passwords).
 * @returns {Promise<Array<object>>}
 */
async function getUsers() {
  const rows = await query('SELECT id, username, role, can_edit, created_at FROM users ORDER BY LOWER(username) ASC');
  return rows.map((r) => ({
    ...r,
    role: r.role || 'user',
    can_edit: Boolean(r.can_edit)
  }));
}

/**
 * Add a new user.
 * @returns {Promise<number>} The new user id
 */
async function addUser(data) {
  const canEdit = (data.can_edit === true || data.can_edit === 1 || data.can_edit === '1' || data.can_edit === 'true') ? 1 : 0;
  const result = await execute(
    'INSERT INTO users (username, password, role, can_edit) VALUES (?, ?, ?, ?)',
    [data.username.trim(), data.password, data.role || 'user', canEdit]
  );
  return result.insertId;
}

/**
 * Update an existing user by id. If the password is empty, only username,
 * role, and can_edit are updated (the existing password stays unchanged).
 */
async function updateUser(id, data) {
  const username = data.username.trim();
  const role = data.role || 'user';
  const canEdit = (data.can_edit === true || data.can_edit === 1 || data.can_edit === '1' || data.can_edit === 'true') ? 1 : 0;
  if (data.password) {
    await execute(
      'UPDATE users SET username = ?, password = ?, role = ?, can_edit = ? WHERE id = ?',
      [username, data.password, role, canEdit, Number(id)]
    );
  } else {
    await execute(
      'UPDATE users SET username = ?, role = ?, can_edit = ? WHERE id = ?',
      [username, role, canEdit, Number(id)]
    );
  }
}

/**
 * Delete a user by id. The default 'admin' user cannot be deleted.
 * @returns {Promise<boolean>} true if deleted, false if the admin user was protected
 */
async function deleteUser(id) {
  const rows = await query('SELECT * FROM users WHERE id = ?', [Number(id)]);
  if (!rows.length) {
    throw new Error('User not found.');
  }
  if (rows[0].username === 'admin') {
    throw new Error('The default admin user cannot be deleted.');
  }
  await execute('DELETE FROM users WHERE id = ?', [Number(id)]);
  return true;
}

// ============================================================
// Settings
// ============================================================

/**
 * Insert or update a setting by key. The third parameter re-uses the new
 * value in the ON DUPLICATE KEY UPDATE clause (avoids the deprecated
 * VALUES() syntax on MySQL 8.0.20+).
 */
async function saveSetting(key, value) {
  await execute(
    'INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
    [key, value, value]
  );
}

/**
 * Get a setting's value by key, or null if the key doesn't exist.
 * @returns {Promise<string | null>}
 */
async function getSetting(key) {
  const rows = await query('SELECT value FROM settings WHERE key_name = ?', [key]);
  return rows.length ? rows[0].value : null;
}

module.exports = {
  pingDatabase,
  initDatabase,
  migrateDatabase,
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getDailyStats,
  getYesterdayBalance,
  getLastMonthBalance,
  getDailyTransactions,
  getMonthlyTransactions,
  getMonthlyReport,
  getPreviousBalance,
  getFilteredTransactions,
  addProduct,
  updateProduct,
  getProducts,
  getProductById,
  updateProductStock,
  deleteProduct,
  addSale,
  addSaleTransaction,
  getSales,
  getTotalSales,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getUsers,
  getUserById,
  addUser,
  updateUser,
  deleteUser,
  verifyUser,
  changePassword,
  saveSetting,
  getSetting
};