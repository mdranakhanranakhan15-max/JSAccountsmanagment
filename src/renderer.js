/* ============================================================
   JS NETWORK — renderer (frontend logic)
   ============================================================ */

'use strict';

// ---------- i18n helpers (see src/i18n.js) ----------
// tr('key') / tr('key', { name: 'x' }) returns the string for the current
// language (English or Bengali) and falls back to the key when missing.
const tr = (key, vars) => (window.i18n && window.i18n.t ? window.i18n.t(key, vars) : key);
// Translate any [data-i18n] markup that was injected just now.
const applyI18n = (root) => {
  if (window.i18n && window.i18n.apply) window.i18n.apply(root);
};
// Locale used for date / time formatting ('en-US' or 'bn-BD').
const uiLocale = () => (window.i18n && window.i18n.locale ? window.i18n.locale() : 'en-US');
const isBengali = () => Boolean(window.i18n && window.i18n.getLanguage && window.i18n.getLanguage() === 'bn');

// Set a translated label AND remember which key produced it, so a language
// switch re-translates the same element correctly.
function setI18nText(el, key, vars) {
  if (!el) return;
  el.setAttribute('data-i18n', key);
  el.textContent = tr(key, vars);
}

// For labels built from data (e.g. `Update details for "Product X"`): the text
// cannot come from a plain dictionary key, so drop the data-i18n hook.
function setDynamicText(el, text) {
  if (!el) return;
  el.removeAttribute('data-i18n');
  el.textContent = text;
}

// ---------- State ----------
let currentUser = null;
let allTransactions = [];
let allProducts = [];
let allSales = [];
let allCategories = [];
let allUsers = [];
let deleteTargetId = null;
let deleteTargetTransaction = null;
let editingId = null;
let transactionMode = 'income';
let editingUserId = null;
let categoryEditingId = null;
let productEditingId = null;
let lastKnownDate = new Date().getDate();
// Last rendered payloads — used to re-render after a language switch.
let lastDailyRows = null;
let lastDailyYesterdayBalance = 0;
let lastRecentTransactions = [];
let lastMonthlyRows = null;
let lastMonthlyBalance = 0;

// ---------- Element references ----------
const $ = (sel) => document.querySelector(sel);

const els = {
  // Login
  loginContainer: $('#login-container'),
  loginForm: $('#login-form'),
  loginUsername: $('#login-username'),
  loginPassword: $('#login-password'),
  loginFormError: $('#login-form-error'),
  btnLogin: $('#btn-login'),

  // Main app
  mainAppContainer: $('#main-app-container'),
  sidebarUserName: $('#sidebar-user-name'),
  btnLogout: $('#btn-logout'),
  btnHamburger: $('#btn-hamburger'),
  sidebarOverlay: $('#sidebar-overlay'),

  // App Settings (Login Background)
  loginBgInput: $('#login-bg-input'),
  btnSaveBackground: $('#btn-save-background'),
  appSettingsError: $('#app-settings-error'),

  // Change Password
  changePasswordForm: $('#change-password-form'),
  cpCurrentPassword: $('#cp-current-password'),
  cpNewPassword: $('#cp-new-password'),
  cpConfirmPassword: $('#cp-confirm-password'),
  changePasswordFormError: $('#change-password-form-error'),
  changePasswordFormSuccess: $('#change-password-form-success'),
  btnUpdatePassword: $('#btn-update-password'),

  // Navigation
  navItems: document.querySelectorAll('.nav-subitem'),
  navGroupToggles: document.querySelectorAll('.nav-group-toggle'),
  navSubmenus: document.querySelectorAll('.nav-submenu'),
  views: document.querySelectorAll('.view'),

  // Dashboard
  todayIncome: $('#today-income'),
  todayExpense: $('#today-expense'),
  cashInHand: $('#cash-in-hand'),
  cashCard: $('#cash-card'),
  dashboardDate: $('#dashboard-date'),
  recentList: $('#recent-list'),
  menuDailyReport: $('#menu-daily-report'),
  dailyReportSection: $('#daily-report-section'),
  filterFromDate: $('#filter-from-date'),
  filterToDate: $('#filter-to-date'),
  btnSearchDate: $('#btn-search-date'),
  btnPrintDailyReport: $('#btn-print-daily-report'),
  printDailyDate: $('#print-daily-date'),
  dailyPreviousBalance: $('#daily-previous-balance'),
  reportIncomeBody: $('#report-income-body'),
  reportExpenseBody: $('#report-expense-body'),
  reportTotalIncome: $('#report-total-income'),
  reportTableTotalIncome: $('#report-table-total-income'),
  reportTotalExpense: $('#report-total-expense'),
  reportTableTotalExpense: $('#report-table-total-expense'),
  reportTodayCash: $('#report-today-cash'),
  reportCashInHand: $('#report-cash-in-hand'),

  // Monthly Report
  monthlyReportSubtitle: $('#monthly-report-subtitle'),
  monthlyMonthPicker: $('#monthly-month-picker'),
  btnMonthlySearch: $('#btn-monthly-search'),
  btnPrintMonthlyReport: $('#btn-print-monthly-report'),
  printMonthlyDate: $('#print-monthly-date'),
  monthlyPreviousBalance: $('#monthly-previous-balance'),
  monthlyReportIncomeBody: $('#monthly-report-income-body'),
  monthlyReportExpenseBody: $('#monthly-report-expense-body'),
  monthlyReportTotalIncome: $('#monthly-report-total-income'),
  monthlyReportTableTotalIncome: $('#monthly-report-table-total-income'),
  monthlyReportTotalExpense: $('#monthly-report-total-expense'),
  monthlyReportTableTotalExpense: $('#monthly-report-table-total-expense'),
  monthlyReportMonthCash: $('#monthly-report-month-cash'),
  monthlyReportCashInHand: $('#monthly-report-cash-in-hand'),

  // Transaction Form (single vertical form with Income/Expense mode toggle)
  transactionForm: $('#transaction-form'),
  transactionEditId: $('#transaction-edit-id'),
  transactionDate: $('#transaction-date'),
  transactionHead: $('#transaction-head'),
  transactionHeadLabel: $('#transaction-head-label'),
  transactionAmount: $('#transaction-amount'),
  transactionNote: $('#transaction-note'),
  transactionFormError: $('#transaction-form-error'),
  transactionFormTitle: $('#transaction-form-title'),
  btnSaveTransaction: $('#btn-save-transaction'),
  btnCancelTransactionEdit: $('#btn-cancel-transaction-edit'),
  btnModeIncome: $('#btn-mode-income'),
  btnModeExpense: $('#btn-mode-expense'),

  // History
  historyBody: $('#history-body'),
  historyBodyIncome: $('#history-body-income'),
  historyBodyExpense: $('#history-body-expense'),
  historyCount: $('#history-count'),
  historyCountIncome: $('#history-count-income'),
  historyCountExpense: $('#history-count-expense'),
  searchInput: $('#search-input'),
  historyFromDate: $('#history-from-date'),
  historyToDate: $('#history-to-date'),
  btnPrintHistory: $('#btn-print-history'),
  printHistoryDate: $('#print-history-date'),
  printHistoryReportTitle: $('#print-history-report-title'),
  historyTabs: document.querySelectorAll('.history-tab'),
  historyPanels: document.querySelectorAll('.history-tab-panel'),
  historySummaryContainer: $('#history-summary-cards'),
  historyCardIncome: $('#history-card-income'),
  historyCardExpense: $('#history-card-expense'),
  historyCardBalance: $('#history-card-balance'),
  summaryTotalIncome: $('#summary-total-income'),
  summaryTotalExpense: $('#summary-total-expense'),
  summaryBalance: $('#summary-balance'),

  // Categories
  categoryForm: $('#category-form'),
  categoryFormTitle: $('#category-form-title'),
  categoryName: $('#category-name'),
  categoryType: $('#category-type'),
  categoryFormError: $('#category-form-error'),
  btnAddCategory: $('#btn-add-category'),
  btnCancelCategoryEdit: $('#btn-cancel-category-edit'),
  categoryTableBody: $('#category-table-body'),
  categoryCount: $('#category-count'),
  btnRefreshCategories: $('#btn-refresh-categories'),

  // Users
  userForm: $('#user-form'),
  userUsername: $('#user-username'),
  userPassword: $('#user-password'),
  userRole: $('#user-role'),
  userCanEdit: $('#user-can-edit'),
  userFormError: $('#user-form-error'),
  btnCreateUser: $('#btn-create-user'),
  userFormTitle: $('#user-form-title'),
  userTableBody: $('#user-table-body'),
  userCount: $('#user-count'),
  btnRefreshUsers: $('#btn-refresh-users'),

  // Inventory
  productForm: $('#product-form'),
  productFormTitle: $('#product-form-title'),
  productFormSubtitle: $('#product-form-subtitle'),
  productName: $('#product-name'),
  productPurchasePrice: $('#product-purchase-price'),
  productStock: $('#product-stock'),
  productFormError: $('#product-form-error'),
  btnAddProduct: $('#btn-add-product'),
  btnCancelProductEdit: $('#btn-cancel-product-edit'),
  productTableBody: $('#product-table-body'),
  productCount: $('#product-count'),
  btnRefreshProducts: $('#btn-refresh-products'),

  // Sell Product
  saleForm: $('#sale-form'),
  customerName: $('#customer-name'),
  saleDate: $('#sale-date'),
  saleProduct: $('#sale-product'),
  saleQuantity: $('#sale-quantity'),
  saleDiscount: $('#sale-discount'),
  saleSellingPrice: $('#sale-selling-price'),
  saleFormError: $('#sale-form-error'),
  btnSellProduct: $('#btn-sell-product'),
  saleUnitPurchasePrice: $('#sale-unit-purchase-price'),
  saleUnitProfit: $('#sale-unit-profit'),
  saleTotalAmount: $('#sale-total-amount'),
  salesTableBody: $('#sales-table-body'),
  salesCount: $('#sales-count'),
  btnRefreshSales: $('#btn-refresh-sales'),
  salesPanel: $('#sales-panel'),

  // Invoice / Receipt
  invoiceContainer: $('#invoice-container'),
  invoiceCustomer: $('#invoice-customer'),
  invoiceDate: $('#invoice-date'),
  invoiceProduct: $('#invoice-product'),
  invoiceQty: $('#invoice-qty'),
  invoiceTotal: $('#invoice-total'),
  invoiceGrandTotal: $('#invoice-grand-total'),
  btnPrintInvoice: $('#btn-print-invoice'),
  btnNewSale: $('#btn-new-sale'),

  // Modal
  modalOverlay: $('#modal-overlay'),
  modalMessage: $('#modal-message'),
  btnModalCancel: $('#btn-modal-cancel'),
  btnModalConfirm: $('#btn-modal-confirm'),

  // Edit Transaction Modal
  editTxModalOverlay: $('#edit-tx-modal-overlay'),
  editTxForm: $('#edit-tx-form'),
  editTxId: $('#edit-tx-id'),
  editTxDate: $('#edit-tx-date'),
  editTxHead: $('#edit-tx-head'),
  editTxAmount: $('#edit-tx-amount'),
  editTxError: $('#edit-tx-error'),
  btnEditTxCancel: $('#btn-edit-tx-cancel'),
  btnEditTxSave: $('#btn-edit-tx-save'),

  // Toast
  toastContainer: $('#toast-container'),

  // Misc buttons
  btnViewAll: $('#btn-view-all'),
  btnRefresh: $('#btn-refresh'),
  btnBackup: $('#btn-backup'),
  salesTfootTotal: $('#sales-tfoot-total'),
  salesTfootProfit: $('#sales-tfoot-profit')
};

// ---------- Helpers ----------
function formatCurrency(value) {
  const num = Number(value) || 0;
  return 'Tk ' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
  const months = isBengali() ? monthsBn : monthsEn;
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const y = parseInt(parts[0], 10);
  return `${months[m] || '?'} ${d}, ${y}`;
}

