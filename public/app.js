// State Management
const state = {
  expenses: [],
  summary: {
    month: '',
    totalSpent: 0,
    breakdown: {}
  },
  filters: {
    title: '',
    category: '',
    startDate: '',
    endDate: ''
  },
  currentMonth: '', // YYYY-MM
  budgetLimit: 2000, // Monthly budget cap
  titleDebounceTimeout: null
};

// SVG Category Icons Mapping
const CATEGORY_ICONS = {
  Food: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`, // default, but let's use actual themed SVGs
  Transport: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="22" height="13" rx="2" ry="2"></rect><path d="M7 21h10M12 16v5"></path></svg>`, // Train / bus
  Shopping: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`, // Shopping bag
  Bills: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line></svg>`, // Card / Bills
  Entertainment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>`, // Film
  Other: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>` // Box / Package
};

// Custom customized icons for Food and Bills specifically
CATEGORY_ICONS.Food = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`; // Let's use simple dollar or utensils. Actually, standard feather icons:
// Let's replace food with a coffee/utensils-like SVG
CATEGORY_ICONS.Food = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`; // Coffee cup!
CATEGORY_ICONS.Bills = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`; // Dollar sign for Bills!
CATEGORY_ICONS.Transport = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="22" height="13" rx="2" ry="2"></rect><path d="M7 21h10M12 16v5"></path></svg>`; // Screen but let's make it a Car
CATEGORY_ICONS.Transport = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle></svg>`; // Car!

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// App Initialization
function initApp() {
  // Set default dates
  const todayStr = getTodayDateString();
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  
  document.getElementById('expense-date').value = todayStr;
  document.getElementById('summary-month-picker').value = currentMonthStr;
  state.currentMonth = currentMonthStr;

  // Initialize Theme
  initTheme();

  // Run dynamic clock
  startClock();

  // Load Data
  fetchExpenses();
  fetchSummary();

  // Attach Event Listeners
  setupEventListeners();
}

// Start live clock in header
function startClock() {
  const timeDisplay = document.getElementById('current-time-display');
  const updateTime = () => {
    const now = new Date();
    timeDisplay.textContent = now.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }) + ' | ' + now.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };
  updateTime();
  setInterval(updateTime, 1000);
}

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  showToast(`Switched to ${isDark ? 'Dark' : 'Light'} Mode`, 'info');
}

// Event Listeners Setup
function setupEventListeners() {
  // Theme Toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Forms
  document.getElementById('add-expense-form').addEventListener('submit', handleAddExpenseSubmit);
  document.getElementById('edit-expense-form').addEventListener('submit', handleEditExpenseSubmit);

  // Inputs change to remove invalid red border immediately
  const addFormInputs = document.querySelectorAll('#add-expense-form .form-control');
  addFormInputs.forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
      const errEl = document.getElementById(`error-${input.id.replace('expense-', '')}`);
      if (errEl) errEl.textContent = '';
    });
  });

  const editFormInputs = document.querySelectorAll('#edit-expense-form .form-control');
  editFormInputs.forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('invalid');
      const errEl = document.getElementById(`edit-error-${input.id.replace('edit-expense-', '')}`);
      if (errEl) errEl.textContent = '';
    });
  });

  // Filters Event Binding (Reactive)
  document.getElementById('filter-title-input').addEventListener('input', (e) => {
    state.filters.title = e.target.value;
    // Debounce the text search to avoid fast sequential network hits
    clearTimeout(state.titleDebounceTimeout);
    state.titleDebounceTimeout = setTimeout(() => {
      fetchExpenses();
    }, 250);
  });

  document.getElementById('filter-category-select').addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    fetchExpenses();
  });

  document.getElementById('filter-date-from').addEventListener('change', (e) => {
    state.filters.startDate = e.target.value;
    fetchExpenses();
  });

  document.getElementById('filter-date-to').addEventListener('change', (e) => {
    state.filters.endDate = e.target.value;
    fetchExpenses();
  });

  // Clear filters
  document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);

  // Quick Presets
  document.getElementById('quick-preset-this-month').addEventListener('click', () => setPresetFilter('this-month'));
  document.getElementById('quick-preset-last-30').addEventListener('click', () => setPresetFilter('last-30'));
  document.getElementById('quick-preset-this-year').addEventListener('click', () => setPresetFilter('this-year'));

  // Summary Month Selector
  document.getElementById('summary-month-picker').addEventListener('change', (e) => {
    state.currentMonth = e.target.value;
    fetchSummary();
  });

  // Modal actions
  document.getElementById('close-modal-btn').addEventListener('click', closeEditModal);
  document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
  document.getElementById('edit-expense-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('edit-expense-modal')) {
      closeEditModal();
    }
  });
}

// Helper: Get today's local date YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Fetch Expenses API
async function fetchExpenses() {
  try {
    const params = new URLSearchParams();
    if (state.filters.category) params.append('category', state.filters.category);
    if (state.filters.title) params.append('title', state.filters.title);
    if (state.filters.startDate) params.append('startDate', state.filters.startDate);
    if (state.filters.endDate) params.append('endDate', state.filters.endDate);

    const response = await fetch(`/api/expenses?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to load transaction history.');
    
    state.expenses = await response.json();
    renderExpensesList();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Fetch Summary API
