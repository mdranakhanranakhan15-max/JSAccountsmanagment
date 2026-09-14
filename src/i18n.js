/* ============================================================
   JS NETWORK — i18n (English / Bengali)
   ------------------------------------------------------------
   • Translation dictionary: English key -> { en, bn } values.
   • Static markup is translated through data-i18n attributes:
        data-i18n="KeyName"              -> textContent
        data-i18n-html="KeyName"         -> innerHTML
        data-i18n-placeholder="KeyName"  -> placeholder attribute
        data-i18n-title="KeyName"        -> title attribute
        data-i18n-aria-label="KeyName"   -> aria-label attribute
   • Dynamic (JS rendered) strings are translated with t('KeyName')
     and are re-applied automatically when they carry a data-i18n
     attribute (useful for injected table rows).
   • The choice is persisted in localStorage under 'app_lang'.
     Default language is 'en'.
   ============================================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'app_lang';
  var DEFAULT_LANG = 'en';
  var SUPPORTED_LANGS = ['en', 'bn'];

  // Label shown on the toggle button = the language you would switch TO.
  var LANG_TOGGLE_LABELS = { en: 'বাংলা', bn: 'English' };

  // ---------- Dictionary ----------
  var translations = {
    /* ===== Common ===== */
    'common.income': { en: 'Income', bn: 'আয়' },
    'common.expense': { en: 'Expense', bn: 'ব্যয়' },
    'common.save': { en: 'Save', bn: 'সেভ করুন' },
    'common.search': { en: 'Search', bn: 'খুঁজুন' },
    'common.printReport': { en: '🖨️ Print Report', bn: '🖨️ প্রিন্ট করুন' },
    'common.refresh': { en: '🔄 Refresh', bn: '🔄 রিফ্রেশ' },
    'common.cancel': { en: 'Cancel', bn: 'বাতিল' },
    'common.cancelEdit': { en: 'Cancel Edit', bn: 'এডিট বাতিল' },
    'common.delete': { en: 'Delete', bn: 'ডিলিট করুন' },
    'common.update': { en: 'Update', bn: 'আপডেট করুন' },
    'common.optional': { en: '(optional)', bn: '(ঐচ্ছিক)' },
    'common.date': { en: 'Date', bn: 'তারিখ' },
    'common.month': { en: 'Month', bn: 'মাস' },
    'common.by': { en: 'by', bn: 'যুক্ত করেছেন' },
    'common.yes': { en: 'Yes', bn: 'হ্যাঁ' },
    'common.no': { en: 'No', bn: 'না' },
    'common.admin': { en: 'Admin', bn: 'অ্যাডমিন' },
    'common.edit': { en: '✏️ Edit', bn: '✏️ এডিট' },

    /* ===== Sidebar navigation ===== */
    'nav.dashboard': { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
    'nav.transaction': { en: 'Transaction', bn: 'লেনদেন' },
    'nav.income': { en: '💰 Income', bn: '💰 আয়' },
    'nav.expense': { en: '💸 Expense', bn: '💸 ব্যয়' },
    'nav.reports': { en: 'Reports', bn: 'রিপোর্ট' },
    'nav.dailyReports': { en: '📅 Daily Reports', bn: '📅 দৈনিক রিপোর্ট' },
    'nav.monthlyReports': { en: '🗓️ Monthly Reports', bn: '🗓️ মাসিক রিপোর্ট' },
    'nav.history': { en: 'History', bn: 'ইতিহাস' },
    'nav.expenseHistory': { en: '💸 Expense History', bn: '💸 ব্যয়ের ইতিহাস' },
    'nav.incomeHistory': { en: '💵 Income History', bn: '💵 আয়ের ইতিহাস' },
    'nav.settings': { en: 'Settings', bn: 'সেটিংস' },
    'nav.addUser': { en: '➕ Add User', bn: '➕ ইউজার যোগ করুন' },
    'nav.manageUser': { en: '👥 Manage User', bn: '👥 ইউজার ম্যানেজ' },
    'nav.changePassword': { en: '🔑 Change Password', bn: '🔑 পাসওয়ার্ড পরিবর্তন' },
    'nav.logout': { en: 'Logout', bn: 'লগআউট' },
    'nav.offline': { en: 'Offline · SQLite', bn: 'অফলাইন · SQLite' },
    'nav.toggle': { en: 'Toggle navigation', bn: 'নেভিগেশন টগল করুন' },

    /* ===== Login ===== */
    'login.title': { en: 'JS Network Accounts Management', bn: 'জেএস নেটওয়ার্ক অ্যাকাউন্টস ম্যানেজমেন্ট' },
    'login.username': { en: 'Username', bn: 'ইউজারনেম' },
    'login.usernamePlaceholder': { en: 'Enter username', bn: 'ইউজারনেম লিখুন' },
    'login.password': { en: 'Password', bn: 'পাসওয়ার্ড' },
    'login.passwordPlaceholder': { en: 'Enter password', bn: 'পাসওয়ার্ড লিখুন' },
    'login.login': { en: 'Log In', bn: 'লগ ইন করুন' },
    'login.loggingIn': { en: 'Logging in...', bn: 'লগ ইন হচ্ছে...' },
    'login.enterBoth': { en: 'Please enter both username and password.', bn: 'ইউজারনেম ও পাসওয়ার্ড দুটোই লিখুন।' },
    'login.invalid': { en: 'Invalid Credentials', bn: 'ভুল ইউজারনেম বা পাসওয়ার্ড' },
    'login.serverError': { en: 'Server Error', bn: 'সার্ভার ত্রুটি' },
    'login.welcome': { en: 'Welcome back, {name}!', bn: 'স্বাগতম, {name}!' },
    'login.loggedOut': { en: 'You have been logged out.', bn: 'আপনি লগ আউট হয়েছেন।' },
    'login.forbidden': {
      en: 'Forbidden: Administrator privileges required.',
      bn: 'নিষিদ্ধ: অ্যাডমিনিস্ট্রেটর অনুমতি প্রয়োজন।'
    },

    /* ===== Dashboard ===== */
    'dashboard.title': { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
    'dashboard.backup': { en: '📥 Download Daily Backup (CSV)', bn: '📥 দৈনিক ব্যাকআপ ডাউনলোড (CSV)' },
    'dashboard.todayIncome': { en: "Today's Income", bn: 'আজকের আয়' },
    'dashboard.todayExpense': { en: "Today's Expense", bn: 'আজকের ব্যয়' },
    'dashboard.todayNetCash': { en: "Today's Net Cash", bn: 'আজকের নিট ক্যাশ' },
    'dashboard.recentTransactions': { en: 'Recent Transactions', bn: 'সাম্প্রতিক লেনদেন' },
    'dashboard.viewAll': { en: 'View All', bn: 'সব দেখুন' },
    'dashboard.noTx': {
      en: 'No transactions yet.<br>Add your first one!',
      bn: 'এখনো কোনো লেনদেন নেই।<br>প্রথম লেনদেনটি যোগ করুন!'
    },
    'dashboard.loadFailed': { en: 'Failed to load dashboard data.', bn: 'ড্যাশবোর্ডের ডেটা লোড করা যায়নি।' },

    /* ===== Reports ===== */
    'report.dailyTitle': { en: 'Daily Report', bn: 'দৈনিক রিপোর্ট' },
    'report.dailySubtitle': {
      en: 'View income & expense transactions for a selected date',
      bn: 'নির্বাচিত তারিখের আয় ও ব্যয়ের লেনদেন দেখুন'
    },
    'report.monthlyTitle': { en: 'Monthly Report', bn: 'মাসিক রিপোর্ট' },
    'report.monthlySubtitle': {
      en: 'View income & expense transactions for a selected month',
      bn: 'নির্বাচিত মাসের আয় ও ব্যয়ের লেনদেন দেখুন'
    },
    'report.todayCashInHand': { en: "Today's Cash In Hand", bn: 'আজকের জমা' },
    'report.totalCashInHand': { en: 'Total Cash In Hand', bn: 'সর্বমোট জমা' },
    'report.thisMonthCash': { en: "This Month's Cash", bn: 'এই মাসের জমা' },
    'report.yesterdayBalance': { en: 'Yesterday Balance', bn: 'গতকালের জের' },
    'report.lastMonthBalance': { en: 'Last Month Balance', bn: 'গত মাসের জের' },
    'report.noIncomeFound': { en: 'No income transactions found.', bn: 'কোনো আয়ের লেনদেন পাওয়া যায়নি।' },
    'report.noExpenseFound': { en: 'No expense transactions found.', bn: 'কোনো ব্যয়ের লেনদেন পাওয়া যায়নি।' },
    'report.selectDate': { en: 'Please select a date.', bn: 'একটি তারিখ নির্বাচন করুন।' },
    'report.dailyLoadFailed': {
      en: 'Failed to load daily report: {error}',
      bn: 'দৈনিক রিপোর্ট লোড করা যায়নি: {error}'
    },

    /* ===== Table headers ===== */
    'table.categoryHead': { en: 'Category/Head', bn: 'খাত' },
    'table.amount': { en: 'Amount', bn: 'পরিমাণ' },
    'table.date': { en: 'Date', bn: 'তারিখ' },
    'table.type': { en: 'Type', bn: 'ধরন' },
    'table.category': { en: 'Category', bn: 'খাত' },
    'table.actions': { en: 'Actions', bn: 'অ্যাকশন' },
    'table.actionsUpper': { en: 'ACTIONS', bn: 'অ্যাকশন' },
    'table.totalIncome': { en: 'Total Income', bn: 'সর্বমোট আয়' },
    'table.totalExpense': { en: 'Total Expense', bn: 'সর্বমোট ব্যয়' },
    'table.productName': { en: 'Product Name', bn: 'পণ্যের নাম' },
    'table.purchasePrice': { en: 'Purchase Price', bn: 'ক্রয় মূল্য' },
    'table.stock': { en: 'Stock', bn: 'স্টক' },
    'table.customer': { en: 'Customer', bn: 'ক্রেতা' },
    'table.product': { en: 'Product', bn: 'পণ্য' },
    'table.qty': { en: 'Qty', bn: 'পরিমাণ' },
    'table.unitPrice': { en: 'Unit Price', bn: 'একক মূল্য' },
    'table.total': { en: 'Total', bn: 'মোট' },
    'table.profit': { en: 'Profit', bn: 'লাভ' },
    'table.addedBy': { en: 'ADDED BY', bn: 'যুক্ত করেছেন' },
    'table.id': { en: 'ID', bn: 'আইডি' },
    'table.username': { en: 'Username', bn: 'ইউজারনেম' },
    'table.role': { en: 'Role', bn: 'রোল' },
    'table.canEdit': { en: 'Can Edit', bn: 'এডিট অনুমতি' },
    'table.categoryName': { en: 'Category Name', bn: 'ক্যাটাগরির নাম' },

    /* ===== Print header / footer ===== */
    'print.companySub': { en: 'Accounts Management System', bn: 'অ্যাকাউন্টস ম্যানেজমেন্ট সিস্টেম' },
    'print.dailyReportTitle': { en: 'Daily Accounts Report', bn: 'দৈনিক হিসাব রিপোর্ট' },
    'print.monthlyReportTitle': { en: 'Monthly Accounts Report', bn: 'মাসিক হিসাব রিপোর্ট' },
    'print.historyReportTitle': { en: 'Transaction History Report', bn: 'লেনদেনের ইতিহাস রিপোর্ট' },
    'print.historyIncomeTitle': { en: 'Income History Report', bn: 'আয়ের ইতিহাস রিপোর্ট' },
    'print.historyExpenseTitle': { en: 'Expense History Report', bn: 'ব্যয়ের ইতিহাস রিপোর্ট' },
    'print.date': { en: 'Date:', bn: 'তারিখ:' },
    'print.month': { en: 'Month:', bn: 'মাস:' },
    'print.period': { en: 'Period:', bn: 'সময়কাল:' },
    'print.accounts': { en: 'Accounts', bn: 'হিসাবরক্ষক' },
    'print.manager': { en: 'Manager', bn: 'ম্যানেজার' },
    'print.managingDirector': { en: 'Managing Director', bn: 'ব্যবস্থাপনা পরিচালক' },
    'print.printedOn': { en: 'Printed on:', bn: 'প্রিন্টের সময়:' },
    'print.rangeJoin': { en: '{from} to {to}', bn: '{from} হতে {to}' },
    'print.footerCompany': { en: 'JS NETWORK Accounts Management', bn: 'জেএস নেটওয়ার্ক অ্যাকাউন্টস ম্যানেজমেন্ট' },

    /* ===== Roles / permissions ===== */
    'role.administrator': { en: 'Administrator', bn: 'অ্যাডমিনিস্ট্রেটর' },
    'role.userEditAllowed': { en: 'User (Edit Allowed)', bn: 'ইউজার (এডিট অনুমোদিত)' },
    'role.viewOnly': { en: 'View Only', bn: 'শুধু দেখা' },
    'role.user': { en: 'User', bn: 'ইউজার' },
    'role.noEditPermission': {
      en: 'You do not have permission to edit transactions.',
      bn: 'আপনার লেনদেন এডিট করার অনুমতি নেই।'
    },

    'report.monthlyLoadFailed': {
      en: 'Failed to load monthly report: {error}',
      bn: 'মাসিক রিপোর্ট লোড করা যায়নি: {error}'
    },
    'report.unknownError': { en: 'Unknown error', bn: 'অজানা ত্রুটি' },

    /* ===== Inventory (Products) ===== */
    'inventory.title': { en: 'Inventory', bn: 'ইনভেন্টরি' },
    'inventory.subtitle': { en: 'Add products and manage stock', bn: 'পণ্য যোগ করুন এবং স্টক ম্যানেজ করুন' },
    'inventory.addTitle': { en: 'Add New Product', bn: 'নতুন পণ্য যোগ করুন' },
    'inventory.addSubtitle': {
      en: 'Add a new item to your inventory',
      bn: 'আপনার ইনভেন্টরিতে নতুন আইটেম যোগ করুন'
    },
    'inventory.editTitle': { en: 'Edit Product', bn: 'পণ্য এডিট করুন' },
    'inventory.editSubtitle': { en: 'Update details for "{name}"', bn: '"{name}" এর তথ্য আপডেট করুন' },
    'inventory.addButton': { en: 'Add Product', bn: 'পণ্য যোগ করুন' },
    'inventory.updateButton': { en: 'Update Product', bn: 'পণ্য আপডেট করুন' },
    'inventory.productName': { en: 'Product Name', bn: 'পণ্যের নাম' },
    'inventory.productNamePlaceholder': { en: 'e.g. SIM Card', bn: 'যেমন: সিম কার্ড' },
    'inventory.purchasePrice': { en: 'Purchase Price', bn: 'ক্রয় মূল্য' },
    'inventory.purchasePriceAlias': { en: '(কেনার দাম)', bn: '' },
    'inventory.initialStock': { en: 'Initial Stock', bn: 'প্রাথমিক স্টক' },
    'inventory.productList': { en: 'Product List', bn: 'পণ্যের তালিকা' },
    'inventory.none': {
      en: 'No products yet. Add your first product!',
      bn: 'এখনো কোনো পণ্য নেই। প্রথম পণ্যটি যোগ করুন!'
    },
    'inventory.inStock': { en: '{n} in stock', bn: 'স্টকে {n}টি' },
    'inventory.lowStock': { en: '{n} left', bn: '{n}টি বাকি' },
    'inventory.outOfStock': { en: 'Out of stock', bn: 'স্টক শেষ' },
    'inventory.countOne': { en: '1 product', bn: '১টি পণ্য' },
    'inventory.countMany': { en: '{n} products', bn: '{n}টি পণ্য' },
    'inventory.nameRequired': { en: 'Please enter a product name.', bn: 'পণ্যের নাম লিখুন।' },
    'inventory.priceInvalid': {
      en: 'Please enter a valid purchase price (0 or more).',
      bn: 'সঠিক ক্রয় মূল্য লিখুন (০ বা তার বেশি)।'
    },
    'inventory.stockInvalid': {
      en: 'Please enter a valid initial stock (0 or more).',
      bn: 'সঠিক প্রাথমিক স্টক লিখুন (০ বা তার বেশি)।'
    },
    'inventory.added': { en: 'Product "{name}" added successfully.', bn: 'পণ্য "{name}" সফলভাবে যোগ হয়েছে।' },
    'inventory.updated': { en: 'Product "{name}" updated successfully.', bn: 'পণ্য "{name}" সফলভাবে আপডেট হয়েছে।' },
    'inventory.saveFailed': { en: 'Failed to save product.', bn: 'পণ্য সংরক্ষণ করা যায়নি।' },
    'inventory.loadFailed': { en: 'Failed to load products.', bn: 'পণ্য লোড করা যায়নি।' },
    'inventory.refreshed': { en: 'Inventory refreshed.', bn: 'ইনভেন্টরি রিফ্রেশ হয়েছে।' },
    'inventory.saleLoadFailed': {
      en: 'Failed to load products for sale.',
      bn: 'বিক্রয়ের জন্য পণ্য লোড করা যায়নি।'
    },
    'inventory.noProductsFound': { en: 'No products found', bn: 'কোনো পণ্য পাওয়া যায়নি' },
    'inventory.editAction': { en: 'Edit Product', bn: 'পণ্য এডিট করুন' },

    /* ===== Sell Product ===== */
    'sale.title': { en: 'Sell Product', bn: 'পণ্য বিক্রয়' },
    'sale.subtitle': {
      en: 'Record a sale — stock is deducted automatically',
      bn: 'বিক্রয় রেকর্ড করুন — স্টক স্বয়ংক্রিয়ভাবে কমে যাবে'
    },
    'sale.customerName': { en: 'Customer Name', bn: 'ক্রেতার নাম' },
    'sale.productName': { en: 'Product Name', bn: 'পণ্যের নাম' },
    'sale.quantity': { en: 'Quantity', bn: 'পরিমাণ' },
    'sale.discount': { en: 'Discount (Tk)', bn: 'ছাড় (টাকা)' },
    'sale.sellingPrice': { en: 'Selling Price', bn: 'বিক্রয় মূল্য' },
    'sale.purchasePrice': { en: 'Purchase Price', bn: 'ক্রয় মূল্য' },
    'sale.profit': { en: 'Profit', bn: 'লাভ' },
    'sale.totalAmount': { en: 'Total Amount', bn: 'মোট পরিমাণ' },
    'sale.sellButton': { en: 'Sell Product', bn: 'বিক্রয় করুন' },
    'sale.recentSales': { en: 'Recent Sales', bn: 'সাম্প্রতিক বিক্রয়' },
    'sale.none': { en: 'No sales recorded yet.', bn: 'এখনো কোনো বিক্রয় রেকর্ড হয়নি।' },
    'sale.countOne': { en: '1 sale', bn: '১টি বিক্রয়' },
    'sale.countMany': { en: '{n} sales', bn: '{n}টি বিক্রয়' },
    'sale.totalPrefix': { en: 'Total: ', bn: 'মোট: ' },
    'sale.profitPrefix': { en: 'Profit: ', bn: 'লাভ: ' },
    'sale.customerRequired': { en: 'Please enter the customer name.', bn: 'ক্রেতার নাম লিখুন।' },
    'sale.productRequired': { en: 'Please select a product.', bn: 'একটি পণ্য নির্বাচন করুন।' },
    'sale.productInvalid': { en: 'Please select a valid product.', bn: 'সঠিক পণ্য নির্বাচন করুন।' },
    'sale.qtyInvalid': {
      en: 'Please enter a valid quantity greater than 0.',
      bn: '০ এর বেশি সঠিক পরিমাণ লিখুন।'
    },
    'sale.stockInsufficient': {
      en: 'Insufficient stock. Only {n} item(s) available for {name}.',
      bn: 'পর্যাপ্ত স্টক নেই। {name} এর জন্য মাত্র {n}টি আছে।'
    },
    'sale.priceInvalid': { en: 'Please enter a valid selling price.', bn: 'সঠিক বিক্রয় মূল্য লিখুন।' },
    'sale.recorded': {
      en: 'Sale recorded — {product} × {qty} for {customer}.',
      bn: 'বিক্রয় রেকর্ড হয়েছে — {product} × {qty}, ক্রেতা {customer}।'
    },
    'sale.recordFailed': { en: 'Failed to record sale.', bn: 'বিক্রয় রেকর্ড করা যায়নি।' },
    'sale.loadFailed': { en: 'Failed to load sales.', bn: 'বিক্রয় লোড করা যায়নি।' },
    'sale.refreshed': { en: 'Sales refreshed.', bn: 'বিক্রয় রিফ্রেশ হয়েছে।' },

    /* ===== Invoice / Receipt ===== */
    'invoice.customerName': { en: 'Customer Name', bn: 'ক্রেতার নাম' },
    'invoice.shopDetails': { en: 'Shop Details/Address', bn: 'দোকানের বিবরণ/ঠিকানা' },
    'invoice.totalSoldAmount': { en: 'Total Sold Amount', bn: 'মোট বিক্রয়মূল্য' },
    'invoice.thankYou': {
      en: 'Thank you for shopping at JS NETWORK!',
      bn: 'জেএস নেটওয়ার্ক থেকে কেনাকাটার জন্য ধন্যবাদ!'
    },
    'invoice.printReceipt': { en: '🖨️ Print Receipt', bn: '🖨️ রিসিট প্রিন্ট করুন' },
    'invoice.newSale': { en: '➕ New Sale', bn: '➕ নতুন বিক্রয়' },

    /* ===== Add Transaction ===== */
    'transaction.title': { en: 'Add Transaction', bn: 'লেনদেন যোগ করুন' },
    'transaction.subtitle': {
      en: 'Record a new income or expense entry',
      bn: 'নতুন আয় বা ব্যয়ের এন্ট্রি রেকর্ড করুন'
    },
    'transaction.addIncome': { en: '➕ Add Income', bn: '➕ আয় যোগ করুন' },
    'transaction.addExpense': { en: '➖ Add Expense', bn: '➖ ব্যয় যোগ করুন' },
    'transaction.editIncome': { en: '➕ Edit Income', bn: '➕ আয় এডিট' },
    'transaction.editExpense': { en: '➖ Edit Expense', bn: '➖ ব্যয় এডিট' },
    'transaction.headIncome': { en: 'Head (Income)', bn: 'খাত (আয়)' },
    'transaction.headExpense': { en: 'Head (Expense)', bn: 'খাত (ব্যয়)' },
    'transaction.amount': { en: 'Amount', bn: 'পরিমাণ' },
    'transaction.note': { en: 'Note', bn: 'নোট' },
    'transaction.dateRequired': { en: 'Please choose a date.', bn: 'একটি তারিখ নির্বাচন করুন।' },
    'transaction.headRequired': { en: 'Please enter the head.', bn: 'খাত লিখুন।' },
    'transaction.amountInvalid': {
      en: 'Please enter a valid amount greater than 0.',
      bn: '০ এর বেশি সঠিক পরিমাণ লিখুন।'
    },
    'transaction.savedIncome': { en: 'Income saved successfully.', bn: 'আয় সফলভাবে সংরক্ষিত হয়েছে।' },
    'transaction.savedExpense': { en: 'Expense saved successfully.', bn: 'ব্যয় সফলভাবে সংরক্ষিত হয়েছে।' },
    'transaction.updatedIncome': { en: 'Income updated successfully.', bn: 'আয় সফলভাবে আপডেট হয়েছে।' },
    'transaction.updatedExpense': { en: 'Expense updated successfully.', bn: 'ব্যয় সফলভাবে আপডেট হয়েছে।' },
    'transaction.saveFailed': {
      en: 'Failed to save. Please try again.',
      bn: 'সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।'
    },

    /* ===== History ===== */
    'history.title': { en: 'History', bn: 'ইতিহাস' },
    'history.subtitle': { en: 'All recorded transactions', bn: 'সব রেকর্ডকৃত লেনদেন' },
    'history.searchPlaceholder': { en: '🔍  Search...', bn: '🔍  খুঁজুন...' },
    'history.fromDate': { en: 'From Date:', bn: 'শুরুর তারিখ:' },
    'history.toDate': { en: 'To Date:', bn: 'শেষ তারিখ:' },
    'history.tabAll': { en: 'All Transactions', bn: 'সব লেনদেন' },
    'history.tabIncome': { en: 'Income History', bn: 'আয়ের ইতিহাস' },
    'history.tabExpense': { en: 'Expense History', bn: 'ব্যয়ের ইতিহাস' },
    'history.balance': { en: 'Balance', bn: 'ব্যালেন্স' },
    'history.totalIncome': { en: 'Total Income', bn: 'মোট আয়' },
    'history.totalExpense': { en: 'Total Expense', bn: 'মোট ব্যয়' },
    'history.none': { en: 'No transactions found.', bn: 'কোনো লেনদেন পাওয়া যায়নি।' },
    'history.countOne': { en: '1 transaction', bn: '১টি লেনদেন' },
    'history.countMany': { en: '{n} transactions', bn: '{n}টি লেনদেন' },
    'history.incomeCountOne': { en: '1 income transaction', bn: '১টি আয়ের লেনদেন' },
    'history.incomeCountMany': { en: '{n} income transactions', bn: '{n}টি আয়ের লেনদেন' },
    'history.expenseCountOne': { en: '1 expense transaction', bn: '১টি ব্যয়ের লেনদেন' },
    'history.expenseCountMany': { en: '{n} expense transactions', bn: '{n}টি ব্যয়ের লেনদেন' },
    'history.typeIncome': { en: 'income', bn: 'আয়' },
    'history.typeExpense': { en: 'expense', bn: 'ব্যয়' },
    'history.refreshed': { en: 'Data refreshed.', bn: 'ডেটা রিফ্রেশ হয়েছে।' },
    'history.refreshFailed': { en: 'Failed to refresh data.', bn: 'ডেটা রিফ্রেশ করা যায়নি।' },
    'history.deleted': { en: 'Transaction deleted.', bn: 'লেনদেন ডিলিট হয়েছে।' },
    'history.deleteFailed': { en: 'Failed to delete transaction.', bn: 'লেনদেন ডিলিট করা যায়নি।' },
    'history.updated': { en: 'Transaction updated successfully.', bn: 'লেনদেন সফলভাবে আপডেট হয়েছে।' },
    'history.updateFailed': { en: 'Failed to update transaction.', bn: 'লেনদেন আপডেট করা যায়নি।' },

    /* ===== Categories ===== */
    'categories.title': { en: 'Manage Categories', bn: 'ক্যাটাগরি ম্যানেজ' },
    'categories.subtitle': {
      en: 'Add or remove income & expense categories',
      bn: 'আয় ও ব্যয়ের ক্যাটাগরি যোগ করুন বা মুছুন'
    },
    'categories.addTitle': { en: '➕ Add New Category', bn: '➕ নতুন ক্যাটাগরি' },
    'categories.editTitle': { en: '✏️ Edit Category', bn: '✏️ ক্যাটাগরি এডিট' },
    'categories.name': { en: 'Category Name', bn: 'ক্যাটাগরির নাম' },
    'categories.namePlaceholder': { en: 'e.g. Mobile Sale', bn: 'যেমন: মোবাইল সেল' },
    'categories.type': { en: 'Type', bn: 'ধরন' },
    'categories.addButton': { en: 'Add Category', bn: 'ক্যাটাগরি যোগ করুন' },
    'categories.updateButton': { en: 'Update Category', bn: 'ক্যাটাগরি আপডেট করুন' },
    'categories.list': { en: 'Category List', bn: 'ক্যাটাগরির তালিকা' },
    'categories.none': { en: 'No categories yet. Add your first one!', bn: 'এখনো কোনো ক্যাটাগরি নেই। প্রথমটি যোগ করুন!' },
    'categories.countOne': { en: '1 category', bn: '১টি ক্যাটাগরি' },
    'categories.countMany': { en: '{n} categories', bn: '{n}টি ক্যাটাগরি' },
    'categories.nameRequired': { en: 'Please enter a category name.', bn: 'ক্যাটাগরির নাম লিখুন।' },
    'categories.added': { en: 'Category "{name}" added successfully.', bn: 'ক্যাটাগরি "{name}" সফলভাবে যোগ হয়েছে।' },
    'categories.updated': { en: 'Category "{name}" updated successfully.', bn: 'ক্যাটাগরি "{name}" সফলভাবে আপডেট হয়েছে।' },
    'categories.deleted': { en: 'Category "{name}" deleted.', bn: 'ক্যাটাগরি "{name}" ডিলিট হয়েছে।' },
    'categories.confirmDelete': { en: 'Delete category "{name}"?', bn: 'ক্যাটাগরি "{name}" ডিলিট করবেন?' },
    'categories.saveFailed': { en: 'Failed to save category.', bn: 'ক্যাটাগরি সংরক্ষণ করা যায়নি।' },
    'categories.deleteFailed': { en: 'Failed to delete category.', bn: 'ক্যাটাগরি ডিলিট করা যায়নি।' },
    'categories.loadFailed': { en: 'Failed to load categories.', bn: 'ক্যাটাগরি লোড করা যায়নি।' },
    'categories.refreshed': { en: 'Categories refreshed.', bn: 'ক্যাটাগরি রিফ্রেশ হয়েছে।' },

    /* ===== Users ===== */
    'users.title': { en: 'Manage Users', bn: 'ইউজার ম্যানেজ' },
    'users.subtitle': { en: 'Create and manage app users', bn: 'অ্যাপের ইউজার তৈরি ও ম্যানেজ করুন' },
    'users.addTitle': { en: '➕ Add New User', bn: '➕ নতুন ইউজার যোগ করুন' },
    'users.editTitle': { en: '✏️ Edit User', bn: '✏️ ইউজার এডিট' },
    'users.username': { en: 'Username', bn: 'ইউজারনেম' },
    'users.usernamePlaceholder': { en: 'e.g. shopmanager', bn: 'যেমন: shopmanager' },
    'users.password': { en: 'Password', bn: 'পাসওয়ার্ড' },
    'users.role': { en: 'Role', bn: 'রোল' },
    'users.allowEdit': { en: 'Allow Editing Transactions', bn: 'লেনদেন এডিট করার অনুমতি দিন' },
    'users.createButton': { en: 'Create User', bn: 'ইউজার তৈরি করুন' },
    'users.updateButton': { en: 'Update User', bn: 'ইউজার আপডেট করুন' },
    'users.list': { en: 'Users List', bn: 'ইউজারের তালিকা' },
    'users.none': { en: 'No users yet. Create your first user!', bn: 'এখনো কোনো ইউজার নেই। প্রথম ইউজারটি তৈরি করুন!' },
    'users.countOne': { en: '1 user', bn: '১টি ইউজার' },
    'users.countMany': { en: '{n} users', bn: '{n}টি ইউজার' },
    'users.usernameRequired': { en: 'Please enter a username.', bn: 'ইউজারনেম লিখুন।' },
    'users.passwordRequired': { en: 'Please enter a password.', bn: 'পাসওয়ার্ড লিখুন।' },
    'users.added': { en: 'User "{name}" created successfully.', bn: 'ইউজার "{name}" সফলভাবে তৈরি হয়েছে।' },
    'users.updated': { en: 'User "{name}" updated successfully.', bn: 'ইউজার "{name}" সফলভাবে আপডেট হয়েছে।' },
    'users.deleted': { en: 'User "{name}" deleted.', bn: 'ইউজার "{name}" ডিলিট হয়েছে।' },
    'users.confirmDelete': { en: 'Delete user "{name}"?', bn: 'ইউজার "{name}" ডিলিট করবেন?' },
    'users.saveFailed': { en: 'Failed to save user.', bn: 'ইউজার সংরক্ষণ করা যায়নি।' },
    'users.deleteFailed': { en: 'Failed to delete user.', bn: 'ইউজার ডিলিট করা যায়নি।' },
    'users.loadFailed': { en: 'Failed to load users.', bn: 'ইউজার লোড করা যায়নি।' },
    'users.refreshed': { en: 'Users list refreshed.', bn: 'ইউজারের তালিকা রিফ্রেশ হয়েছে।' },

    /* ===== App Settings ===== */
    'settings.title': { en: 'App Settings', bn: 'অ্যাপ সেটিংস' },
    'settings.subtitle': { en: 'Customize the application appearance', bn: 'অ্যাপের চেহারা কাস্টমাইজ করুন' },
    'settings.bgTitle': { en: '🖼️ Login Background Image', bn: '🖼️ লগইন ব্যাকগ্রাউন্ড ছবি' },
    'settings.bgHelp': {
      en: 'Choose an image from your computer to use as the login screen background.',
      bn: 'লগইন স্ক্রিনের ব্যাকগ্রাউন্ড হিসেবে ব্যবহার করতে কম্পিউটার থেকে একটি ছবি নির্বাচন করুন।'
    },
    'settings.backgroundImage': { en: 'Background Image', bn: 'ব্যাকগ্রাউন্ড ছবি' },
    'settings.saveBackground': { en: '💾 Save Background', bn: '💾 ব্যাকগ্রাউন্ড সেভ করুন' },
    'settings.selectImage': { en: 'Please select an image first.', bn: 'প্রথমে একটি ছবি নির্বাচন করুন।' },
    'settings.saved': {
      en: 'Login background saved successfully.',
      bn: 'লগইন ব্যাকগ্রাউন্ড সফলভাবে সেভ হয়েছে।'
    },
    'settings.saveFailed': {
      en: 'Failed to save background. Please try again.',
      bn: 'ব্যাকগ্রাউন্ড সেভ করা যায়নি। আবার চেষ্টা করুন।'
    },
    'settings.readFailed': { en: 'Failed to read the selected image.', bn: 'নির্বাচিত ছবি পড়া যায়নি।' },

    /* ===== Change Password ===== */
    'changePassword.title': { en: 'Change Password', bn: 'পাসওয়ার্ড পরিবর্তন' },
    'changePassword.subtitle': { en: 'Update your account password', bn: 'আপনার অ্যাকাউন্টের পাসওয়ার্ড আপডেট করুন' },
    'changePassword.formTitle': { en: '🔑 Change Password', bn: '🔑 পাসওয়ার্ড পরিবর্তন' },
    'changePassword.current': { en: 'Current Password', bn: 'বর্তমান পাসওয়ার্ড' },
    'changePassword.currentPlaceholder': { en: 'Enter current password', bn: 'বর্তমান পাসওয়ার্ড লিখুন' },
    'changePassword.new': { en: 'New Password', bn: 'নতুন পাসওয়ার্ড' },
    'changePassword.newPlaceholder': { en: 'Enter new password', bn: 'নতুন পাসওয়ার্ড লিখুন' },
    'changePassword.confirm': { en: 'Confirm Password', bn: 'পাসওয়ার্ড নিশ্চিত করুন' },
    'changePassword.confirmPlaceholder': { en: 'Confirm new password', bn: 'নতুন পাসওয়ার্ড নিশ্চিত করুন' },
    'changePassword.updateButton': { en: 'Update Password', bn: 'পাসওয়ার্ড আপডেট করুন' },
    'changePassword.updating': { en: 'Updating...', bn: 'আপডেট হচ্ছে...' },
    'changePassword.currentRequired': { en: 'Please enter your current password.', bn: 'বর্তমান পাসওয়ার্ড লিখুন।' },
    'changePassword.newRequired': { en: 'Please enter a new password.', bn: 'নতুন পাসওয়ার্ড লিখুন।' },
    'changePassword.mismatch': {
      en: 'New password and confirm password do not match.',
      bn: 'নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।'
    },
    'changePassword.notLoggedIn': {
      en: 'You must be logged in to change your password.',
      bn: 'পাসওয়ার্ড পরিবর্তন করতে আপনাকে লগ ইন করতে হবে।'
    },
    'changePassword.success': { en: 'Password updated successfully.', bn: 'পাসওয়ার্ড সফলভাবে আপডেট হয়েছে।' },
    'changePassword.failed': { en: 'Failed to update password.', bn: 'পাসওয়ার্ড আপডেট করা যায়নি।' },

    /* ===== Modals ===== */
    'modal.deleteTitle': { en: 'Delete Transaction?', bn: 'লেনদেন ডিলিট করবেন?' },
    'modal.defaultMessage': { en: 'This action cannot be undone.', bn: 'এই কাজটি ফিরিয়ে আনা যাবে না।' },
    'modal.deleteMessage': {
      en: 'Delete "{name}" of {amount} ({date})? This cannot be undone.',
      bn: '"{name}" ({amount}, {date}) ডিলিট করবেন? এটি ফিরিয়ে আনা যাবে না।'
    },
    'modal.editTitle': { en: '✏️ Edit Transaction', bn: '✏️ লেনদেন এডিট' },
    'modal.headCategory': { en: 'Head / Category', bn: 'খাত / ক্যাটাগরি' },
    'modal.amountTk': { en: 'Amount (Tk)', bn: 'পরিমাণ (টাকা)' },
    'modal.invalid': {
      en: 'Please enter a valid date, head, and amount.',
      bn: 'সঠিক তারিখ, খাত ও পরিমাণ লিখুন।'
    },
    'modal.updating': { en: 'Updating...', bn: 'আপডেট হচ্ছে...' },

    /* ===== Backup / misc ===== */
    'backup.saved': { en: 'CSV backup saved successfully.', bn: 'CSV ব্যাকআপ সফলভাবে সেভ হয়েছে।' },
    'backup.canceled': { en: 'Backup canceled.', bn: 'ব্যাকআপ বাতিল হয়েছে।' },
    'backup.failed': { en: 'Failed to save CSV backup.', bn: 'CSV ব্যাকআপ সেভ করা যায়নি।' },
    'app.loadFailed': {
      en: 'Failed to load data from database.',
      bn: 'ডেটাবেজ থেকে ডেটা লোড করা যায়নি।'
    },

    /* ===== Language toggle ===== */
    'lang.buttonTitle': { en: 'Switch language / ভাষা পরিবর্তন', bn: 'Switch language / ভাষা পরিবর্তন' }
  };

  // ---------- Core helpers ----------
  var currentLang = DEFAULT_LANG;

  function isSupported(lang) {
    return SUPPORTED_LANGS.indexOf(lang) !== -1;
  }

  // Replace {placeholder} tokens inside a translated string.
  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function (match, name) {
      return Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match;
    });
  }

  // Raw dictionary lookup for a given language (falls back to English).
  function lookup(key, lang) {
    var entry = translations[key];
    if (!entry) return null;
    if (typeof entry[lang] === 'string') return entry[lang];
    if (typeof entry.en === 'string') return entry.en;
    return null;
  }

  // Translate a dictionary key: t('common.save') or t('users.added', { name: 'x' })
  function t(key, vars) {
    var value = lookup(key, currentLang);
    if (value === null) return key;
    return interpolate(value, vars);
  }

  // ---------- DOM translation ----------
  var TEXT_ATTR_MAP = [
    ['data-i18n-placeholder', 'placeholder'],
    ['data-i18n-title', 'title'],
    ['data-i18n-aria-label', 'aria-label']
  ];

  var I18N_SELECTOR =
    '[data-i18n],[data-i18n-html],[data-i18n-placeholder],[data-i18n-title],[data-i18n-aria-label]';

  function translateElement(el, lang) {
    var key = el.getAttribute('data-i18n');
    if (key) {
      var text = lookup(key, lang);
      if (text !== null) el.textContent = text;
    }

    var htmlKey = el.getAttribute('data-i18n-html');
    if (htmlKey) {
      var html = lookup(htmlKey, lang);
      if (html !== null) el.innerHTML = html;
    }

    TEXT_ATTR_MAP.forEach(function (pair) {
      var attrKey = el.getAttribute(pair[0]);
      if (!attrKey) return;
      var value = lookup(attrKey, lang);
      if (value !== null) el.setAttribute(pair[1], value);
    });
  }

  /**
   * Translate every [data-i18n*] element inside `root`
   * (defaults to document). Call it right after injecting dynamic rows
   * so the injected markup is translated too.
   */
  function applyTranslations(root, lang) {
    var scope = root && typeof root.querySelectorAll === 'function' ? root : document;
    var targetLang = isSupported(lang) ? lang : currentLang;
    var elements = scope.querySelectorAll(I18N_SELECTOR);
    for (var i = 0; i < elements.length; i++) {
      translateElement(elements[i], targetLang);
    }
  }

  // The toggle button always shows the language you would switch TO.
  function updateToggleButtons(lang) {
    var buttons = document.querySelectorAll('.lang-toggle');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].textContent = LANG_TOGGLE_LABELS[lang] || LANG_TOGGLE_LABELS.en;
    }
  }

  /**
   * Switch the whole UI to `lang` ('en' | 'bn').
   * - rewrites every [data-i18n] element
   * - persists the choice in localStorage('app_lang')
   * - broadcasts 'app:languagechange' so dynamic renderers refresh
   */
  function setLanguage(lang) {
    currentLang = isSupported(lang) ? lang : DEFAULT_LANG;

    try {
      localStorage.setItem(STORAGE_KEY, currentLang);
    } catch (_) {}

    if (document.documentElement) {
      document.documentElement.setAttribute('lang', currentLang);
    }
    if (document.body) {
      document.body.classList.toggle('lang-bn', currentLang === 'bn');
    }

    applyTranslations(document, currentLang);
    updateToggleButtons(currentLang);

    document.dispatchEvent(
      new CustomEvent('app:languagechange', { detail: { lang: currentLang } })
    );

    return currentLang;
  }

  function getLanguage() {
    return currentLang;
  }

  function toggleLanguage() {
    return setLanguage(currentLang === 'en' ? 'bn' : 'en');
  }

  function getStoredLanguage() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return isSupported(saved) ? saved : DEFAULT_LANG;
    } catch (_) {
      return DEFAULT_LANG;
    }
  }

  // Locale used for date / time formatting (Bengali month names in bn).
  function locale() {
    return currentLang === 'bn' ? 'bn-BD' : 'en-US';
  }

  // ---------- Public API ----------
  window.i18n = {
    translations: translations,
    t: t,
    setLanguage: setLanguage,
    getLanguage: getLanguage,
    toggleLanguage: toggleLanguage,
    apply: applyTranslations,
    locale: locale,
    storageKey: STORAGE_KEY
  };
  // Convenience global so renderer.js templates can use t('key') directly.
  window.t = t;

  // ---------- Wire the language toggle button(s) ----------
  document.addEventListener('click', function (event) {
    var btn = event.target && event.target.closest ? event.target.closest('.lang-toggle') : null;
    if (!btn) return;
    event.preventDefault();
    toggleLanguage();
  });

  // ---------- Boot: restore the saved language (default 'en') ----------
  setLanguage(getStoredLanguage());
})();

