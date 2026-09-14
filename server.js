/**
 * JS NETWORK — web server (replaces the old Electron main process).
 *
 * Serves the frontend (src/index.html, CSS, client-side JS) as static files
 * and exposes a JSON REST API that mirrors the old Electron IPC handlers so
 * the client-side renderer keeps working through the same `window.api`
 * interface (see src/api.js).
 *
 * Database access goes through src/db.js, which uses a MySQL connection
 * pool configured with environment variables (DB_HOST, DB_USER, DB_PASSWORD,
 * DB_NAME, DB_PORT — see .env.example).
 */
'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const {
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
} = require('./src/db');

const app = express();

// Allow cross-origin requests (harmless for same-origin setups, required when
// the frontend is served from a different subdomain/port than the API).
app.use(cors());

// The login background image is stored as a Base64 data URL, so allow a large
// JSON body to accommodate it.
app.use(express.json({ limit: '25mb' }));

const PORT = Number(process.env.PORT || 3000);

// Return today's date as YYYY-MM-DD in local time (used to sync sale
// transactions so the Dashboard "Today's Income" card updates instantly).
function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Normalise a report query parameter to 'YYYY-MM-DD' (Daily reports).
// Accepts ?date=2026-09-13, ?date=2026-09 or ?from=2026-09-13.
function normalizeDateParam(value) {
  const raw = String(value == null ? '' : value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!match) return todayISO();
  return `${match[1]}-${match[2]}-${match[3] || '01'}`;
}

// Normalise a report query parameter to 'YYYY-MM' (Monthly reports).
// Accepts ?month=2026-09, ?date=2026-09-13 or ?from=2026-09-01.
function normalizeMonthParam(value) {
  const raw = String(value == null ? '' : value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})/);
  if (!match) return todayISO().slice(0, 7);
  return `${match[1]}-${match[2]}`;
}

// MySQL server error codes / OS errnos that mean "cannot connect to the
// database" (access denied, unknown database, refused, too many connections,
// server gone away, …). These are handled with a generic message so raw
// credentials/details never leak into the frontend UI.
const DB_CONNECTION_ERROR_CODES = new Set([1040, 1041, 1044, 1045, 1049, 1203, 2002, 2003, 2013, 2026, 2055]);
const DB_CONNECTION_ERRNOS = new Set([8, 32, 61, 104, 110, 111, 113]);
const DB_CONNECTION_MESSAGE_PATTERN =
  /access denied|unknown database|can'?t connect|connection refused|too many connections|failed to connect|authentication|server has gone away|timed ?out|not allowed|packets? out of order/i;

function isDatabaseConnectionError(err) {
  if (!err) return false;
  const code = Number(err.code || err.errno || -1);
  if (DB_CONNECTION_ERROR_CODES.has(code) || DB_CONNECTION_ERRNOS.has(code)) return true;
  return DB_CONNECTION_MESSAGE_PATTERN.test(String(err.message || ''));
}

/**
 * Return a user-safe error message. Database connection problems become the
 * generic "Database connection failed"; everything else keeps its message.
 */
function friendlyErrorMessage(err) {
  if (isDatabaseConnectionError(err)) return 'Database connection failed';
  return err.message || 'Server error';
}

// MySQL error codes that are user-input conflicts rather than query
// failures (duplicate key, FK violation, value too long / out of range).
// These keep the friendly 200 { success:false } contract so forms can show
// their specific message; every other database error becomes HTTP 500.
const DATA_INTEGRITY_ERROR_CODES = new Set([1062, 1169, 1264, 1366, 1406, 1451, 1452]);

/**
 * True when the error came from the database itself (connection failure or a
 * failed SQL statement) rather than from our own validation/business rules.
 */
function isDatabaseQueryError(err) {
  if (!err) return false;
  if (isDatabaseConnectionError(err)) return true;
  const code = Number(err.code);
  if (!Number.isFinite(code) || code < 1000 || code > 1999) return false;
  return !DATA_INTEGRITY_ERROR_CODES.has(code);
}

/**
 * Wrap an async route handler so every endpoint returns the same
 * { success: true|false, ... | error } contract the frontend expects.
 */
function wrap(handler) {
  return async (req, res) => {
    try {
      const result = await handler(req, res);
      if (res.headersSent) return;
      res.json(result === undefined ? { success: true } : result);
    } catch (err) {
      console.error(`[api] ${req.method} ${req.originalUrl || req.url} failed:`, err.message);

      // Database connection / SQL failures -> HTTP 500 with a descriptive
      // JSON body (never an HTML error page). The frontend reads `error`
      // and `code` from the JSON regardless of the HTTP status.
      if (isDatabaseQueryError(err)) {
        return res.status(500).json({
          success: false,
          error: isDatabaseConnectionError(err) ? 'Database connection failed' : 'Database query failed',
          code: 'db_error'
        });
      }

      // Validation / business-rule errors keep the 200 + success:false contract.
      res.status(200).json({ success: false, error: friendlyErrorMessage(err) });
    }
  };
}