function updateDashboardDateText(date = new Date()) {
  const currentDateEl = $('#current-date');
  if (currentDateEl) {
    currentDateEl.textContent = date.toLocaleDateString(uiLocale(), {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  if (els.monthlyReportDate) {
    els.monthlyReportDate.textContent = date.toLocaleDateString(uiLocale(), {
      month: 'long',
      year: 'numeric'
    });
  }
}

async function startDigitalClock() {
  const clockEl = $('#digital-clock');
  if (!clockEl) return;

  const tick = async () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString(uiLocale(), {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    updateDashboardDateText(now);

    const currentDay = now.getDate();
    if (currentDay !== lastKnownDate) {
      lastKnownDate = currentDay;
      await refreshDashboard();
    }
  };

  tick();
  setInterval(tick, 1000);
}

function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCategoryIcon(category) {
  const map = {
    'Salary': '💼', 'Business': '🏪', 'Investment': '📈', 'Freelance': '💻',
    'Gift': '🎁', 'Other Income': '💰', 'Sales': '🛒', 'Mobile Sale': '📱',
    'Accessories': '🎧', 'Servicing': '🔧', 'Shop Rent': '🏪',
    'Food': '🍔', 'Transport': '🚗', 'Rent': '🏠', 'Utilities': '💡',
    'Shopping': '🛍️', 'Health': '🏥', 'Entertainment': '🎬', 'Other Expense': '📦'
  };
  return map[category] || '•';
}

// ---------- Role-Based Access Control (RBAC) ----------
function userCanEditTransactions() {
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.can_edit === true || currentUser.can_edit === 1;
}

// Applied after every successful login.
function applyPermissions() {
  const isViewOnly = currentUser && currentUser.role === 'view';
  const isAdmin = currentUser && currentUser.role === 'admin';
  const canEditTx = userCanEditTransactions();

  // Primary action / submit buttons
  const actionButtons = [
    els.btnSellProduct,
    els.btnSaveTransaction,        // Save / Update Transaction
    els.btnAddCategory,
    els.btnAddProduct,
    els.btnCreateUser,
    els.btnUpdatePassword,
    els.btnPrintInvoice,
    els.btnNewSale
  ];

  actionButtons.forEach((btn) => {
    if (!btn) return;
    btn.disabled = isViewOnly;
    btn.classList.toggle('disabled', isViewOnly);
  });

  // Refresh buttons remain usable so view-only users can reload data.
  // Disable the cancel/edit buttons that trigger mutations.
  const editButtons = [els.btnCancelTransactionEdit, els.btnCancelCategoryEdit, els.btnCancelProductEdit];
  editButtons.forEach((btn) => {
    if (!btn) return;
    btn.disabled = isViewOnly;
    btn.classList.toggle('disabled', isViewOnly);
  });

  // Restrict Manage Users and Add User nav items exclusively to Admin
  document.querySelectorAll('.nav-subitem[data-view="users"]').forEach((btn) => {
    btn.style.display = isAdmin ? '' : 'none';
  });

  // Conditionally show/hide ACTIONS column headers in History tables
  document.querySelectorAll('.history-actions-col').forEach((th) => {
    th.style.display = canEditTx ? '' : 'none';
  });

  // Optionally disable the write-focused nav items for view-only users
  // (Sell Product, Add Transaction, Inventory add form).
  document.querySelectorAll('.nav-subitem[data-view="sell"], .nav-subitem[data-view="add-transaction"]').forEach((btn) => {
    btn.style.pointerEvents = isViewOnly ? 'none' : '';
    btn.style.opacity = isViewOnly ? '0.45' : '';
  });

  // Visual hint for the current permission mode.
  const roleText = isAdmin
    ? tr('role.administrator')
    : (canEditTx ? tr('role.userEditAllowed') : (isViewOnly ? tr('role.viewOnly') : tr('role.user')));
  const existingBadge = document.getElementById('role-badge');
  if (existingBadge) existingBadge.remove();
  const badge = document.createElement('span');
  badge.id = 'role-badge';
  badge.className = isAdmin ? 'role-badge admin' : (canEditTx ? 'role-badge edit' : 'role-badge view-only');
  badge.textContent = roleText;
  const sidebarUser = els.sidebarUserName ? els.sidebarUserName.closest('.sidebar-user') : null;
  if (sidebarUser) sidebarUser.appendChild(badge);
}

// ---------- Toast notifications ----------
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  els.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 350);
  }, 2800);
}

// ---------- Mobile sidebar drawer ----------
function closeMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (els.sidebarOverlay) els.sidebarOverlay.classList.remove('active');
}

function openMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.add('mobile-open');
  if (els.sidebarOverlay) els.sidebarOverlay.classList.add('active');
}

function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && sidebar.classList.contains('mobile-open')) {
    closeMobileSidebar();
  } else {
    openMobileSidebar();
  }
}

// ---------- View navigation ----------
async function switchView(viewName, historyFilter, usersAction, transactionModeParam) {
  closeMobileSidebar();

  // Restrict Manage Users and Settings to admin role
  if ((viewName === 'users' || viewName === 'app-settings') && (!currentUser || currentUser.role !== 'admin')) {
    showToast(tr('login.forbidden'), 'error');
    return;
  }

  // Highlight the active nav item (sub-items AND the top-level Dashboard link)
  document.querySelectorAll('.nav-subitem, .nav-link').forEach((btn) => {
    let isActive = btn.dataset.view === viewName;
    // Two History sub-items share data-view="history" — highlight the
    // clicked one (income/expense) instead of both.
    if (isActive && btn.dataset.historyFilter) {
      isActive = btn.dataset.historyFilter === (historyFilter || '');
    }
    // Two Users sub-items share data-view="users" — highlight the
    // clicked one (add/manage) instead of both.
    if (isActive && btn.dataset.usersAction) {
      isActive = btn.dataset.usersAction === (usersAction || 'manage');
    }
    // The Income/Expense sub-items share data-view="add-transaction" —
    // highlight the one matching the active transaction mode.
    if (isActive && btn.dataset.transactionMode) {
      isActive = btn.dataset.transactionMode === (transactionModeParam || transactionMode || 'income');
    }
    btn.classList.toggle('active', isActive);
  });

  els.views.forEach((view) => {
    // Some sections use non-standard ids (not the standard "view-<name>"
    // pattern), so map them explicitly.
    let expectedId = `view-${viewName}`;
    if (viewName === 'app-settings') expectedId = 'app-settings-section';
    if (viewName === 'categories') expectedId = 'categories-section';
    if (viewName === 'daily-report') expectedId = '';
    view.classList.toggle('active', view.id === expectedId);
  });

  // Auto-expand the group containing the active sub-item
  els.navSubmenus.forEach((sub) => {
    const containsActive = sub.querySelector('.nav-subitem.active') !== null;
    sub.classList.toggle('open', containsActive);
    const toggle = document.querySelector(`.nav-group-toggle[data-group="${sub.dataset.submenu}"]`);
    if (toggle) toggle.classList.toggle('active', containsActive);
  });

  // Daily Reports is a standalone section (not a .view) — show it only when selected.
  if (els.dailyReportSection) {
    els.dailyReportSection.style.display = viewName === 'daily-report' ? 'block' : 'none';
  }

  if (viewName === 'dashboard') refreshDashboard();
  if (viewName === 'daily-report') {
    handleDateSearch();
    return;
  }
  if (viewName === 'monthly-report') renderMonthlyReport();
  if (viewName === 'history') {
    renderHistory();
    if (historyFilter === 'income' || historyFilter === 'expense') {
      setHistoryTab(historyFilter);
    } else {
      const currentTab = document.querySelector('.history-tab.active')?.dataset?.historyTab || 'all';
      setHistoryTab(currentTab);
    }
  }
  if (viewName === 'inventory') renderProducts();
  if (viewName === 'sell') {
    loadProductDropdown();
    renderSales();
  }
  if (viewName === 'add-transaction') {
    if (transactionModeParam && transactionModeParam !== transactionMode) {
      setTransactionMode(transactionModeParam);
    }
    if (editingId === null) await resetTransactionForm();
  }
  if (viewName === 'categories') renderCategories();
  if (viewName === 'users') {
    renderUsers();
    if (usersAction === 'add') {
      els.userUsername?.focus();
    }
  }
  if (viewName === 'change-password') resetChangePasswordForm();
  if (viewName === 'app-settings') resetAppSettingsForm();
}

function showDailyReportSection() {
  document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
  document.querySelectorAll('.nav-subitem, .nav-link').forEach((btn) => btn.classList.remove('active'));
  if (els.dailyReportSection) {
    els.dailyReportSection.style.display = 'block';
  }
  const dailyMenu = $('#menu-daily-report');
  if (dailyMenu) dailyMenu.classList.add('active');
}

function renderFilteredTransactions(rows, yesterdayBalance = 0) {
  const incomeRows = rows.filter((t) => t.type === 'income');
  const expenseRows = rows.filter((t) => t.type === 'expense');

  // Cache the last payload so a language switch can re-render without refetching.
  lastDailyRows = rows;
  lastDailyYesterdayBalance = Number(yesterdayBalance) || 0;

  // Income column
  if (els.reportIncomeBody) {
    if (!incomeRows.length) {
      els.reportIncomeBody.innerHTML = `
        <tr class="report-empty-row">
          <td colspan="2">
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <p data-i18n="report.noIncomeFound">${tr('report.noIncomeFound')}</p>
            </div>
          </td>
        </tr>`;
    } else {
      els.reportIncomeBody.innerHTML = incomeRows.map((t) => `
        <tr>
          <td>${escapeHtml(t.head || t.category || t.description || '—')}</td>
          <td class="amount-cell income nowrap">${formatCurrency(t.amount)}</td>
        </tr>
      `).join('');
    }
    applyI18n(els.reportIncomeBody);
  }

  // Expense column
  if (els.reportExpenseBody) {
    if (!expenseRows.length) {
      els.reportExpenseBody.innerHTML = `
        <tr class="report-empty-row">
          <td colspan="2">
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <p data-i18n="report.noExpenseFound">${tr('report.noExpenseFound')}</p>
            </div>
          </td>
        </tr>`;
    } else {
      els.reportExpenseBody.innerHTML = expenseRows.map((t) => `
        <tr>
          <td>${escapeHtml(t.head || t.category || t.description || '—')}</td>
          <td class="amount-cell expense nowrap">${formatCurrency(t.amount)}</td>
        </tr>
      `).join('');
    }
    applyI18n(els.reportExpenseBody);
  }

  // Totals
  const totalIncome = incomeRows.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalExpense = expenseRows.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const yestBalance = Number(yesterdayBalance) || 0;
  const todayCashInHand = totalIncome - totalExpense;
  const totalCashInHand = yestBalance + todayCashInHand;

  if (els.dailyPreviousBalance) {
    els.dailyPreviousBalance.textContent = `${tr('report.yesterdayBalance')}: ${formatCurrency(yestBalance)}`;
  }

  if (els.reportTotalIncome) els.reportTotalIncome.textContent = formatCurrency(totalIncome);
  if (els.reportTableTotalIncome) els.reportTableTotalIncome.textContent = formatCurrency(totalIncome);
  if (els.reportTotalExpense) els.reportTotalExpense.textContent = formatCurrency(totalExpense);
  if (els.reportTableTotalExpense) els.reportTableTotalExpense.textContent = formatCurrency(totalExpense);
  if (els.reportTodayCash) {
    els.reportTodayCash.textContent = formatCurrency(todayCashInHand);
    els.reportTodayCash.style.color = todayCashInHand >= 0 ? 'var(--green)' : 'var(--red)';
  }
  if (els.reportCashInHand) {
    els.reportCashInHand.textContent = formatCurrency(totalCashInHand);
    els.reportCashInHand.style.color = totalCashInHand >= 0 ? 'var(--green)' : 'var(--red)';
  }
}

async function handleDateSearch() {
  const selectedDate = (els.filterFromDate?.value || todayISO()).trim();
  if (!selectedDate) {
    alert(tr('report.selectDate'));
    return;
  }
  if (els.filterToDate) {
    els.filterToDate.value = selectedDate;
  }
  if (els.printDailyDate) {
    els.printDailyDate.textContent = selectedDate;
  }

  try {
    if (window.api?.getDailyReport) {
      const res = await window.api.getDailyReport(selectedDate);
      if (res.success) {
        renderFilteredTransactions(res.data || [], res.yesterdayBalance != null ? res.yesterdayBalance : (res.previousBalance || 0));
        return;
      }
      throw new Error(res.error || 'Failed to load daily report');
    }

    if (window.api?.getFilteredReports) {
      const res = await window.api.getFilteredReports(selectedDate, selectedDate);
      if (res.success) {
        renderFilteredTransactions(res.data || [], res.yesterdayBalance != null ? res.yesterdayBalance : (res.previousBalance || 0));
        return;
      }
      throw new Error(res.error || 'Failed to load daily report');
    }

    const res = await window.api.getAllTransactions();
    if (!res.success) throw new Error(res.error);
    const filtered = res.data.filter((t) => t.date === selectedDate).sort((a, b) => (b.id || 0) - (a.id || 0));
    const yestBalance = res.data
      .filter((t) => t.date < selectedDate)
      .reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
    renderFilteredTransactions(filtered, yestBalance);
  } catch (err) {
    console.error('Daily report load failed:', err);
    showToast(tr('report.dailyLoadFailed', { error: err.message || tr('report.unknownError') }), 'error');
  }
}