async function fetchSummary() {
  try {
    const response = await fetch(`/api/summary?month=${state.currentMonth}`);
    if (!response.ok) throw new Error('Failed to load summary stats.');
    
    state.summary = await response.json();
    renderSummary();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Render Expenses List in UI
function renderExpensesList() {
  const container = document.getElementById('expenses-container');
  const resultsCount = document.getElementById('results-count-display');
  
  resultsCount.textContent = `${state.expenses.length} transaction${state.expenses.length === 1 ? '' : 's'}`;

  if (state.expenses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon-container">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="9" y1="15" x2="15" y2="15"></line>
            <line x1="12" y1="12" x2="12" y2="18"></line>
          </svg>
        </div>
        <p class="empty-title">No transactions found</p>
        <p class="empty-subtitle">Try adjusting your filters or record a new expense.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  state.expenses.forEach(exp => {
    const card = document.createElement('article');
    card.className = `expense-item-card cat-${exp.category}`;
    card.setAttribute('data-id', exp.id);

    const formattedAmount = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD' // default currency for formatting
    }).format(exp.amount);

    const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    // Handle timezone offsets for display by creating date in UTC/local correctly
    const [year, month, day] = exp.date.split('-');
    const localDate = new Date(year, month - 1, day);
    const formattedDate = localDate.toLocaleDateString(undefined, dateOptions);

    const iconSvg = CATEGORY_ICONS[exp.category] || CATEGORY_ICONS.Other;

    card.innerHTML = `
      <div class="card-left">
        <div class="category-icon-wrapper" aria-hidden="true">
          ${iconSvg}
        </div>
        <div class="expense-info-text">
          <span class="expense-title-display" title="${escapeHTML(exp.title)}">${escapeHTML(exp.title)}</span>
          <div class="expense-meta-row">
            <span class="date-badge">
              <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${formattedDate}
            </span>
            <span class="category-badge">${exp.category}</span>
          </div>
          ${exp.note ? `<p class="expense-note-display">${escapeHTML(exp.note)}</p>` : ''}
        </div>
      </div>
      <div class="card-right">
        <span class="expense-amount-display">${formattedAmount}</span>
        <div class="expense-actions-row">
          <button class="btn-action btn-edit" title="Edit transaction" aria-label="Edit transaction ${escapeHTML(exp.title)}" onclick="openEditModal('${exp.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-action btn-delete" title="Delete transaction" aria-label="Delete transaction ${escapeHTML(exp.title)}" onclick="deleteExpense('${exp.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Render Summary Panel
function renderSummary() {
  const totalDisplay = document.getElementById('total-spent-display');
  const progressText = document.getElementById('budget-progress-text');
  const progressFill = document.getElementById('budget-progress-fill');
  const breakdownList = document.getElementById('category-breakdown-list');

  // Format Total spent
  const totalAmount = state.summary.totalSpent;
  const formattedTotal = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD'
  }).format(totalAmount);
  totalDisplay.textContent = formattedTotal;

  // Budget Progress
  const percent = Math.min(Math.round((totalAmount / state.budgetLimit) * 100), 100);
  const formattedLimit = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(state.budgetLimit);
  progressText.textContent = `${formattedTotal} / ${formattedLimit}`;
  
  progressFill.style.width = `${percent}%`;
  if (totalAmount > state.budgetLimit) {
    progressFill.classList.add('limit-exceeded');
  } else {
    progressFill.classList.remove('limit-exceeded');
  }

  // Category Breakdown Progress Bars
  breakdownList.innerHTML = '';
  
  // Define custom sort order for categories
  const categories = Object.keys(state.summary.breakdown);
  
  // Sort breakdown categories by spent amount descending
  categories.sort((a, b) => state.summary.breakdown[b] - state.summary.breakdown[a]);

  categories.forEach(cat => {
    const spent = state.summary.breakdown[cat];
    const catPercent = totalAmount > 0 ? Math.round((spent / totalAmount) * 100) : 0;
    
    const formattedSpent = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD'
    }).format(spent);

    const item = document.createElement('div');
    item.className = `category-breakdown-item cat-${cat}`;
    item.innerHTML = `
      <div class="category-info">
        <span class="category-name-badge">
          <span class="category-dot" aria-hidden="true"></span>
          <span>${cat}</span>
        </span>
        <span class="category-value">${formattedSpent} <span class="text-muted" style="font-size:0.75rem; font-weight:500;">(${catPercent}%)</span></span>
      </div>
      <div class="category-percent-track">
        <div class="category-percent-bar" style="width: ${catPercent}%" aria-valuenow="${catPercent}" aria-valuemin="0" aria-valuemax="100" role="progressbar"></div>
      </div>
    `;
    breakdownList.appendChild(item);
  });
}

// Handle Add Expense Form Submit
async function handleAddExpenseSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const titleInput = document.getElementById('expense-title');
  const amountInput = document.getElementById('expense-amount');
  const categoryInput = document.getElementById('expense-category');
  const dateInput = document.getElementById('expense-date');
  const noteInput = document.getElementById('expense-note');

  // Form Validation
  let isValid = true;
  
  if (!titleInput.value.trim()) {
    setError('title', 'Please provide an expense title.');
    isValid = false;
  }
  
  const amountValue = parseFloat(amountInput.value);
  if (isNaN(amountValue) || amountValue <= 0) {
    setError('amount', 'Please enter a positive amount.');
    isValid = false;
  }
  
  if (!categoryInput.value) {
    setError('category', 'Please select a category.');
    isValid = false;
  }
  
  if (!dateInput.value) {
    setError('date', 'Please choose a valid transaction date.');
    isValid = false;
  }

  if (!isValid) return;

  const expenseData = {
    title: titleInput.value.trim(),
    amount: amountValue,
    category: categoryInput.value,
    date: dateInput.value,
    note: noteInput.value.trim()
  };

  try {
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.details ? errData.details.join(' ') : 'Failed to record expense.');
    }

    showToast('Expense added successfully!', 'success');
    
    // Reset Form (keep date as today)
    form.reset();
    dateInput.value = getTodayDateString();

    // Reload lists and stats
    await fetchExpenses();
    
    // Check if new expense is in the current viewing month of the summary card
    const expenseMonth = expenseData.date.substring(0, 7);
    if (expenseMonth === state.currentMonth) {
      await fetchSummary();
    } else {
      // Prompt user/update if it was added to another month
      state.currentMonth = expenseMonth;
      document.getElementById('summary-month-picker').value = expenseMonth;
      await fetchSummary();
    }

  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Handle Edit Expense Form Submit
async function handleEditExpenseSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('edit-expense-id').value;
  const titleInput = document.getElementById('edit-expense-title');
  const amountInput = document.getElementById('edit-expense-amount');
  const categoryInput = document.getElementById('edit-expense-category');
  const dateInput = document.getElementById('edit-expense-date');
  const noteInput = document.getElementById('edit-expense-note');

  let isValid = true;
  
  if (!titleInput.value.trim()) {
    setEditError('title', 'Please provide an expense title.');
    isValid = false;
  }
  
  const amountValue = parseFloat(amountInput.value);
  if (isNaN(amountValue) || amountValue <= 0) {
    setEditError('amount', 'Please enter a positive amount.');
    isValid = false;
  }
  
  if (!categoryInput.value) {
    setEditError('category', 'Please select a category.');
    isValid = false;
  }
  
  if (!dateInput.value) {
    setEditError('date', 'Please choose a valid transaction date.');
    isValid = false;
  }

  if (!isValid) return;

  const expenseData = {
    title: titleInput.value.trim(),
    amount: amountValue,
    category: categoryInput.value,
    date: dateInput.value,
    note: noteInput.value.trim()
  };

  try {
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.details ? errData.details.join(' ') : 'Failed to update transaction.');
    }

    showToast('Transaction updated successfully!', 'success');
    closeEditModal();

    // Reload UI
    await fetchExpenses();
    await fetchSummary();

  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Delete an Expense
async function deleteExpense(id) {
  const expense = state.expenses.find(e => e.id === id);
  const title = expense ? expense.title : 'this transaction';
  
  if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete transaction.');

    showToast('Transaction deleted successfully.', 'success');
    
    // Reload UI
    await fetchExpenses();
    await fetchSummary();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Modal open/close controls
async function openEditModal(id) {
  try {
    const response = await fetch(`/api/expenses/${id}`);
    if (!response.ok) throw new Error('Could not fetch transaction details.');

    const exp = await response.json();

    document.getElementById('edit-expense-id').value = exp.id;
    document.getElementById('edit-expense-title').value = exp.title;
    document.getElementById('edit-expense-amount').value = exp.amount;
    document.getElementById('edit-expense-category').value = exp.category;
    document.getElementById('edit-expense-date').value = exp.date;
    document.getElementById('edit-expense-note').value = exp.note || '';

    // Clear old errors
    const errElements = document.querySelectorAll('#edit-expense-form .field-error-message');
    errElements.forEach(el => el.textContent = '');
    const inputElements = document.querySelectorAll('#edit-expense-form .form-control');
    inputElements.forEach(el => el.classList.remove('invalid'));

    // Open Modal
    document.getElementById('edit-expense-modal').classList.add('open');
    document.body.style.overflow = 'hidden'; // prevent page scroll background
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function closeEditModal() {
  document.getElementById('edit-expense-modal').classList.remove('open');
  document.body.style.overflow = '';
}

// Filters actions
function clearFilters() {
  document.getElementById('filter-title-input').value = '';
  document.getElementById('filter-category-select').value = '';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value = '';

  state.filters = {
    title: '',
    category: '',
    startDate: '',
    endDate: ''
  };

  // Remove active preset styling
  document.querySelectorAll('.quick-filters-row .btn-chip').forEach(btn => btn.classList.remove('active'));

  fetchExpenses();
  showToast('Filters cleared', 'info');
}

// Preset Filters handler
function setPresetFilter(presetType) {
  const titleInput = document.getElementById('filter-title-input');
  const catSelect = document.getElementById('filter-category-select');
  const dateFromInput = document.getElementById('filter-date-from');
  const dateToInput = document.getElementById('filter-date-to');

  // Toggle active preset button highlight
  document.querySelectorAll('.quick-filters-row .btn-chip').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`quick-preset-${presetType}`).classList.add('active');

  const today = new Date();
  let start = '';
  let end = '';

  switch (presetType) {
    case 'this-month': {
      const year = today.getFullYear();
      const month = today.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      start = formatDate(firstDay);
      end = formatDate(lastDay);
      break;
    }
    case 'last-30': {
      const past30 = new Date();
      past30.setDate(today.getDate() - 30);
      start = formatDate(past30);
      end = formatDate(today);
      break;
    }
    case 'this-year': {
      const year = today.getFullYear();
      start = `${year}-01-01`;
      end = `${year}-12-31`;
      break;
    }
  }

  // Set Inputs
  dateFromInput.value = start;
  dateToInput.value = end;

  // Update State
  state.filters.startDate = start;
  state.filters.endDate = end;

  fetchExpenses();
  showToast(`Applied preset: ${presetType.replace('-', ' ')}`, 'info');
}

// Validation Error helpers
function setError(field, message) {
  const input = document.getElementById(`expense-${field}`);
  const errorDisplay = document.getElementById(`error-${field}`);
  if (input) input.classList.add('invalid');
  if (errorDisplay) errorDisplay.textContent = message;
}

function setEditError(field, message) {
  const input = document.getElementById(`edit-expense-${field}`);
  const errorDisplay = document.getElementById(`edit-error-${field}`);
  if (input) input.classList.add('invalid');
  if (errorDisplay) errorDisplay.textContent = message;
}

// Utility: Format Date object to YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Utility: Escape HTML to avoid XSS injections
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Custom Toast notification popup
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else {
    // Info
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Automatic clean up after anim completes (3s total)
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