// ============================================================
// Health check (useful for cPanel deployment diagnostics)
// ============================================================
app.get('/api/health', async (req, res) => {
  try {
    await poolPing();
    res.json({ success: true, status: 'ok', name: 'JS NETWORK' });
  } catch (err) {
    console.error('[api] /api/health failed:', err.message);
    res.status(200).json({
      success: false,
      status: 'error',
      error: friendlyErrorMessage(err),
      code: isDatabaseConnectionError(err) ? 'db_error' : undefined
    });
  }
});

// ============================================================
// Transactions
// ============================================================
app.get('/api/transactions', wrap(async () => ({
  success: true,
  data: await getTransactions()
})));

app.get('/api/transactions/summary', wrap(async () => ({
  success: true,
  ...(await getSummary())
})));

app.get('/api/transactions/daily-stats', wrap(async () => ({
  success: true,
  ...(await getDailyStats())
})));

app.get(['/api/transactions/monthly-report', '/api/reports/monthly'], wrap(async (req) => {
  const month = normalizeMonthParam(req.query.month || req.query.date || req.query.from);
  const [data, lastMonthBalance, summary] = await Promise.all([
    getMonthlyTransactions(month),
    getLastMonthBalance(month),
    getMonthlyReport(month)
  ]);
  return {
    success: true,
    month,
    data,
    lastMonthBalance,
    yesterdayBalance: lastMonthBalance,
    previousBalance: lastMonthBalance,
    ...summary
  };
}));

app.get(['/api/transactions/daily-report', '/api/reports/daily'], wrap(async (req) => {
  const date = normalizeDateParam(req.query.date || req.query.from);
  const [data, yesterdayBalance] = await Promise.all([
    getDailyTransactions(date),
    getYesterdayBalance(date)
  ]);
  return {
    success: true,
    date,
    data,
    yesterdayBalance,
    previousBalance: yesterdayBalance
  };
}));

app.get('/api/transactions/filtered', wrap(async (req) => {
  const date = req.query.date;
  const from = date || req.query.from || todayISO();
  const to = date || req.query.to || from;
  if (from === to) {
    const [data, yesterdayBalance] = await Promise.all([
      getDailyTransactions(from),
      getYesterdayBalance(from)
    ]);
    return {
      success: true,
      data,
      yesterdayBalance,
      previousBalance: yesterdayBalance
    };
  }
  const [data, yesterdayBalance] = await Promise.all([
    getFilteredTransactions(from, to),
    getYesterdayBalance(from)
  ]);
  return {
    success: true,
    data,
    yesterdayBalance,
    previousBalance: yesterdayBalance
  };
}));

app.post('/api/transactions', wrap(async (req) => ({
  success: true,
  id: await addTransaction(req.body)
})));

async function getRequestingUser(req) {
  const userId = req.headers['x-user-id'] || (req.body && (req.body.userId || req.body.user_id)) || req.query.userId;
  if (!userId) return null;
  try {
    return await getUserById(userId);
  } catch (_) {
    return null;
  }
}

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const user = await getRequestingUser(req);
    if (!user || (!user.can_edit && user.role !== 'admin')) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to edit transactions.' });
    }
    await updateTransaction(req.params.id, req.body);
    return res.json({ success: true });
  } catch (err) {
    console.error('Update transaction failed:', err);
    return res.status(500).json({ success: false, error: friendlyErrorMessage(err) });
  }
});

app.patch('/api/transactions/:id', async (req, res) => {
  try {
    const user = await getRequestingUser(req);
    if (!user || (!user.can_edit && user.role !== 'admin')) {
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to edit transactions.' });
    }
    await updateTransaction(req.params.id, req.body);
    return res.json({ success: true });
  } catch (err) {
    console.error('Patch transaction failed:', err);
    return res.status(500).json({ success: false, error: friendlyErrorMessage(err) });
  }
});

app.delete('/api/transactions/:id', wrap(async (req) => {
  await deleteTransaction(req.params.id);
  return { success: true };
}));

// ============================================================
// Products (Inventory)
// ============================================================
app.get('/api/products', wrap(async () => ({
  success: true,
  data: await getProducts()
})));

app.post('/api/products', wrap(async (req) => ({
  success: true,
  id: await addProduct(req.body)
})));

app.put('/api/products/:id', wrap(async (req) => {
  await updateProduct(req.params.id, req.body);
  return { success: true };
}));

app.get('/api/products/:id', wrap(async (req) => {
  const product = await getProductById(req.params.id);
  if (!product) return { success: false, error: 'Product not found.' };
  return { success: true, data: product };
}));