// ---------- Sidebar accordion (expand/collapse) ----------
els.navGroupToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const group = toggle.dataset.group;
    const submenu = document.querySelector(`.nav-submenu[data-submenu="${group}"]`);
    if (!submenu) return;

    const isOpen = submenu.classList.contains('open');
    // Close all other groups
    els.navSubmenus.forEach((sub) => {
      sub.classList.remove('open');
      const otherToggle = document.querySelector(`.nav-group-toggle[data-group="${sub.dataset.submenu}"]`);
      if (otherToggle) otherToggle.classList.remove('active');
    });
    // Toggle the clicked group
    if (!isOpen) {
      submenu.classList.add('open');
      toggle.classList.add('active');
    }
  });
});

document.querySelectorAll('.nav-subitem, .nav-link').forEach((btn) => {
  btn.addEventListener('click', (event) => {
    if (btn.classList.contains('nav-link')) event.preventDefault();
    switchView(btn.dataset.view, btn.dataset.historyFilter, btn.dataset.usersAction, btn.dataset.transactionMode);
  });
});

if (els.btnHamburger) {
  els.btnHamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileSidebar();
  });
}

if (els.sidebarOverlay) {
  els.sidebarOverlay.addEventListener('click', () => {
    closeMobileSidebar();
  });
}

// ---------- Dashboard ----------
async function refreshDashboard() {
  try {
    const summary = await window.api.getSummary();
    if (!summary.success) throw new Error(summary.error);

    // Today's income & expense
    const daily = await window.api.getDailyStats();
    if (daily.success) {
      els.todayIncome.textContent = formatCurrency(daily.todayIncome);
      els.todayExpense.textContent = formatCurrency(daily.todayExpense);
      const netCash = daily.todayIncome - daily.todayExpense;
      els.cashInHand.textContent = formatCurrency(netCash);
      els.cashCard.classList.remove('positive', 'negative');
      if (netCash > 0) els.cashCard.classList.add('positive');
      if (netCash < 0) els.cashCard.classList.add('negative');
    }

    // Recent transactions — only today's transactions (this naturally
    // clears out yesterday's data after 24 hours).
    const transactionsRes = await window.api.getAllTransactions();
    if (!transactionsRes.success) throw new Error(transactionsRes.error);
    allTransactions = transactionsRes.data;
    const todayTransactions = allTransactions.filter((t) => t.date === todayISO());
    renderRecent(todayTransactions);
  } catch (err) {
    console.error('Dashboard refresh failed:', err);
    showToast(tr('dashboard.loadFailed'), 'error');
  }
}

