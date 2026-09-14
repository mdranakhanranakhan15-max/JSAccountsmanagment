/**
 * JS NETWORK — client-side API bridge (replaces the old Electron preload.js).
 *
 * Exposes the exact same `window.api` interface the renderer already uses,
 * implemented with fetch() calls to the Express backend (server.js). The
 * server returns { success: true, ... } / { success: false, error } JSON,
 * so the rest of the frontend code (renderer.js) does not need to change.
 */
(function () {
  'use strict';

  const BASE = '/api';

  function getCurrentUser() {
    try {
      const saved = sessionStorage.getItem('accounts_current_user') || localStorage.getItem('accounts_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  }

  async function request(method, url, body) {
    const opts = { method: method, headers: {} };
    const user = getCurrentUser();
    if (user && user.id) {
      opts.headers['x-user-id'] = String(user.id);
      opts.headers['x-user-role'] = String(user.role || '');
    }
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(BASE + url, opts);
    } catch (err) {
      return { success: false, error: 'Network error: ' + err.message };
    }
    let json;
    try {
      json = await res.json();
    } catch (err) {
      return { success: false, error: 'Invalid server response (HTTP ' + res.status + ').' };
    }
    if (typeof json.success === 'undefined') {
      return { success: false, error: json.error || 'Unexpected server response.' };
    }
    return json;
  }

  window.api = {
    // Transactions
    addTransaction: (data) => request('POST', '/transactions', data),
    getAllTransactions: () => request('GET', '/transactions'),
    updateTransaction: (id, data) => {
      const user = getCurrentUser();
      const payload = { ...data };
      if (user && user.id && !payload.userId) {
        payload.userId = user.id;
      }
      return request('PUT', '/transactions/' + id, payload);
    },
    deleteTransaction: (id) => request('DELETE', '/transactions/' + id),
    getSummary: () => request('GET', '/transactions/summary'),
    getDailyStats: () => request('GET', '/transactions/daily-stats'),
    getDailyReport: (date) =>
      request('GET', '/transactions/daily-report' + (date ? '?date=' + encodeURIComponent(date) : '')),
    getMonthlyReport: (month) =>
      request('GET', '/transactions/monthly-report' + (month ? '?month=' + encodeURIComponent(month) : '')),
    getFilteredReports: (from, to) =>
      request('GET', '/transactions/filtered?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to)),

    // Products (Inventory)
    addProduct: (data) => request('POST', '/products', data),
    updateProduct: (id, data) => request('PUT', '/products/' + id, data),
    getAllProducts: () => request('GET', '/products'),
    getProductById: (id) => request('GET', '/products/' + id),
    updateProductStock: (id, stock) => request('PUT', '/products/' + id + '/stock', { stock: stock }),
    deleteProduct: (id) => request('DELETE', '/products/' + id),

    // Sales
    addSale: (data) => request('POST', '/sales', data),
    getAllSales: () => request('GET', '/sales'),
    getTotalSales: () => request('GET', '/sales/total'),

    // Categories
    getAllCategories: (type) =>
      request('GET', '/categories' + (type ? '?type=' + encodeURIComponent(type) : '')),
    addCategory: (data) => request('POST', '/categories', data),
    updateCategory: (id, data) => request('PUT', '/categories/' + id, data),
    deleteCategory: (id) => request('DELETE', '/categories/' + id),

    // Users
    getAllUsers: () => request('GET', '/users'),
    addUser: (data) => request('POST', '/users', data),
    updateUser: (id, data) => request('PUT', '/users/' + id, data),
    deleteUser: (id) => request('DELETE', '/users/' + id),

    // Auth
    login: (username, password) => request('POST', '/auth/login', { username: username, password: password }),
    changePassword: (id, currentPassword, newPassword) =>
      request('POST', '/auth/change-password', { id: id, currentPassword: currentPassword, newPassword: newPassword }),

    // Settings
    saveSetting: (key, value) => request('POST', '/settings', { key: key, value: value }),
    getSetting: (key) => request('GET', '/settings/' + encodeURIComponent(key)),

    // CSV Backup — in the browser this triggers a file download instead of
    // the desktop app's native "Save As" dialog.
    saveCsvBackup: (csv) => {
      try {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const today = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        a.download = 'js-network-backup-' + today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate()) + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return Promise.resolve({ success: true });
      } catch (err) {
        return Promise.resolve({ success: false, error: err.message });
      }
    }
  };
})();