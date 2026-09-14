# 💰 JS NETWORK

A **web-based** shop management app with inventory, sales, income/expense tracking, user roles and printable receipts — built with **Node.js**, **Express** and **MySQL**. Designed for **cPanel shared hosting** deployment.

Previous versions were an offline Electron + SQLite desktop app; this release migrates the storage to **MySQL** and serves the same UI over HTTP.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Dashboard** | Total income, total expense, current balance & today's totals |
| ➕ **Add Transactions** | Form with date, category, amount & description |
| 📋 **History Table** | View all transactions with search, type & category filters |
| ✏️ **Edit / 🗑️ Delete** | Full edit form + confirmation modal for deletes |
| 📦 **Inventory & Sales** | Products, stock control, dynamic selling-price at the till, profit tracking |
| 🗂️ **Categories** | Manage income / expense categories |
| 👥 **Users** | Role-based accounts (admin / editor / viewer) |
| 🖨️ **Print Receipt** | Simple POS-style receipt for each sale |
| 💾 **CSV Backup** | One-click download of all transactions |
| 🗄️ **MySQL Storage** | Data persisted in MySQL (shared-hosting friendly) |

---

## 📁 Project Structure

```
js-network/
├── server.js                  # Express web server + REST API
├── package.json               # Project config & scripts
├── .env.example               # Template for MySQL credentials (copy to .env)
├── src/
│   ├── db.js                  # MySQL data layer (mysql2 connection pool)
│   ├── index.html             # UI markup
│   ├── style.css              # Styles
│   ├── api.js                 # Client-side window.api bridge (fetch-based)
│   └── renderer.js            # Frontend logic (vanilla JS)
└── scripts/
    ├── generate-icons.js      # Generates app icons (legacy, optional)
    └── verify-elements.js     # Static HTML/JS element consistency check
```

---

## 🚀 Getting Started (Local Development)

### 1. Create the database

```sql
CREATE DATABASE js_network CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The app auto-creates all tables on first start.

### 2. Configure credentials

```bash
cp .env.example .env
# edit .env and set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
```

### 3. Install dependencies & run

```bash
npm install
npm start
```

Then open **http://localhost:3000**.

Default login: **admin / 123456**

---

## ☁️ Deployment on cPanel Shared Hosting

1. Upload the project folder (excluding `node_modules`) to your hosting account.
2. In cPanel open **Setup Node.js App** and create an app:
   - **Application root:** your project directory
   - **Application URL:** your domain / subdomain
   - **Application startup file:** `server.js`
   - **Environment variables:** add `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (and `PORT` if required — cPanel usually injects this)
3. In **MySQL Databases**: create the database + user, then add the user to the database with **ALL PRIVILEGES**.
4. Restart the Node.js app (or run `npm start` after `npm install`).

The server listens on `0.0.0.0`, serves the frontend from `src/`, and exposes the JSON API under `/api/*`.

---

## 🔌 API Overview

All endpoints accept/return JSON with a `{ "success": true|false, ... }` envelope.

| Method & Path | Purpose |
|---|---|
| `GET  /api/health` | Database connectivity check |
| `GET  /api/transactions` · `POST` · `PUT /:id` · `DELETE /:id` | Transactions CRUD |
| `GET  /api/transactions/summary` | Global totals |
| `GET  /api/transactions/daily-stats` | Today's totals |
| `GET  /api/transactions/monthly-report` | Current month totals |
| `GET  /api/transactions/filtered?from=&to=` | Date-range report |
| `GET  /api/products` · `POST` · `PUT /:id` · `DELETE /:id` | Products CRUD |
| `PUT  /api/products/:id/stock` | Restock |
| `POST /api/sales` · `GET /api/sales` · `GET /api/sales/total` | Sales |
| `GET  /api/categories?type=` · `POST` · `PUT /:id` · `DELETE /:id` | Categories |
| `GET  /api/users` · `POST` · `PUT /:id` · `DELETE /:id` | Users |
| `POST /api/auth/login` | Login |
| `POST /api/auth/change-password` | Change password |
| `POST /api/settings` · `GET /api/settings/:key` | Settings |

---

## 🧠 Tech Stack

- **Express** — web server & REST API
- **mysql2** — MySQL connection pool (async/await)
- **dotenv** — environment configuration
- **cors** — cross-origin support
- **Vanilla HTML/CSS/JS** — frontend (no frameworks, no build step)

---

## 🔒 Notes on Security

- Passwords are stored as-is (same behaviour as the original offline app). For production, consider hashing passwords (e.g. `bcrypt`) and adding sessions/JWT auth.
- Database credentials live only in `.env` (git-ignored) or the cPanel environment variables.
- The login background image is stored as a data URL in the `settings` table.

---

## 📜 License

MIT