function renderRecent(transactions) {
  const recent = transactions.slice(0, 5);
  lastRecentTransactions = transactions;

  if (!recent.length) {
    els.recentList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p data-i18n-html="dashboard.noTx">${tr('dashboard.noTx')}</p>
      </div>`;
    applyI18n(els.recentList);
    return;
  }

  els.recentList.innerHTML = recent.map((t) => `
    <div class="recent-item">
      <div class="recent-icon ${t.type}">${getCategoryIcon(t.category)}</div>
      <div class="recent-main">
        <div class="recent-title">${escapeHtml(t.category)}${t.description ? ' — ' + escapeHtml(truncate(t.description, 30)) : ''}</div>
        <div class="recent-meta">${formatDate(t.date)}${t.added_by ? ' · ' + escapeHtml(tr('common.by')) + ' ' + escapeHtml(displayAddedBy(t.added_by)) : ''}</div>
      </div>
      <div class="recent-amount ${t.type}">${formatCurrency(t.amount)}</div>
    </div>
  `).join('');
  applyI18n(els.recentList);
}

// Populate a monthly income/expense report table body with rows.
function renderMonthlyReportRows(tbody, rows, isIncome) {
  if (!tbody) return;

  if (!rows.length) {
    const emptyKey = isIncome ? 'report.noIncomeFound' : 'report.noExpenseFound';
    tbody.innerHTML = `
      <tr class="report-empty-row">
        <td colspan="2">
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <p data-i18n="${emptyKey}">${tr(emptyKey)}</p>
          </div>
        </td>
      </tr>`;
    applyI18n(tbody);
    return;
  }

  tbody.innerHTML = rows.map((t) => `
    <tr>
      <td>${escapeHtml(t.head || t.category || t.description || '—')}</td>
      <td class="amount-cell ${isIncome ? 'income' : 'expense'} nowrap">${formatCurrency(t.amount)}</td>
    </tr>
  `).join('');
  applyI18n(tbody);
}

// ---------- Monthly Report ----------
async function renderMonthlyReport() {
  const month = els.monthlyMonthPicker?.value || todayISO().slice(0, 7);

  try {
    let rows = [];
    let lastMonthBalance = 0;

    if (window.api?.getMonthlyReport) {
      const res = await window.api.getMonthlyReport(month);
      if (res.success) {
        rows = res.data || [];
        lastMonthBalance = res.lastMonthBalance != null ? res.lastMonthBalance : (res.previousBalance || 0);
      } else {
        throw new Error(res.error || 'Failed to load monthly report');
      }
    } else {
      if (!allTransactions.length) {
        const res = await window.api.getAllTransactions();
        if (!res.success) throw new Error(res.error);
        allTransactions = res.data;
      }
      rows = allTransactions.filter((t) => t.date && t.date.startsWith(month));
      const firstDayOfMonth = `${month}-01`;
      lastMonthBalance = allTransactions
        .filter((t) => t.date && t.date < firstDayOfMonth)
        .reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
    }

    if (els.monthlyPreviousBalance) {
      els.monthlyPreviousBalance.textContent = `${tr('report.lastMonthBalance')}: ${formatCurrency(lastMonthBalance)}`;
    }

    // Cache the payload so a language switch can re-render without refetching.
    lastMonthlyRows = rows;
    lastMonthlyBalance = Number(lastMonthBalance) || 0;

    // Split into Income (left) and Expense (right)
    const incomeRows = rows.filter((t) => t.type === 'income');
    const expenseRows = rows.filter((t) => t.type === 'expense');

    renderMonthlyReportRows(els.monthlyReportIncomeBody, incomeRows, true);
    renderMonthlyReportRows(els.monthlyReportExpenseBody, expenseRows, false);

    // Totals
    const totalIncome = incomeRows.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExpense = expenseRows.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const lastMonthBal = Number(lastMonthBalance) || 0;
    const thisMonthCash = totalIncome - totalExpense;
    const totalCashInHand = lastMonthBal + thisMonthCash;

    if (els.monthlyReportTotalIncome) els.monthlyReportTotalIncome.textContent = formatCurrency(totalIncome);
    if (els.monthlyReportTableTotalIncome) els.monthlyReportTableTotalIncome.textContent = formatCurrency(totalIncome);
    if (els.monthlyReportTotalExpense) els.monthlyReportTotalExpense.textContent = formatCurrency(totalExpense);
    if (els.monthlyReportTableTotalExpense) els.monthlyReportTableTotalExpense.textContent = formatCurrency(totalExpense);
    if (els.monthlyReportMonthCash) {
      els.monthlyReportMonthCash.textContent = formatCurrency(thisMonthCash);
      els.monthlyReportMonthCash.style.color = thisMonthCash >= 0 ? 'var(--green)' : 'var(--red)';
    }
    if (els.monthlyReportCashInHand) {
      els.monthlyReportCashInHand.textContent = formatCurrency(totalCashInHand);
      els.monthlyReportCashInHand.style.color = totalCashInHand >= 0 ? 'var(--green)' : 'var(--red)';
    }
    if (els.printMonthlyDate) {
      els.printMonthlyDate.textContent = month;
    }
  } catch (err) {
    console.error('Monthly report failed:', err);
    showToast(tr('report.monthlyLoadFailed', { error: err.message || tr('report.unknownError') }), 'error');
  }
}

els.btnMonthlySearch?.addEventListener('click', renderMonthlyReport);

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

// Show the "Added By" username exactly as stored in the database.
// A dash is rendered ONLY when the value is truly missing/empty — if the
// username exists (e.g. the logged-in user's currentUser.username), it is
// displayed as-is instead of a dash.
function displayAddedBy(value) {
  if (value == null) return '—';
  const str = String(value).trim();
  return str ? str : '—';
}

// ---------- Add Income / Add Expense Forms ----------
async function loadCategories() {
  const res = await window.api.getAllCategories();
  if (!res.success) throw new Error(res.error);
  allCategories = res.data;
  return allCategories;
}

// Populate a category dropdown (selectEl) with only the categories
// matching the given type ('income' or 'expense').
async function setCategoryOptions(selectEl, type) {
  if (!allCategories.length) {
    await loadCategories();
  }
  const filtered = allCategories.filter((c) => c.type === type);
  selectEl.innerHTML = '<option value="">— Select category —</option>' +
    filtered.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
}

// ---------- Transaction mode (Income / Expense) ----------
// Switches the single form between Income and Expense: title, head label and
// the submit button colour all change; submission uses `transactionMode`.
function setTransactionMode(mode) {
  transactionMode = mode === 'expense' ? 'expense' : 'income';
  const isIncome = transactionMode === 'income';

  if (els.btnModeIncome) els.btnModeIncome.classList.toggle('active', isIncome);
  if (els.btnModeExpense) els.btnModeExpense.classList.toggle('active', !isIncome);

  if (els.transactionFormTitle) {
    const isEditing = editingId !== null;
    let titleKey;
    if (isIncome) {
      titleKey = isEditing ? 'transaction.editIncome' : 'transaction.addIncome';
    } else {
      titleKey = isEditing ? 'transaction.editExpense' : 'transaction.addExpense';
    }
    setI18nText(els.transactionFormTitle, titleKey);
  }
  if (els.transactionHeadLabel) {
    setI18nText(els.transactionHeadLabel, isIncome ? 'transaction.headIncome' : 'transaction.headExpense');
  }
  if (els.transactionHead) {
    els.transactionHead.removeAttribute('placeholder');
  }
  if (els.transactionAmount) {
    els.transactionAmount.removeAttribute('placeholder');
  }
  if (els.transactionNote) {
    els.transactionNote.removeAttribute('placeholder');
  }
  if (els.transactionDate) {
    els.transactionDate.readOnly = true;
    els.transactionDate.setAttribute('readonly', 'true');
  }
  if (els.btnSaveTransaction) {
    els.btnSaveTransaction.classList.remove('btn-primary', 'btn-danger');
    els.btnSaveTransaction.classList.add(isIncome ? 'btn-primary' : 'btn-danger');
  }
}

// Reset the single transaction form (keeps the currently selected mode).
async function resetTransactionForm() {
  editingId = null;
  if (els.transactionEditId) els.transactionEditId.value = '';
  if (els.transactionForm) els.transactionForm.reset();
  const today = new Date();
  const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  if (els.transactionDate) {
    els.transactionDate.value = localDate;
    els.transactionDate.readOnly = true;
    els.transactionDate.setAttribute('readonly', 'true');
  }
  if (els.transactionHead) {
    els.transactionHead.value = '';
    els.transactionHead.removeAttribute('placeholder');
  }
  if (els.transactionAmount) {
    els.transactionAmount.value = '';
    els.transactionAmount.removeAttribute('placeholder');
  }
  if (els.transactionNote) {
    els.transactionNote.value = '';
    els.transactionNote.removeAttribute('placeholder');
  }
  if (els.transactionFormError) els.transactionFormError.classList.remove('visible');
  if (els.btnCancelTransactionEdit) els.btnCancelTransactionEdit.style.display = 'none';
  setTransactionMode(transactionMode);
}

els.btnModeIncome.addEventListener('click', () => {
  setTransactionMode('income');
});

els.btnModeExpense.addEventListener('click', () => {
  setTransactionMode('expense');
});

els.btnCancelTransactionEdit.addEventListener('click', async () => {
  await resetTransactionForm();
  switchView('dashboard');
});

// ---------- Transaction form submit (Income / Expense) ----------
els.transactionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.transactionFormError.classList.remove('visible');

  const type = transactionMode;
  const typeLabel = type === 'income' ? tr('common.income') : tr('common.expense');
  const date = els.transactionDate.value;
  const head = els.transactionHead.value.trim();
  const amount = parseFloat(els.transactionAmount.value);
  const note = els.transactionNote.value.trim();

  // Validation
  if (!date) {
    els.transactionFormError.textContent = tr('transaction.dateRequired');
    els.transactionFormError.classList.add('visible');
    return;
  }
  if (!head) {
    els.transactionFormError.textContent = tr('transaction.headRequired');
    els.transactionFormError.classList.add('visible');
    return;
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    els.transactionFormError.textContent = tr('transaction.amountInvalid');
    els.transactionFormError.classList.add('visible');
    return;
  }

  // Head maps to the transaction `category` column, Note to `description`,
  // and the toggle decides `type` ('income' | 'expense').
  const payload = {
    type,
    date,
    category: head,
    head: head,
    amount,
    description: note,
    added_by: currentUser ? currentUser.username : ''
  };

  try {
    if (editingId !== null) {
      const res = await window.api.updateTransaction(editingId, payload);
      if (!res.success) throw new Error(res.error);
      showToast(typeLabel === tr('common.income') ? tr('transaction.updatedIncome') : tr('transaction.updatedExpense'));
      editingId = null;
      await resetTransactionForm();
      switchView('history');
    } else {
      const res = await window.api.addTransaction(payload);
      if (!res.success) throw new Error(res.error);
      showToast(typeLabel === tr('common.income') ? tr('transaction.savedIncome') : tr('transaction.savedExpense'));
      await resetTransactionForm();
      allTransactions = [];
      refreshDashboard();
    }
  } catch (err) {
    console.error('Save transaction failed:', err);
    els.transactionFormError.textContent = tr('transaction.saveFailed');
    els.transactionFormError.classList.add('visible');
  }
});

// ---------- Inventory (Products) ----------
async function loadProducts() {
  const res = await window.api.getAllProducts();
  if (!res.success) throw new Error(res.error);
  allProducts = res.data;
  return allProducts;
}

function resetProductForm() {
  productEditingId = null;
  els.productForm.reset();
  els.productFormError.classList.remove('visible');
  setI18nText(els.productFormTitle, 'inventory.addTitle');
  setI18nText(els.productFormSubtitle, 'inventory.addSubtitle');
  setI18nText(els.btnAddProduct, 'inventory.addButton');
  els.btnCancelProductEdit.style.display = 'none';
}

function openProductEditForm(product) {
  productEditingId = product.id;
  els.productName.value = product.name;
  els.productPurchasePrice.value = product.purchase_price;
  els.productStock.value = product.stock;
  els.productFormError.classList.remove('visible');
  setI18nText(els.productFormTitle, 'inventory.editTitle');
  setDynamicText(els.productFormSubtitle, tr('inventory.editSubtitle', { name: product.name }));
  setI18nText(els.btnAddProduct, 'inventory.updateButton');
  els.btnCancelProductEdit.style.display = 'inline-block';
  window.scrollTo(0, 0);
}

// Re-apply the product form labels (used on a language switch while editing)
// without touching the form values or the scroll position.
function refreshProductFormLabels() {
  if (productEditingId === null) {
    setI18nText(els.productFormTitle, 'inventory.addTitle');
    setI18nText(els.productFormSubtitle, 'inventory.addSubtitle');
    setI18nText(els.btnAddProduct, 'inventory.addButton');
    return;
  }
  const product = allProducts.find((p) => p.id === productEditingId);
  setI18nText(els.productFormTitle, 'inventory.editTitle');
  if (product) {
    setDynamicText(els.productFormSubtitle, tr('inventory.editSubtitle', { name: product.name }));
  }
  setI18nText(els.btnAddProduct, 'inventory.updateButton');
}

async function renderProducts() {
  try {
    await loadProducts();
    const products = allProducts;

    if (!products.length) {
      els.productTableBody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-icon">📦</div>
              <p data-i18n="inventory.none">${tr('inventory.none')}</p>
            </div>
          </td>
        </tr>`;
      els.productCount.textContent = tr('inventory.countMany', { n: 0 });
      applyI18n(els.productTableBody);
      return;
    }

    els.productTableBody.innerHTML = products.map((p, i) => {
      let stockClass = 'in-stock';
      let stockLabel = tr('inventory.inStock', { n: p.stock });
      if (p.stock === 0) {
        stockClass = 'out-of-stock';
        stockLabel = tr('inventory.outOfStock');
      } else if (p.stock <= 5) {
        stockClass = 'low-stock';
        stockLabel = tr('inventory.lowStock', { n: p.stock });
      }
      return `
        <tr data-id="${p.id}">
          <td>${i + 1}</td>
          <td class="product-name-cell">${escapeHtml(p.name)}</td>
          <td class="right">${formatCurrency(p.purchase_price)}</td>
          <td class="right"><span class="stock-badge ${stockClass}">${stockLabel}</span></td>
          <td class="center">
            <div class="actions-cell">
              <button class="action-btn edit" data-action="edit-product" title="${tr('inventory.editAction')}" data-i18n-title="inventory.editAction">✏️</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    els.productCount.textContent = products.length === 1
      ? tr('inventory.countOne')
      : tr('inventory.countMany', { n: products.length });
    applyI18n(els.productTableBody);
  } catch (err) {
    console.error('Render products failed:', err);
    showToast(tr('inventory.loadFailed'), 'error');
  }
}

els.productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.productFormError.classList.remove('visible');

  const name = els.productName.value.trim();
  const purchasePrice = parseFloat(els.productPurchasePrice.value);
  const stock = parseInt(els.productStock.value, 10);

  if (!name) {
    els.productFormError.textContent = tr('inventory.nameRequired');
    els.productFormError.classList.add('visible');
    return;
  }
  if (isNaN(purchasePrice) || purchasePrice < 0) {
    els.productFormError.textContent = tr('inventory.priceInvalid');
    els.productFormError.classList.add('visible');
    return;
  }
  if (isNaN(stock) || stock < 0) {
    els.productFormError.textContent = tr('inventory.stockInvalid');
    els.productFormError.classList.add('visible');
    return;
  }

  try {
    if (productEditingId !== null) {
      const res = await window.api.updateProduct(productEditingId, { name, purchase_price: purchasePrice, stock });
      if (!res.success) throw new Error(res.error);
      showToast(tr('inventory.updated', { name }));
      resetProductForm();
    } else {
      const res = await window.api.addProduct({ name, purchase_price: purchasePrice, stock });
      if (!res.success) throw new Error(res.error);
      showToast(tr('inventory.added', { name }));
      els.productForm.reset();
    }
    await renderProducts();
    await loadProductDropdown();
  } catch (err) {
    console.error('Save product failed:', err);
    els.productFormError.textContent = err.message || tr('inventory.saveFailed');
    els.productFormError.classList.add('visible');
  }
});

els.btnCancelProductEdit.addEventListener('click', resetProductForm);

els.btnRefreshProducts.addEventListener('click', async () => {
  await renderProducts();
  await loadProductDropdown();
  showToast(tr('inventory.refreshed'));
});

els.productTableBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('.action-btn');
  if (!btn) return;

  const row = btn.closest('tr');
  const id = Number(row.dataset.id);
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;

  if (btn.dataset.action === 'edit-product') {
    openProductEditForm(product);
  }
});

// ---------- Sell Product ----------
async function loadProductDropdown() {
  try {
    await loadProducts();
    // The autocomplete search input gets its suggestions from allProducts.
    // No dropdown population needed; suggestions render on typing.
    updateSaleSummary();
  } catch (err) {
    console.error('Load products for sale failed:', err);
    showToast(tr('inventory.saleLoadFailed'), 'error');
  }
}

function getSelectedSaleProduct() {
  const id = Number(els.saleProduct.value);
  return allProducts.find((p) => p.id === id) || null;
}

// ---------- Autocomplete for product search ----------
const saleProductSearch = $('#sale-product-search');
const saleProductDropdown = $('#sale-product-dropdown');

function showProductSuggestions() {
  const query = saleProductSearch.value.trim().toLowerCase();
  const filtered = query
    ? allProducts.filter((p) => p.name.toLowerCase().includes(query))
    : allProducts;

  if (!filtered.length) {
    saleProductDropdown.innerHTML = `<div class="autocomplete-item disabled" data-i18n="inventory.noProductsFound">${tr('inventory.noProductsFound')}</div>`;
    saleProductDropdown.classList.add('visible');
    applyI18n(saleProductDropdown);
    return;
  }

  saleProductDropdown.innerHTML = filtered.map((p) =>
    `<div class="autocomplete-item" data-product-id="${p.id}" data-product-name="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>`
  ).join('');
  saleProductDropdown.classList.add('visible');
}

function hideProductSuggestions() {
  saleProductDropdown.classList.remove('visible');
}

saleProductSearch.addEventListener('input', () => {
  // Clear the hidden selected product id whenever the user types
  els.saleProduct.value = '';
  showProductSuggestions();
  updateSaleSummary();
});

saleProductSearch.addEventListener('focus', () => {
  showProductSuggestions();
});

saleProductSearch.addEventListener('blur', () => {
  // Delay hiding so clicking a suggestion registers first
  setTimeout(hideProductSuggestions, 150);
});

saleProductDropdown.addEventListener('mousedown', (e) => {
  const item = e.target.closest('.autocomplete-item');
  if (!item || item.classList.contains('disabled')) return;

  const productId = Number(item.dataset.productId);
  const productName = item.dataset.productName;
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  els.saleProduct.value = product.id;
  saleProductSearch.value = productName;
  hideProductSuggestions();
  updateSaleSummary();
});

// Keyboard navigation for the autocomplete dropdown
saleProductSearch.addEventListener('keydown', (e) => {
  if (!saleProductDropdown.classList.contains('visible')) return;
  const items = saleProductDropdown.querySelectorAll('.autocomplete-item:not(.disabled)');
  if (!items.length) return;

  let index = Array.from(items).findIndex((i) => i.classList.contains('selected'));

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    index = Math.min(index + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    index = Math.max(index - 1, 0);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const selected = items[index];
    if (selected) {
      const productId = Number(selected.dataset.productId);
      const productName = selected.dataset.productName;
      const product = allProducts.find((p) => p.id === productId);
      if (product) {
        els.saleProduct.value = product.id;
        saleProductSearch.value = productName;
        hideProductSuggestions();
        updateSaleSummary();
      }
    }
    return;
  } else if (e.key === 'Escape') {
    hideProductSuggestions();
    return;
  } else {
    return;
  }

  items.forEach((i) => i.classList.remove('selected'));
  if (items[index]) items[index].classList.add('selected');
});

// ---------- Sale summary calculation ----------
// Total Amount = (Selling Price × Quantity) − Discount.
// Profit = (Selling Price − Purchase Price) × Quantity.
function updateSaleSummary() {
  const product = getSelectedSaleProduct();
  const qty = parseInt(els.saleQuantity.value, 10) || 0;
  const discount = parseFloat(els.saleDiscount.value) || 0;
  const sellingPrice = parseFloat(els.saleSellingPrice.value);

  if (!product) {
    els.saleUnitPurchasePrice.textContent = '—';
    els.saleUnitProfit.textContent = '—';
    els.saleTotalAmount.textContent = 'Tk 0.00';
    return;
  }

  const purchasePrice = Number(product.purchase_price) || 0;
  els.saleUnitPurchasePrice.textContent = formatCurrency(purchasePrice);

  // Profit only updates once the user types a selling price.
  if (isNaN(sellingPrice) || sellingPrice < 0) {
    els.saleUnitProfit.textContent = '—';
    els.saleUnitProfit.style.color = '';
    els.saleTotalAmount.textContent = 'Tk 0.00';
    return;
  }

  const unitProfit = sellingPrice - purchasePrice;
  els.saleUnitProfit.textContent = `${unitProfit >= 0 ? '+' : '−'}${formatCurrency(Math.abs(unitProfit))}`;
  els.saleUnitProfit.style.color = unitProfit >= 0 ? 'var(--green)' : 'var(--red)';

  const subtotal = qty > 0 ? sellingPrice * qty : 0;
  const total = Math.max(0, subtotal - discount);
  els.saleTotalAmount.textContent = formatCurrency(total);
}

els.saleSellingPrice.addEventListener('input', updateSaleSummary);
els.saleSellingPrice.addEventListener('change', updateSaleSummary);
els.saleQuantity.addEventListener('input', updateSaleSummary);
els.saleQuantity.addEventListener('change', updateSaleSummary);
els.saleDiscount.addEventListener('input', updateSaleSummary);
els.saleDiscount.addEventListener('change', updateSaleSummary);

els.saleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.saleFormError.classList.remove('visible');

  const customer_name = els.customerName.value.trim();
  const date = els.saleDate.value;
  const product_id = Number(els.saleProduct.value);
  const quantity = parseInt(els.saleQuantity.value, 10);

  if (!customer_name) {
    els.saleFormError.textContent = tr('sale.customerRequired');
    els.saleFormError.classList.add('visible');
    return;
  }
  if (!product_id) {
    els.saleFormError.textContent = tr('sale.productRequired');
    els.saleFormError.classList.add('visible');
    return;
  }
  if (!quantity || isNaN(quantity) || quantity <= 0) {
    els.saleFormError.textContent = tr('sale.qtyInvalid');
    els.saleFormError.classList.add('visible');
    return;
  }

  const product = getSelectedSaleProduct();
  if (!product) {
    els.saleFormError.textContent = tr('sale.productInvalid');
    els.saleFormError.classList.add('visible');
    return;
  }
  if (quantity > product.stock) {
    els.saleFormError.textContent = tr('sale.stockInsufficient', { n: product.stock, name: product.name });
    els.saleFormError.classList.add('visible');
    return;
  }

  const discount = parseFloat(els.saleDiscount.value) || 0;
  const sellingPrice = parseFloat(els.saleSellingPrice.value);

  if (isNaN(sellingPrice) || sellingPrice < 0) {
    els.saleFormError.textContent = tr('sale.priceInvalid');
    els.saleFormError.classList.add('visible');
    return;
  }

  const totalAmount = Math.max(0, (sellingPrice * quantity) - discount);

  try {
    // Pass the exact selling price, total (incl. discount) and current
    // username so the main process stores the same values in sales and
    // syncs the identical amount + profit + added_by into transactions.
    const res = await window.api.addSale({
      customer_name,
      product_id,
      quantity,
      unit_price: sellingPrice,
      total_amount: totalAmount,
      date,
      added_by: currentUser ? currentUser.username : ''
    });
    if (!res.success) throw new Error(res.error);

    showToast(tr('sale.recorded', { product: product.name, qty: quantity, customer: customer_name }));

    // ---------- AUTO-RESET the Sell Product form ----------
    resetSaleForm();

    // Refresh all related data
    allTransactions = [];
    await loadProductDropdown();
    await renderProducts();
    await renderSales();
    refreshDashboard();

    // ---------- Show Print Receipt ----------
    // The receipt shows ONLY: Shop Name, Shop Details/Address, Customer
    // Name, Date, Product Name, Quantity, and Total Sold Amount.
    // Purchase price and profit are NEVER displayed on the receipt.
    els.invoiceCustomer.textContent = customer_name;
    els.invoiceDate.textContent = formatDate(date);
    els.invoiceProduct.textContent = product.name;
    els.invoiceQty.textContent = quantity;
    els.invoiceTotal.textContent = formatCurrency(totalAmount);
    els.invoiceGrandTotal.textContent = formatCurrency(totalAmount);

    // Hide sale form + sales panel, show receipt
    const saleFormCentered = els.saleForm.closest('.form-centered');
    if (saleFormCentered) saleFormCentered.style.display = 'none';
    els.salesPanel.style.display = 'none';
    els.formCenteredSale = saleFormCentered;
    els.invoiceContainer.classList.add('visible');
    els.btnSellProduct.style.display = 'none';
  } catch (err) {
    console.error('Sale failed:', err);
    els.saleFormError.textContent = err.message || tr('sale.recordFailed');
    els.saleFormError.classList.add('visible');
  }
});

