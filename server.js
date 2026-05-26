const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'expenses.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Categories configuration
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Other'];

// Helper: Read expenses from file
async function readExpenses() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Create empty file if it doesn't exist
      await fs.writeFile(DATA_FILE, JSON.stringify([]));
      return [];
    }
    console.error('Error reading database file:', error);
    return [];
  }
}

// Helper: Write expenses to file
async function writeExpenses(expenses) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(expenses, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing database file:', error);
    throw new Error('Failed to save data.');
  }
}

// Helper: Get today's date in YYYY-MM-DD
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Validation function
function validateExpense(expense) {
  const errors = [];

  // Title validation
  if (!expense.title || typeof expense.title !== 'string' || expense.title.trim() === '') {
    errors.push('Title is required and must be a short text.');
  } else if (expense.title.length > 100) {
    errors.push('Title must be 100 characters or less.');
  }

  // Amount validation
  const amount = Number(expense.amount);
  if (expense.amount === undefined || expense.amount === null || isNaN(amount) || amount <= 0) {
    errors.push('Amount is required and must be a positive number.');
  }

  // Category validation
  if (!expense.category || !CATEGORIES.includes(expense.category)) {
    errors.push(`Category must be one of: ${CATEGORIES.join(', ')}.`);
  }

  // Date validation
  if (expense.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expense.date) || isNaN(Date.parse(expense.date))) {
      errors.push('Date must be in valid YYYY-MM-DD format.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      title: expense.title ? expense.title.trim() : '',
      amount: Number(expense.amount),
      category: expense.category,
      date: expense.date ? expense.date : getTodayDateString(),
      note: expense.note ? expense.note.trim() : ''
    }
  };
}

// --- API ROUTES ---

// GET: All expenses with optional filters, sorted by date (most recent first)
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await readExpenses();
    const { category, title, startDate, endDate } = req.query;

    let filtered = [...expenses];

    // Apply category filter
    if (category) {
      filtered = filtered.filter(e => e.category === category);
    }

    // Apply title filter (partial text match, case insensitive)
    if (title) {
      const searchStr = title.toLowerCase();
      filtered = filtered.filter(e => e.title.toLowerCase().includes(searchStr));
    }

    // Apply date range filter (from/to)
    if (startDate) {
      filtered = filtered.filter(e => e.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => e.date <= endDate);
    }

    // Sort by date descending (most recent first)
    filtered.sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date);
      if (dateCompare !== 0) return dateCompare;
      // Secondary sort: alphabetical or ID to keep consistent
      return b.id.localeCompare(a.id);
    });

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Single expense details
app.get('/api/expenses/:id', async (req, res) => {
  try {
    const expenses = await readExpenses();
    const expense = expenses.find(e => e.id === req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST: Add new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { isValid, errors, sanitized } = validateExpense(req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const expenses = await readExpenses();
    const newExpense = {
      id: crypto.randomUUID(),
      ...sanitized
    };

    expenses.push(newExpense);
    await writeExpenses(expenses);

    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// PUT: Edit existing expense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const expenses = await readExpenses();
    const index = expenses.findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const { isValid, errors, sanitized } = validateExpense(req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const updatedExpense = {
      id: req.params.id,
      ...sanitized
    };

    expenses[index] = updatedExpense;
    await writeExpenses(expenses);

    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE: Delete an expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const expenses = await readExpenses();
    const initialLength = expenses.length;
    const filtered = expenses.filter(e => e.id !== req.params.id);

    if (filtered.length === initialLength) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await writeExpenses(filtered);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// GET: Summary for a given month (defaults to current month)
// Format expected: YYYY-MM
app.get('/api/summary', async (req, res) => {
  try {
    const expenses = await readExpenses();
    
    // Determine the month to query (default to current local time YYYY-MM)
    let queryMonth = req.query.month;
    if (!queryMonth) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      queryMonth = `${year}-${month}`;
    }

    // Filter expenses matching this YYYY-MM
    const monthlyExpenses = expenses.filter(e => e.date.startsWith(queryMonth));
    
    // Calculate total spent
    const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Initialize category breakdown
    const breakdown = {};
    CATEGORIES.forEach(cat => {
      breakdown[cat] = 0;
    });

    monthlyExpenses.forEach(e => {
      if (breakdown[e.category] !== undefined) {
        breakdown[e.category] += e.amount;
      } else {
        breakdown[e.category] = e.amount;
      }
    });

    res.json({
      month: queryMonth,
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      breakdown
    });
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ error: 'Failed to generate monthly summary' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