app.put('/api/products/:id/stock', wrap(async (req) => {
  await updateProductStock(req.params.id, req.body.stock);
  return { success: true };
}));

app.delete('/api/products/:id', wrap(async (req) => {
  await deleteProduct(req.params.id);
  return { success: true };
}));

// ============================================================
// Sales
// ============================================================
app.post('/api/sales', wrap(async (req) => {
  const data = req.body;
  const result = await addSale(data);
  // result = { saleId, totalAmount (exact amount incl. discount),
  //            profit, unitProfit, purchasePrice, product }
  // Sync the exact same data into the transactions table so the Dashboard
  // can read it globally. Profit is stored in the `profit` column so the
  // History screen can display it with a green color.
  const description = `${result.product.name} × ${data.quantity}`;
  const transactionId = await addSaleTransaction({
    amount: result.totalAmount,
    date: todayISO(),
    description,
    added_by: data.added_by || '',
    profit: result.profit
  });
  return { success: true, data: { ...result, transactionId } };
}));

app.get('/api/sales', wrap(async () => ({
  success: true,
  data: await getSales()
})));

app.get('/api/sales/total', wrap(async () => ({
  success: true,
  total: await getTotalSales()
})));

// ============================================================
// Categories
// ============================================================
app.get('/api/categories', wrap(async (req) => ({
  success: true,
  data: await getCategories(req.query.type)
})));

app.post('/api/categories', wrap(async (req) => ({
  success: true,
  id: await addCategory(req.body)
})));

app.put('/api/categories/:id', wrap(async (req) => {
  await updateCategory(req.params.id, req.body);
  return { success: true };
}));

app.delete('/api/categories/:id', wrap(async (req) => {
  await deleteCategory(req.params.id);
  return { success: true };
}));

// ============================================================
// Users
// ============================================================
app.get('/api/users', async (req, res) => {
  try {
    const user = await getRequestingUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }
    const users = await getUsers();
    return res.json({ success: true, data: users });
  } catch (err) {
    console.error('Get users failed:', err);
    return res.status(500).json({ success: false, error: friendlyErrorMessage(err) });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await getRequestingUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }
    const id = await addUser(req.body);
    return res.json({ success: true, id });
  } catch (err) {
    console.error('Add user failed:', err);
    return res.status(500).json({ success: false, error: friendlyErrorMessage(err) });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await getRequestingUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }
    await updateUser(req.params.id, req.body);
    return res.json({ success: true });
  } catch (err) {
    console.error('Update user failed:', err);
    return res.status(500).json({ success: false, error: friendlyErrorMessage(err) });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await getRequestingUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }
    await deleteUser(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete user failed:', err);
    return res.status(500).json({ success: false, error: friendlyErrorMessage(err) });
  }
});

// ============================================================
// Auth
// ============================================================
app.post('/api/auth/login', wrap(async (req) => {
  const user = await verifyUser(req.body.username, req.body.password);
  if (!user) {
    return { success: false, error: 'Invalid username or password.', code: 'invalid_credentials' };
  }
  return { success: true, user };
}));

app.post('/api/auth/change-password', wrap(async (req) => {
  const user = await changePassword(req.body.id, req.body.currentPassword, req.body.newPassword);
  return { success: true, user };
}));

// ============================================================
// Settings
// ============================================================
app.post('/api/settings', wrap(async (req) => {
  await saveSetting(req.body.key, req.body.value);
  return { success: true };
}));

app.get('/api/settings/:key', wrap(async (req) => ({
  success: true,
  value: await getSetting(req.params.key)
})));

// ============================================================
// API 404 — unknown API paths answer with JSON, never an HTML page
// ============================================================
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl || req.url
  });
});

// ============================================================
// Static frontend (index.html, style.css, api.js, renderer.js, assets)
// ============================================================
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static('src'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// ============================================================
// Final error handler — always JSON, never a generic HTML error page
// ============================================================
app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err && err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({
    success: false,
    error: 'Database query failed',
    code: 'db_error'
  });
});

// Small helper so /api/health can verify DB connectivity without importing
// the pool's internal state into this module.
function poolPing() {
  const { pingDatabase } = require('./src/db');
  return pingDatabase();
}

// ============================================================
// Bootstrap: initialize the schema, then start the web server.
// Handles cPanel-style hosted Node apps where PORT is injected.
// ============================================================
(async () => {
  try {
    await initDatabase();
    await migrateDatabase();
    console.log('[server] Database ready (MySQL).');
  } catch (err) {
    // Do not exit: the endpoint layer will return { success:false, error }
    // until the database credentials are fixed.
    console.error('[server] Database initialization failed:', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JS NETWORK server running at http://localhost:${PORT}`);
  });
})();