// ---------- Reset the entire Sell Product form ----------
function resetSaleForm() {
  els.saleForm.reset();
  els.customerName.value = '';
  els.saleDate.value = todayISO();
  els.saleProduct.value = '';
  if (saleProductSearch) saleProductSearch.value = '';
  hideProductSuggestions();
  els.saleUnitPurchasePrice.textContent = '—';
  els.saleUnitProfit.textContent = '—';
  els.saleUnitProfit.style.color = '';
  els.saleTotalAmount.textContent = 'Tk 0.00';
  els.saleFormError.classList.remove('visible');
}

// ---------- Invoice / Receipt actions ----------
els.btnPrintInvoice.addEventListener('click', () => {
  window.print();
});

// ---------- Report & History Print Actions ----------
function updatePrintTimestamps() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.querySelectorAll('.print-daily-timestamp, .print-monthly-timestamp, .print-history-timestamp').forEach((el) => {
    el.textContent = dateStr;
  });
}

if (els.btnPrintDailyReport) {
  els.btnPrintDailyReport.addEventListener('click', () => {
    updatePrintTimestamps();
    if (els.printDailyDate) {
      els.printDailyDate.textContent = els.filterFromDate?.value || todayISO();
    }
    window.print();
  });
}

if (els.btnPrintMonthlyReport) {
  els.btnPrintMonthlyReport.addEventListener('click', () => {
    updatePrintTimestamps();
    if (els.printMonthlyDate) {
      els.printMonthlyDate.textContent = els.monthlyMonthPicker?.value || todayISO().slice(0, 7);
    }
    window.print();
  });
}

if (els.btnPrintHistory) {
  els.btnPrintHistory.addEventListener('click', () => {
    updatePrintTimestamps();
    const from = els.historyFromDate?.value || '—';
    const to = els.historyToDate?.value || '—';
    if (els.printHistoryDate) {
      els.printHistoryDate.textContent = tr('print.rangeJoin', { from, to });
    }
    const activeTab = document.querySelector('.history-tab.active')?.dataset?.historyTab;
    updateHistoryPrintTitle(activeTab || 'all');
    window.print();
  });
}

els.btnNewSale.addEventListener('click', () => {
  // Show sale form + sales panel, hide receipt
  if (els.formCenteredSale) {
    els.formCenteredSale.style.display = '';
  }
  els.salesPanel.style.display = '';
  els.invoiceContainer.classList.remove('visible');
  els.btnSellProduct.style.display = '';

  // Reset the form for a new sale
  resetSaleForm();
  window.scrollTo(0, 0);
});

async function renderSales() {
  try {
    const res = await window.api.getAllSales();
    if (!res.success) throw new Error(res.error);
    allSales = res.data;

    if (!allSales.length) {
      els.salesTableBody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <div class="empty-icon">🛒</div>
              <p data-i18n="sale.none">${tr('sale.none')}</p>
            </div>
          </td>
        </tr>`;
      els.salesCount.textContent = tr('sale.countMany', { n: 0 });
      if (els.salesTfootTotal) els.salesTfootTotal.textContent = tr('sale.totalPrefix') + formatCurrency(0);
      if (els.salesTfootProfit) {
        els.salesTfootProfit.textContent = tr('sale.profitPrefix') + formatCurrency(0);
        els.salesTfootProfit.style.color = '';
      }
      applyI18n(els.salesTableBody);
      return;
    }

    els.salesTableBody.innerHTML = allSales.map((s) => {
      const profit = Number(s.profit) || 0;
      const profitColor = profit >= 0 ? 'var(--green)' : 'var(--red)';
      const profitPrefix = profit >= 0 ? '+' : '−';
      return `
      <tr data-id="${s.id}">
        <td>${formatDate(s.date)}</td>
        <td>${escapeHtml(s.customer_name)}</td>
        <td>${escapeHtml(s.product_name)}</td>
        <td class="right">${s.quantity}</td>
        <td class="right">${formatCurrency(s.unit_price)}</td>
        <td class="right amount-cell income">${formatCurrency(s.total_amount)}</td>
        <td class="right profit-cell" style="color:${profitColor}">${profitPrefix}${formatCurrency(Math.abs(profit))}</td>
        <td>${escapeHtml(displayAddedBy(s.added_by))}</td>
      </tr>`;
    }).join('');

    const totalRevenue = allSales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalProfit = allSales.reduce((sum, s) => sum + (Number(s.profit) || 0), 0);
    els.salesCount.textContent = allSales.length === 1
      ? tr('sale.countOne')
      : tr('sale.countMany', { n: allSales.length });
    if (els.salesTfootTotal) els.salesTfootTotal.textContent = tr('sale.totalPrefix') + formatCurrency(totalRevenue);
    if (els.salesTfootProfit) {
      els.salesTfootProfit.textContent = tr('sale.profitPrefix') + (totalProfit >= 0 ? '+' : '−') + formatCurrency(Math.abs(totalProfit));
      els.salesTfootProfit.style.color = totalProfit >= 0 ? 'var(--green)' : 'var(--red)';
    }
    applyI18n(els.salesTableBody);
  } catch (err) {
    console.error('Render sales failed:', err);
    showToast(tr('sale.loadFailed'), 'error');
  }
}

els.btnRefreshSales.addEventListener('click', async () => {
  await renderSales();
  await loadProductDropdown();
  showToast(tr('sale.refreshed'));
});

// ---------- History ----------
function populateCategoryFilter() {
  // Category dropdown filter replaced by date-range inputs
}

function getFilteredTransactions() {
  const search = els.searchInput.value.trim().toLowerCase();
  const fromDate = els.historyFromDate?.value;
  const toDate = els.historyToDate?.value;

  return allTransactions.filter((t) => {
    if (fromDate && t.date < fromDate) return false;
    if (toDate && t.date > toDate) return false;
    if (search) {
      const categoryHead = t.head || t.category || '';
      const haystack = `${categoryHead} ${t.description || ''} ${t.date} ${t.added_by || ''}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

// Build a profit cell for income rows (only Product Sale rows show profit)
function buildProfitCell(t) {
  const profit = Number(t.profit) || 0;
  const isSale = t.category === 'Product Sale';
  if (isSale && profit !== 0) {
    return `<td class="right profit-cell" style="color:${profit >= 0 ? 'var(--green)' : 'var(--red)'}">${profit >= 0 ? '+' : '−'}${formatCurrency(Math.abs(profit))}</td>`;
  }
  return '<td class="right"><span class="text-muted">—</span></td>';
}

// Same-Day Edit Rule: rows from a previous day (date does NOT match
// today's date) get no Edit/Delete buttons — users can only modify
// transactions recorded today.
function buildActionButtons(t) {
  const today = todayISO();
  if (t.date !== today) {
    return `<td class="center"><div class="actions-cell"><span class="text-muted">—</span></div></td>`;
  }
  return `
    <td class="center">
      <div class="actions-cell">
        <button class="action-btn edit" data-action="edit" title="${tr('common.edit')}" data-i18n-title="common.edit">✏️</button>
        <button class="action-btn delete" data-action="delete" title="${tr('common.delete')}" data-i18n-title="common.delete">🗑️</button>
      </div>
    </td>`;
}

// Type badge for the history tables: income/expense are translated,
// any other raw type is shown as stored.
function buildTypeBadge(type) {
  const raw = String(type || '');
  const isIncome = raw.toLowerCase() === 'income';
  const isExpense = raw.toLowerCase() === 'expense';
  const key = isIncome ? 'history.typeIncome' : (isExpense ? 'history.typeExpense' : '');
  const label = key ? tr(key) : raw;
  return `<span class="type-badge ${raw}"${key ? ` data-i18n="${key}"` : ''}>${escapeHtml(label)}</span>`;
}

function renderHistory() {
  const filtered = getFilteredTransactions();
  const canEdit = userCanEditTransactions();

  // Show or hide ACTIONS column headers across history tables
  document.querySelectorAll('.history-actions-col').forEach((th) => {
    th.style.display = canEdit ? '' : 'none';
  });

  // --- All Transactions table ---
  if (!filtered.length) {
    els.historyBody.innerHTML = `
      <tr>
        <td colspan="${canEdit ? 6 : 5}">
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <p data-i18n="history.none">${tr('history.none')}</p>
          </div>
        </td>
      </tr>`;
    els.historyCount.textContent = tr('history.countMany', { n: 0 });
  } else {
    els.historyBody.innerHTML = filtered.map((t) => `
      <tr data-id="${t.id}">
        <td>${formatDate(t.date)}</td>
        <td>${buildTypeBadge(t.type)}</td>
        <td>${escapeHtml(t.head || t.category)}</td>
        <td class="right amount-cell ${t.type} nowrap">${formatCurrency(t.amount)}</td>
        <td>${escapeHtml(displayAddedBy(t.added_by))}</td>
        ${canEdit ? `
        <td class="center actions-cell">
          <button class="action-btn edit" data-action="edit" title="${tr('common.edit')}" data-i18n="common.edit">${tr('common.edit')}</button>
        </td>` : ''}
      </tr>`).join('');
    els.historyCount.textContent = filtered.length === 1
      ? tr('history.countOne')
      : tr('history.countMany', { n: filtered.length });
  }
  applyI18n(els.historyBody);

  // --- Income History table ---
  const incomeTxs = filtered.filter((t) => String(t.type).toLowerCase() === 'income');
  if (!incomeTxs.length) {
    els.historyBodyIncome.innerHTML = `
      <tr>
        <td colspan="${canEdit ? 5 : 4}">
          <div class="empty-state">
            <div class="empty-icon">📈</div>
            <p data-i18n="report.noIncomeFound">${tr('report.noIncomeFound')}</p>
          </div>
        </td>
      </tr>`;
    els.historyCountIncome.textContent = tr('history.incomeCountMany', { n: 0 });
  } else {
    els.historyBodyIncome.innerHTML = incomeTxs.map((t) => `
      <tr data-id="${t.id}">
        <td>${formatDate(t.date)}</td>
        <td>${escapeHtml(t.head || t.category)}</td>
        <td class="right amount-cell income nowrap">${formatCurrency(t.amount)}</td>
        <td>${escapeHtml(displayAddedBy(t.added_by))}</td>
        ${canEdit ? `
        <td class="center actions-cell">
          <button class="action-btn edit" data-action="edit" title="${tr('common.edit')}" data-i18n="common.edit">${tr('common.edit')}</button>
        </td>` : ''}
      </tr>`).join('');
    els.historyCountIncome.textContent = incomeTxs.length === 1
      ? tr('history.incomeCountOne')
      : tr('history.incomeCountMany', { n: incomeTxs.length });
  }
  applyI18n(els.historyBodyIncome);

  // --- Expense History table ---
  const expenseTxs = filtered.filter((t) => String(t.type).toLowerCase() === 'expense');
  if (!expenseTxs.length) {
    els.historyBodyExpense.innerHTML = `
      <tr>
        <td colspan="${canEdit ? 5 : 4}">
          <div class="empty-state">
            <div class="empty-icon">📉</div>
            <p data-i18n="report.noExpenseFound">${tr('report.noExpenseFound')}</p>
          </div>
        </td>
      </tr>`;
    els.historyCountExpense.textContent = tr('history.expenseCountMany', { n: 0 });
  } else {
    els.historyBodyExpense.innerHTML = expenseTxs.map((t) => `
      <tr data-id="${t.id}">
        <td>${formatDate(t.date)}</td>
        <td>${escapeHtml(t.head || t.category)}</td>
        <td class="right amount-cell expense nowrap">${formatCurrency(t.amount)}</td>
        <td>${escapeHtml(displayAddedBy(t.added_by))}</td>
        ${canEdit ? `
        <td class="center actions-cell">
          <button class="action-btn edit" data-action="edit" title="${tr('common.edit')}" data-i18n="common.edit">${tr('common.edit')}</button>
        </td>` : ''}
      </tr>`).join('');
    els.historyCountExpense.textContent = expenseTxs.length === 1
      ? tr('history.expenseCountOne')
      : tr('history.expenseCountMany', { n: expenseTxs.length });
  }
  applyI18n(els.historyBodyExpense);

  // --- Totals Summary Cards (filtered within selected date range) ---
  const totalIncome = filtered
    .filter((t) => String(t.type).toLowerCase() === 'income')
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalExpense = filtered
    .filter((t) => String(t.type).toLowerCase() === 'expense')
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  if (els.summaryTotalIncome) els.summaryTotalIncome.textContent = formatCurrency(totalIncome);
  if (els.summaryTotalExpense) els.summaryTotalExpense.textContent = formatCurrency(totalExpense);
  if (els.summaryBalance) {
    const balance = totalIncome - totalExpense;
    els.summaryBalance.textContent = formatCurrency(balance);
    els.summaryBalance.style.color = balance >= 0 ? 'var(--green)' : 'var(--red)';
  }
  if (els.printHistoryDate) {
    const from = els.historyFromDate?.value || '—';
    const to = els.historyToDate?.value || '—';
    els.printHistoryDate.textContent = tr('print.rangeJoin', { from, to });
  }
  const activeTab = document.querySelector('.history-tab.active')?.dataset?.historyTab || 'all';
  updateHistorySummaryCards(activeTab);
}

function updateHistoryPrintTitle(tabName) {
  if (!els.printHistoryReportTitle) return;
  if (tabName === 'income') {
    setI18nText(els.printHistoryReportTitle, 'print.historyIncomeTitle');
  } else if (tabName === 'expense') {
    setI18nText(els.printHistoryReportTitle, 'print.historyExpenseTitle');
  } else {
    setI18nText(els.printHistoryReportTitle, 'print.historyReportTitle');
  }
}

// ---------- History summary cards toggle ----------
function updateHistorySummaryCards(tabName) {
  const cardIncome = els.historyCardIncome || document.querySelector('.history-summary-cards .summary-income');
  const cardExpense = els.historyCardExpense || document.querySelector('.history-summary-cards .summary-expense');
  const cardBalance = els.historyCardBalance || document.querySelector('.history-summary-cards .summary-balance');
  const summaryContainer = els.historySummaryContainer || document.querySelector('.history-summary-cards');

  if (!cardIncome || !cardExpense || !cardBalance) return;

  if (tabName === 'income') {
    cardIncome.style.display = 'flex';
    cardExpense.style.display = 'none';
    cardBalance.style.display = 'none';
    if (summaryContainer) {
      summaryContainer.classList.add('single-card');
      summaryContainer.style.gridTemplateColumns = '1fr';
    }
  } else if (tabName === 'expense') {
    cardIncome.style.display = 'none';
    cardExpense.style.display = 'flex';
    cardBalance.style.display = 'none';
    if (summaryContainer) {
      summaryContainer.classList.add('single-card');
      summaryContainer.style.gridTemplateColumns = '1fr';
    }
  } else {
    cardIncome.style.display = 'flex';
    cardExpense.style.display = 'flex';
    cardBalance.style.display = 'flex';
    if (summaryContainer) {
      summaryContainer.classList.remove('single-card');
      summaryContainer.style.gridTemplateColumns = '';
    }
  }
}

// ---------- History tab switching ----------
function setHistoryTab(tabName) {
  const tab = document.querySelector(`.history-tab[data-history-tab="${tabName}"]`);
  if (!tab) return;
  els.historyTabs.forEach((t) => t.classList.remove('active'));
  tab.classList.add('active');
  els.historyPanels.forEach((panel) => {
    panel.style.display = 'none';
  });
  const panel = document.getElementById(`history-panel-${tabName}`);
  if (panel) panel.style.display = '';
  updateHistoryPrintTitle(tabName);
  updateHistorySummaryCards(tabName);
}

els.historyTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setHistoryTab(tab.dataset.historyTab);
  });
});

// ---------- History event delegation ----------
function handleHistoryRowClick(e) {
  const btn = e.target.closest('.action-btn');
  if (!btn) return;

  const row = btn.closest('tr');
  const id = Number(row.dataset.id);
  const transaction = allTransactions.find((t) => t.id === id);
  if (!transaction) return;

  if (btn.dataset.action === 'edit') {
    if (!userCanEditTransactions()) {
      showToast(tr('role.noEditPermission'), 'error');
      return;
    }
    openEditTransactionModal(transaction);
  } else if (btn.dataset.action === 'delete') {
    openDeleteModal(transaction);
  }
}

els.historyBody.addEventListener('click', handleHistoryRowClick);
els.historyBodyIncome.addEventListener('click', handleHistoryRowClick);
els.historyBodyExpense.addEventListener('click', handleHistoryRowClick);

// ---------- Edit Transaction Modal ----------
function openEditTransactionModal(transaction) {
  if (!els.editTxModalOverlay) return;
  els.editTxId.value = transaction.id;
  let dateVal = transaction.date;
  if (dateVal && typeof dateVal === 'string' && dateVal.includes('T')) {
    dateVal = dateVal.split('T')[0];
  }
  els.editTxDate.value = dateVal || '';
  els.editTxHead.value = transaction.head || transaction.category || '';
  els.editTxAmount.value = transaction.amount != null ? transaction.amount : '';
  if (els.editTxError) {
    els.editTxError.textContent = '';
    els.editTxError.classList.remove('visible');
  }
  els.editTxModalOverlay.classList.add('active');
}

function closeEditTransactionModal() {
  if (!els.editTxModalOverlay) return;
  els.editTxModalOverlay.classList.remove('active');
  if (els.editTxError) {
    els.editTxError.textContent = '';
    els.editTxError.classList.remove('visible');
  }
}

if (els.btnEditTxCancel) {
  els.btnEditTxCancel.addEventListener('click', closeEditTransactionModal);
}

if (els.editTxModalOverlay) {
  els.editTxModalOverlay.addEventListener('click', (e) => {
    if (e.target === els.editTxModalOverlay) {
      closeEditTransactionModal();
    }
  });
}

if (els.editTxForm) {
  els.editTxForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (els.editTxError) {
      els.editTxError.textContent = '';
      els.editTxError.classList.remove('visible');
    }

    if (!userCanEditTransactions()) {
      showToast(tr('role.noEditPermission'), 'error');
      closeEditTransactionModal();
      return;
    }

    const id = Number(els.editTxId.value);
    const date = els.editTxDate.value;
    const head = els.editTxHead.value.trim();
    const amount = parseFloat(els.editTxAmount.value);

    if (!id || !date || !head || isNaN(amount) || amount <= 0) {
      if (els.editTxError) {
        els.editTxError.textContent = tr('modal.invalid');
        els.editTxError.classList.add('visible');
      }
      return;
    }

    try {
      if (els.btnEditTxSave) {
        els.btnEditTxSave.disabled = true;
        setDynamicText(els.btnEditTxSave, tr('modal.updating'));
      }

      const res = await window.api.updateTransaction(id, { date, head, amount });
      if (!res.success) {
        throw new Error(res.error || tr('history.updateFailed'));
      }

      showToast(tr('history.updated'));
      closeEditTransactionModal();

      const refreshRes = await window.api.getAllTransactions();
      if (refreshRes && refreshRes.success) {
        allTransactions = refreshRes.data;
        populateCategoryFilter();
      }
      renderHistory();
      refreshDashboard();
    } catch (err) {
      console.error('Update transaction failed:', err);
      if (els.editTxError) {
        els.editTxError.textContent = err.message || tr('history.updateFailed');
        els.editTxError.classList.add('visible');
      } else {
        showToast(err.message || tr('history.updateFailed'), 'error');
      }
    } finally {
      if (els.btnEditTxSave) {
        els.btnEditTxSave.disabled = false;
        setI18nText(els.btnEditTxSave, 'common.update');
      }
    }
  });
}

// ---------- Edit ----------
async function openEditForm(transaction) {
  editingId = transaction.id;
  const isIncome = transaction.type === 'income';

  els.transactionEditId.value = transaction.id;
  setTransactionMode(isIncome ? 'income' : 'expense');
  els.transactionDate.value = transaction.date;
  els.transactionHead.value = transaction.category;
  els.transactionAmount.value = transaction.amount;
  els.transactionNote.value = transaction.description || '';
  els.transactionFormError.classList.remove('visible');
  els.btnCancelTransactionEdit.style.display = 'inline-block';
  setI18nText(els.transactionFormTitle, isIncome ? 'transaction.editIncome' : 'transaction.editExpense');

  switchView('add-transaction');
}

// ---------- Delete modal ----------
function openDeleteModal(transaction) {
  deleteTargetId = transaction.id;
  deleteTargetTransaction = transaction;
  setDynamicText(
    els.modalMessage,
    tr('modal.deleteMessage', {
      name: transaction.category,
      amount: formatCurrency(transaction.amount),
      date: formatDate(transaction.date)
    })
  );
  els.modalOverlay.classList.add('active');
}

function closeDeleteModal() {
  deleteTargetId = null;
  deleteTargetTransaction = null;
  els.modalOverlay.classList.remove('active');
}

els.btnModalCancel.addEventListener('click', closeDeleteModal);
els.modalOverlay.addEventListener('click', (e) => {
  if (e.target === els.modalOverlay) closeDeleteModal();
});

els.btnModalConfirm.addEventListener('click', async () => {
  if (deleteTargetId === null) return;

  try {
    const res = await window.api.deleteTransaction(deleteTargetId);
    if (!res.success) throw new Error(res.error);

    allTransactions = allTransactions.filter((t) => t.id !== deleteTargetId);
    showToast(tr('history.deleted'));
    populateCategoryFilter();
    renderHistory();
    refreshDashboard();
  } catch (err) {
    console.error('Delete failed:', err);
    showToast(tr('history.deleteFailed'), 'error');
  } finally {
    closeDeleteModal();
  }
});

// ---------- Filters ----------
els.searchInput.addEventListener('input', renderHistory);
els.historyFromDate?.addEventListener('change', renderHistory);
els.historyToDate?.addEventListener('change', renderHistory);
els.historyFromDate?.addEventListener('input', renderHistory);
els.historyToDate?.addEventListener('input', renderHistory);

els.btnRefresh.addEventListener('click', async () => {
  try {
    const res = await window.api.getAllTransactions();
    if (!res.success) throw new Error(res.error);
    allTransactions = res.data;
    populateCategoryFilter();
    renderHistory();
    refreshDashboard();
    showToast(tr('history.refreshed'));
  } catch (err) {
    console.error('Refresh failed:', err);
    showToast(tr('history.refreshFailed'), 'error');
  }
});

els.btnViewAll.addEventListener('click', () => switchView('history'));

// ---------- CSV Backup ----------
// Fetch current table data, convert to CSV, and ask the main process to
// show a "Save As" dialog and write the file.
function toCsvCell(value) {
  const str = value == null ? '' : String(value);
  return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
}

async function handleBackup() {
  try {
    const res = await window.api.getAllTransactions();
    if (!res.success) throw new Error(res.error);
    const rows = res.data;

    const header = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Profit', 'Added By'];
    const csvLines = [header.join(',')];

    rows.forEach((t) => {
      csvLines.push([
        toCsvCell(t.date),
        toCsvCell(t.type),
        toCsvCell(t.category),
        toCsvCell(t.description),
        Number(t.amount) || 0,
        Number(t.profit) || 0,
        toCsvCell(t.added_by)
      ].join(','));
    });

    const csv = '\uFEFF' + csvLines.join('\r\n'); // BOM for Excel UTF-8
    const saved = await window.api.saveCsvBackup(csv);
    if (saved && saved.success) {
      showToast(tr('backup.saved'));
    } else if (saved && saved.canceled) {
      showToast(tr('backup.canceled'), 'info');
    } else {
      showToast(tr('backup.failed'), 'error');
    }
  } catch (err) {
    console.error('CSV backup failed:', err);
    showToast(tr('backup.failed'), 'error');
  }
}

if (els.btnBackup) {
  els.btnBackup.addEventListener('click', handleBackup);
}

// ---------- Categories Management ----------
async function renderCategories() {
  try {
    await loadCategories();
    const categories = allCategories;

    if (!categories.length) {
      els.categoryTableBody.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state">
              <div class="empty-icon">🏷️</div>
              <p data-i18n="categories.none">${tr('categories.none')}</p>
            </div>
          </td>
        </tr>`;
      els.categoryCount.textContent = tr('categories.countMany', { n: 0 });
      applyI18n(els.categoryTableBody);
      return;
    }

    els.categoryTableBody.innerHTML = categories.map((c, i) => `
      <tr data-id="${c.id}">
        <td>${i + 1}</td>
        <td>${escapeHtml(c.name)}</td>
        <td>${buildTypeBadge(c.type)}</td>
        <td class="center">
          <div class="actions-cell">
            <button class="action-btn edit" data-action="edit" title="${tr('common.edit')}" data-i18n-title="common.edit">✏️</button>
            <button class="action-btn delete" data-action="delete" title="${tr('common.delete')}" data-i18n-title="common.delete">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    els.categoryCount.textContent = categories.length === 1
      ? tr('categories.countOne')
      : tr('categories.countMany', { n: categories.length });
    applyI18n(els.categoryTableBody);
  } catch (err) {
    console.error('Render categories failed:', err);
    showToast(tr('categories.loadFailed'), 'error');
  }
}

function resetCategoryForm() {
  categoryEditingId = null;
  els.categoryForm.reset();
  els.categoryFormError.classList.remove('visible');
  setI18nText(els.categoryFormTitle, 'categories.addTitle');
  setI18nText(els.btnAddCategory, 'categories.addButton');
  els.btnCancelCategoryEdit.style.display = 'none';
}

function openCategoryEditForm(category) {
  categoryEditingId = category.id;
  els.categoryName.value = category.name;
  els.categoryType.value = category.type;
  els.categoryFormError.classList.remove('visible');
  setI18nText(els.categoryFormTitle, 'categories.editTitle');
  setI18nText(els.btnAddCategory, 'categories.updateButton');
  els.btnCancelCategoryEdit.style.display = 'inline-block';
  window.scrollTo(0, 0);
}

els.categoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.categoryFormError.classList.remove('visible');

  const name = els.categoryName.value.trim();
  const type = els.categoryType.value;

  if (!name) {
    els.categoryFormError.textContent = tr('categories.nameRequired');
    els.categoryFormError.classList.add('visible');
    return;
  }

  try {
    if (categoryEditingId !== null) {
      const res = await window.api.updateCategory(categoryEditingId, { name, type });
      if (!res.success) throw new Error(res.error);
      showToast(tr('categories.updated', { name }));
    } else {
      const res = await window.api.addCategory({ name, type });
      if (!res.success) throw new Error(res.error);
      showToast(tr('categories.added', { name }));
    }
    allCategories = [];
    resetCategoryForm();
    await renderCategories();
  } catch (err) {
    console.error('Save category failed:', err);
    els.categoryFormError.textContent = err.message || tr('categories.saveFailed');
    els.categoryFormError.classList.add('visible');
  }
});

els.btnCancelCategoryEdit.addEventListener('click', () => {
  resetCategoryForm();
});

els.btnRefreshCategories.addEventListener('click', async () => {
  await renderCategories();
  showToast(tr('categories.refreshed'));
});

els.categoryTableBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('.action-btn');
  if (!btn) return;

  const row = btn.closest('tr');
  const id = Number(row.dataset.id);
  const category = allCategories.find((c) => c.id === id);
  if (!category) return;

  if (btn.dataset.action === 'edit') {
    openCategoryEditForm(category);
    return;
  }

  const confirmed = confirm(tr('categories.confirmDelete', { name: category.name }));
  if (!confirmed) return;

  try {
    const res = await window.api.deleteCategory(id);
    if (!res.success) throw new Error(res.error);
    allCategories = allCategories.filter((c) => c.id !== id);
    showToast(tr('categories.deleted', { name: category.name }));
    if (categoryEditingId === id) resetCategoryForm();
    await renderCategories();
  } catch (err) {
    console.error('Delete category failed:', err);
    showToast(tr('categories.deleteFailed'), 'error');
  }
});

// ---------- Users Management ----------
async function loadUsers() {
  const res = await window.api.getAllUsers();
  if (!res.success) throw new Error(res.error);
  allUsers = res.data;
  return allUsers;
}

async function renderUsers() {
  try {
    await loadUsers();
    const users = allUsers;

    if (!users.length) {
      els.userTableBody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state">
              <div class="empty-icon">👥</div>
              <p data-i18n="users.none">${tr('users.none')}</p>
            </div>
          </td>
        </tr>`;
      els.userCount.textContent = tr('users.countMany', { n: 0 });
      applyI18n(els.userTableBody);
      return;
    }

    els.userTableBody.innerHTML = users.map((u) => {
      const isAdmin = u.username === 'admin' || u.role === 'admin';
      const editBtn = `<button class="action-btn edit" data-action="edit-user" title="${tr('common.edit')}" data-i18n-title="common.edit">✏️</button>`;
      const deleteBtn = (u.username === 'admin')
        ? `<span class="admin-badge" data-i18n="common.admin">${tr('common.admin')}</span>`
        : `<button class="action-btn delete" data-action="delete" title="${tr('common.delete')}" data-i18n-title="common.delete">🗑️</button>`;

      let roleLabel = tr('role.user');
      let roleBadgeClass = 'role-badge view-only';
      let roleKey = 'role.user';
      if (u.role === 'admin') {
        roleLabel = tr('common.admin');
        roleBadgeClass = 'role-badge admin';
        roleKey = 'common.admin';
      }

      const canEditVal = Boolean(u.can_edit === 1 || u.can_edit === true || u.role === 'admin');
      const canEditBadge = canEditVal
        ? `<span class="status-badge active" style="color: var(--green); font-weight: 600;" data-i18n="common.yes">${tr('common.yes')}</span>`
        : `<span class="status-badge inactive" style="color: var(--text-muted);" data-i18n="common.no">${tr('common.no')}</span>`;

      return `
        <tr data-id="${u.id}">
          <td>${u.id}</td>
          <td>${escapeHtml(u.username)}</td>
          <td><span class="${roleBadgeClass}" data-i18n="${roleKey}">${roleLabel}</span></td>
          <td>${canEditBadge}</td>
          <td class="center">
            <div class="actions-cell">
              ${editBtn}
              ${deleteBtn}
            </div>
          </td>
        </tr>`;
    }).join('');

    els.userCount.textContent = users.length === 1
      ? tr('users.countOne')
      : tr('users.countMany', { n: users.length });
    applyI18n(els.userTableBody);
  } catch (err) {
    console.error('Render users failed:', err);
    showToast(tr('users.loadFailed'), 'error');
  }
}

function resetUserForm() {
  editingUserId = null;
  els.userForm.reset();
  els.userPassword.required = true;
  if (els.userRole) els.userRole.value = 'user';
  if (els.userCanEdit) els.userCanEdit.checked = false;
  els.userFormError.classList.remove('visible');
  setI18nText(els.userFormTitle, 'users.addTitle');
  setI18nText(els.btnCreateUser, 'users.createButton');
}

function openUserEditForm(user) {
  editingUserId = user.id;
  els.userUsername.value = user.username;
  els.userPassword.value = '';
  els.userPassword.required = false;
  if (els.userRole) els.userRole.value = user.role || 'user';
  if (els.userCanEdit) {
    els.userCanEdit.checked = Boolean(user.can_edit === 1 || user.can_edit === true || user.role === 'admin');
  }
  els.userFormError.classList.remove('visible');
  setI18nText(els.userFormTitle, 'users.editTitle');
  setI18nText(els.btnCreateUser, 'users.updateButton');
  window.scrollTo(0, 0);
}

els.userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.userFormError.classList.remove('visible');

  const username = els.userUsername.value.trim();
  const password = els.userPassword.value;
  const role = els.userRole ? els.userRole.value : 'user';
  const can_edit = els.userCanEdit ? els.userCanEdit.checked : false;

  if (!username) {
    els.userFormError.textContent = tr('users.usernameRequired');
    els.userFormError.classList.add('visible');
    return;
  }
  // Password is only required when creating a new user.
  if (editingUserId === null && !password) {
    els.userFormError.textContent = tr('users.passwordRequired');
    els.userFormError.classList.add('visible');
    return;
  }

  try {
    if (editingUserId !== null) {
      const res = await window.api.updateUser(editingUserId, { username, password, role, can_edit });
      if (!res.success) throw new Error(res.error);
      showToast(tr('users.updated', { name: username }));
      resetUserForm();
    } else {
      const res = await window.api.addUser({ username, password, role, can_edit });
      if (!res.success) throw new Error(res.error);
      showToast(tr('users.added', { name: username }));
      resetUserForm();
    }
    await renderUsers();
  } catch (err) {
    console.error('Save user failed:', err);
    els.userFormError.textContent = err.message || tr('users.saveFailed');
    els.userFormError.classList.add('visible');
  }
});

els.btnRefreshUsers.addEventListener('click', async () => {
  await renderUsers();
  showToast(tr('users.refreshed'));
});

els.userTableBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('.action-btn');
  if (!btn) return;

  const row = btn.closest('tr');
  const id = Number(row.dataset.id);
  const user = allUsers.find((u) => u.id === id);
  if (!user) return;

  if (btn.dataset.action === 'edit-user') {
    openUserEditForm(user);
    return;
  }

  const confirmed = confirm(tr('users.confirmDelete', { name: user.username }));
  if (!confirmed) return;

  try {
    const res = await window.api.deleteUser(id);
    if (!res.success) throw new Error(res.error);
    allUsers = allUsers.filter((u) => u.id !== id);
    showToast(tr('users.deleted', { name: user.username }));
    await renderUsers();
  } catch (err) {
    console.error('Delete user failed:', err);
    showToast(err.message || tr('users.deleteFailed'), 'error');
  }
});

// ---------- Auth: Login ----------
function showLoginScreen() {
  els.loginContainer.style.display = 'flex';
  els.mainAppContainer.style.display = 'none';
  els.loginUsername.focus();
}

function showMainApp() {
  els.loginContainer.style.display = 'none';
  els.mainAppContainer.style.display = 'flex';
}

function resetChangePasswordForm() {
  els.changePasswordForm.reset();
  els.changePasswordFormError.classList.remove('visible');
  els.changePasswordFormSuccess.classList.remove('visible');
}

// ---------- App Settings (Login Background Image) ----------
function resetAppSettingsForm() {
  if (els.loginBgInput) els.loginBgInput.value = '';
  if (els.appSettingsError) els.appSettingsError.classList.remove('visible');
}

// Save the selected image as the login screen background.
els.btnSaveBackground.addEventListener('click', () => {
  const file = els.loginBgInput.files && els.loginBgInput.files[0];
  if (!file) {
    els.appSettingsError.textContent = tr('settings.selectImage');
    els.appSettingsError.classList.add('visible');
    return;
  }

  // Convert the selected image to a Base64 data URL.
  const reader = new FileReader();
  reader.onload = async () => {
    const dataUrl = reader.result;
    try {
      const res = await window.api.saveSetting('login_bg', dataUrl);
      if (!res.success) throw new Error(res.error);
      // Apply instantly so the next login shows the new background.
      applyLoginBackground(dataUrl);
      els.appSettingsError.classList.remove('visible');
      showToast(tr('settings.saved'));
      els.loginBgInput.value = '';
    } catch (err) {
      console.error('Save background failed:', err);
      els.appSettingsError.textContent = tr('settings.saveFailed');
      els.appSettingsError.classList.add('visible');
    }
  };
  reader.onerror = () => {
    els.appSettingsError.textContent = tr('settings.readFailed');
    els.appSettingsError.classList.add('visible');
  };
  reader.readAsDataURL(file);
});

// Apply a background image (or clear it if null/empty) to the login screen.
// A dark transparent overlay keeps the form text readable over the image.
function applyLoginBackground(dataUrl) {
  if (els.loginContainer) {
    els.loginContainer.style.backgroundImage = dataUrl
      ? `url("${dataUrl}")`
      : '';
    els.loginContainer.style.backgroundSize = 'cover';
    els.loginContainer.style.backgroundPosition = 'center';
    els.loginContainer.style.backgroundRepeat = 'no-repeat';
  }
}

// On app load, fetch the saved login background setting and apply it.
async function loadLoginBackground() {
  try {
    const res = await window.api.getSetting('login_bg');
    if (res.success && res.value) {
      applyLoginBackground(res.value);
    }
  } catch (err) {
    console.error('Load login background failed:', err);
  }
}

// ---------- Auth: friendly login error messages ----------
// Map raw server / database errors to generic messages so no MySQL details
// leak into the UI. "Invalid Credentials" for a bad username/password combo,
// otherwise "Server Error". Keeps the same .form-error element + .visible
// class so the existing UI design is untouched.
function loginErrorMessage(err) {
  const raw = String((err && (err.error || err.message)) || '');
  if (err && err.code === 'db_error') return tr('login.serverError');
  if (err && err.code === 'invalid_credentials') return tr('login.invalid');
  if (/invalid username or password/i.test(raw)) return tr('login.invalid');
  return tr('login.serverError');
}

els.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.loginFormError.classList.remove('visible');

  const username = els.loginUsername.value.trim();
  const password = els.loginPassword.value;

  if (!username || !password) {
    els.loginFormError.textContent = tr('login.enterBoth');
    els.loginFormError.classList.add('visible');
    return;
  }

  // Disable the button while logging in
  els.btnLogin.disabled = true;
  setDynamicText(els.btnLogin, tr('login.loggingIn'));

  try {
    const res = await window.api.login(username, password);
    if (!res.success) {
      els.loginFormError.textContent = loginErrorMessage(res);
      els.loginFormError.classList.add('visible');
      return;
    }

    // Store the logged-in user (id + username + role)
    currentUser = res.user;
    try {
      sessionStorage.setItem('accounts_current_user', JSON.stringify(currentUser));
    } catch (_) {}

    // Update the sidebar user display
    els.sidebarUserName.textContent = currentUser.username;

    // Clear the login form inputs
    els.loginForm.reset();
    els.loginFormError.classList.remove('visible');

    // Show the main app
    showMainApp();
    applyPermissions();
    switchView('dashboard');
    refreshDashboard();
    showToast(tr('login.welcome', { name: currentUser.username }));
  } catch (err) {
    console.error('Login failed:', err);
    els.loginFormError.textContent = loginErrorMessage({ error: err.message });
    els.loginFormError.classList.add('visible');
  } finally {
    els.btnLogin.disabled = false;
    setI18nText(els.btnLogin, 'login.login');
  }
});

// ---------- Auth: Logout ----------
els.btnLogout.addEventListener('click', () => {
  closeMobileSidebar();
  // Clear the logged-in user
  currentUser = null;
  try {
    sessionStorage.removeItem('accounts_current_user');
  } catch (_) {}

  // Remove the role badge and restore all buttons/actions for next login
  const badge = document.getElementById('role-badge');
  if (badge) badge.remove();
  document.querySelectorAll('.action-btn').forEach((btn) => {
    btn.style.display = '';
  });
  document.querySelectorAll('.nav-subitem[data-view="sell"], .nav-subitem[data-view="add-transaction"]').forEach((btn) => {
    btn.style.pointerEvents = '';
    btn.style.opacity = '';
  });
  ['btn-sell-product', 'btn-income-submit', 'btn-expense-submit', 'btn-add-category', 'btn-add-product', 'btn-create-user', 'btn-update-password', 'btn-print-invoice', 'btn-new-sale', 'btn-cancel-income-edit', 'btn-cancel-expense-edit', 'btn-cancel-category-edit', 'btn-cancel-product-edit'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('disabled');
    }
  });

  // Clear the login form inputs
  els.loginForm.reset();
  els.loginFormError.classList.remove('visible');

  // Return to the login screen
  showLoginScreen();
  showToast(tr('login.loggedOut'), 'info');
});

// ---------- Auth: Change Password ----------
els.changePasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.changePasswordFormError.classList.remove('visible');
  els.changePasswordFormSuccess.classList.remove('visible');

  const currentPassword = els.cpCurrentPassword.value;
  const newPassword = els.cpNewPassword.value;
  const confirmPassword = els.cpConfirmPassword.value;

  if (!currentPassword) {
    els.changePasswordFormError.textContent = tr('changePassword.currentRequired');
    els.changePasswordFormError.classList.add('visible');
    return;
  }
  if (!newPassword) {
    els.changePasswordFormError.textContent = tr('changePassword.newRequired');
    els.changePasswordFormError.classList.add('visible');
    return;
  }
  if (newPassword !== confirmPassword) {
    els.changePasswordFormError.textContent = tr('changePassword.mismatch');
    els.changePasswordFormError.classList.add('visible');
    return;
  }
  if (!currentUser) {
    els.changePasswordFormError.textContent = tr('changePassword.notLoggedIn');
    els.changePasswordFormError.classList.add('visible');
    return;
  }

  els.btnUpdatePassword.disabled = true;
  setDynamicText(els.btnUpdatePassword, tr('changePassword.updating'));

  try {
    const res = await window.api.changePassword(currentUser.id, currentPassword, newPassword);
    if (!res.success) throw new Error(res.error);

    els.changePasswordFormSuccess.textContent = tr('changePassword.success');
    els.changePasswordFormSuccess.classList.add('visible');
    els.changePasswordForm.reset();
    showToast(tr('changePassword.success'));
  } catch (err) {
    console.error('Change password failed:', err);
    els.changePasswordFormError.textContent = err.message || tr('changePassword.failed');
    els.changePasswordFormError.classList.add('visible');
  } finally {
    els.btnUpdatePassword.disabled = false;
    setI18nText(els.btnUpdatePassword, 'changePassword.updateButton');
  }
});

// ---------- Language switching (see src/i18n.js) ----------
// i18n.js already rewrote every static [data-i18n] element; here we refresh
// the dynamic (JS-rendered) parts: badges, counters, table rows and the
// report balance labels.
document.addEventListener('app:languagechange', () => {
  // Labels that depend on application state rather than a plain dictionary key.
  if (currentUser) applyPermissions();
  setTransactionMode(transactionMode);
  refreshProductFormLabels();
  updateDashboardDateText(new Date());

  const activeView = document.querySelector('.view.active');
  const activeId = activeView ? activeView.id : '';

  if (activeId === 'view-dashboard') {
    refreshDashboard();
  } else if (activeId === 'view-history') {
    renderHistory();
    updateHistoryPrintTitle(document.querySelector('.history-tab.active')?.dataset?.historyTab || 'all');
  } else if (activeId === 'view-inventory') {
    renderProducts();
  } else if (activeId === 'view-sell') {
    renderSales();
  } else if (activeId === 'categories-section') {
    renderCategories();
  } else if (activeId === 'view-users') {
    renderUsers();
  } else if (activeId === 'view-monthly-report') {
    renderMonthlyReport();
  } else {
    // Anything else (e.g. the daily report section) only needs its
    // previously loaded payload re-rendered.
    refreshReportBalanceLabels();
  }

  // The daily report section lives outside the .view list.
  if (els.dailyReportSection && els.dailyReportSection.style.display === 'block') {
    refreshReportBalanceLabels();
  }

  // Keep an open delete-confirmation dialog in the selected language.
  if (deleteTargetTransaction && els.modalOverlay && els.modalOverlay.classList.contains('active')) {
    openDeleteModal(deleteTargetTransaction);
  }
});

// Re-render the cached daily report payload and its balance label.
function refreshReportBalanceLabels() {
  if (lastDailyRows) {
    renderFilteredTransactions(lastDailyRows, lastDailyYesterdayBalance);
  }
  if (lastMonthlyRows) {
    const incomeRows = lastMonthlyRows.filter((t) => t.type === 'income');
    const expenseRows = lastMonthlyRows.filter((t) => t.type === 'expense');
    renderMonthlyReportRows(els.monthlyReportIncomeBody, incomeRows, true);
    renderMonthlyReportRows(els.monthlyReportExpenseBody, expenseRows, false);
    if (els.monthlyPreviousBalance) {
      els.monthlyPreviousBalance.textContent = `${tr('report.lastMonthBalance')}: ${formatCurrency(lastMonthlyBalance)}`;
    }
  }
  renderRecent(lastRecentTransactions);
}

// ---------- Keyboard shortcut ----------
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (els.modalOverlay.classList.contains('active')) {
      closeDeleteModal();
    }
  }
});

// ---------- Init ----------
(async function init() {
  let restored = false;
  try {
    const saved = sessionStorage.getItem('accounts_current_user');
    if (saved) {
      currentUser = JSON.parse(saved);
      if (currentUser && currentUser.username) {
        els.sidebarUserName.textContent = currentUser.username;
        showMainApp();
        applyPermissions();
        switchView('dashboard');
        restored = true;
      }
    }
  } catch (_) {}

  if (!restored) {
    // Show the login screen first
    showLoginScreen();
  }
  resetChangePasswordForm();

  // Set today's local date on the forms (read-only for transactions)
  const today = new Date();
  const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  if (els.transactionDate) {
    els.transactionDate.value = localDate;
    els.transactionDate.readOnly = true;
    els.transactionDate.setAttribute('readonly', 'true');
  }
  if (els.transactionHead) els.transactionHead.removeAttribute('placeholder');
  if (els.transactionAmount) els.transactionAmount.removeAttribute('placeholder');
  if (els.transactionNote) els.transactionNote.removeAttribute('placeholder');
  els.saleDate.value = localDate;

  // Daily Report: default From/To dates to today
  const todayISOStr = todayISO();
  if (els.filterFromDate) els.filterFromDate.value = todayISOStr;
  if (els.filterToDate) els.filterToDate.value = todayISOStr;

  // History: default From and To dates to today's local date (YYYY-MM-DD) upon page load
  if (els.historyFromDate) els.historyFromDate.value = localDate;
  if (els.historyToDate) els.historyToDate.value = localDate;

  // Set dashboard and report dates
  updateDashboardDateText(today);

  // Monthly Report: default the month picker to the current month (YYYY-MM)
  if (els.monthlyMonthPicker) {
    els.monthlyMonthPicker.value = todayISO().slice(0, 7);
  }

  // Hide the cancel-edit button on first load
  if (els.btnCancelTransactionEdit) els.btnCancelTransactionEdit.style.display = 'none';

  try {
    const res = await window.api.getAllTransactions();
    if (!res.success) throw new Error(res.error);
    allTransactions = res.data;
    populateCategoryFilter();
    renderHistory();
  } catch (err) {
    console.error('Initial load failed:', err);
    showToast(tr('app.loadFailed'), 'error');
  }

  try {
    await loadProducts();
    await loadProductDropdown();
  } catch (err) {
    console.error('Initial product load failed:', err);
  }

  try {
    await loadCategories();
  } catch (err) {
    console.error('Initial category load failed:', err);
  }

  // Load the saved login background image (if any) and apply it.
  await loadLoginBackground();

  els.btnSearchDate?.addEventListener('click', handleDateSearch);

  startDigitalClock();
  refreshDashboard();
})();
