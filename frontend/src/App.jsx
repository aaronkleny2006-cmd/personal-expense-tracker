
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:5000/api/expenses';
const BUDGET_API = 'http://localhost:5000/api/budgets';

const categories = [
  'Food', 'Transport', 'Shopping', 'Bills',
  'Education', 'Health', 'Entertainment', 'Other'
];

const categoryIcons = {
  Food: '🍽️',
  Transport: '🚗',
  Shopping: '🛍️',
  Bills: '⚡',
  Education: '📚',
  Health: '💚',
  Entertainment: '🎬',
  Other: '💳'
};

function App() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [budget, setBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetMessage, setBudgetMessage] = useState('');
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('newest');
  const formRef = useRef(null);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(API);
      setExpenses(res.data);
      setError('');
    } catch {
      setError('Unable to load expenses. Check that the backend is running.');
    }
  };
  
const fetchBudget = async () => {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const res = await axios.get(`${BUDGET_API}/${month}`);

    setBudget(res.data?.amount || 0);
    setBudgetInput(res.data?.amount ? String(res.data.amount) : '');
  } catch (error) {
    console.error('Unable to load budget:', error);
  }
};

const saveBudget = async () => {
  const amount = Number(budgetInput);

  if (!budgetInput.trim() || !Number.isFinite(amount) || amount <= 0) {
    setBudgetMessage('Please enter a budget greater than zero.');
    return;
  }

  try {
    const month = new Date().toISOString().slice(0, 7);

    const res = await axios.put(`${BUDGET_API}/${month}`, {
      amount: amount
    });

    setBudget(res.data.amount);
    setBudgetInput(String(res.data.amount));
    setBudgetMessage('Monthly budget saved successfully!');
  } catch (error) {
    setBudgetMessage(
      error.response?.data?.message || 'Unable to save budget. Check your backend.'
    );
  }
};

useEffect(() => {
  fetchExpenses();
  fetchBudget();
}, []);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !title.trim() ||
      !amount ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !date
    ) {
      setError('Enter a title, a positive amount, and a date.');
      return;
    }

    const expense = {
      title: title.trim(),
      amount: Number(amount),
      category,
      date
    };

    try {
      if (editId) {
        await axios.put(`${API}/${editId}`, expense);
      } else {
        await axios.post(API, expense);
      }

      resetForm();
      await fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save expense.');
    }
  };

 const handleEdit = (expense) => {
  setTitle(expense.title);
  setAmount(String(expense.amount));
  setCategory(expense.category);
  setDate(new Date(expense.date).toISOString().split('T')[0]);
  setEditId(expense._id);
  setError('');

  setTimeout(() => {
    formRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, 100);
};

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense permanently?')) return;

    try {
      await axios.delete(`${API}/${id}`);
      if (editId === id) resetForm();
      await fetchExpenses();
    } catch {
      setError('Unable to delete expense.');
    }
  };

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const thisMonth = expenses.filter((expense) => {
    const d = new Date(expense.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
  });

  const monthTotal = thisMonth.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) =>
        expense.title.toLowerCase().includes(search.toLowerCase())
      )
      .filter((expense) =>
        filter === 'All' || expense.category === filter
      )
      .sort((a, b) => {
        if (sort === 'oldest') {
          return new Date(a.date) - new Date(b.date);
        }
        if (sort === 'highest') {
          return Number(b.amount) - Number(a.amount);
        }
        if (sort === 'lowest') {
          return Number(a.amount) - Number(b.amount);
        }
        return new Date(b.date) - new Date(a.date);
      });
  }, [expenses, search, filter, sort]);

  // Analytics: last six months of spending
  const monthlyData = useMemo(() => {
    const now = new Date();

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - 5 + i,
        1
      );

      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleDateString('en-IN', {
          month: 'short'
        }),
        total: 0
      };
    });

    expenses.forEach((expense) => {
      const d = new Date(expense.date);
      const month = months.find(
        (m) =>
          m.year === d.getFullYear() &&
          m.month === d.getMonth()
      );

      if (month) {
        month.total += Number(expense.amount) || 0;
      }
    });

    return months;
  }, [expenses]);

  // Analytics: spending grouped by category
  const categoryData = useMemo(() => {
    const totals = {};

    expenses.forEach((expense) => {
      const name = expense.category || 'Other';
      totals[name] =
        (totals[name] || 0) + Number(expense.amount || 0);
    });

    return Object.entries(totals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const topCategory = categoryData[0] || null;

  const maxMonthlySpend = Math.max(
    ...monthlyData.map((m) => m.total),
    1
  );

  const currentMonthSpend =
    monthlyData[monthlyData.length - 1]?.total || 0;

  const previousMonthSpend =
    monthlyData[monthlyData.length - 2]?.total || 0;

  const monthlyChange = previousMonthSpend === 0
    ? null
    : ((currentMonthSpend - previousMonthSpend) /
        previousMonthSpend) * 100;

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Spendwise home">
          <span className="brand-mark">₹</span>
          <span>spend<span className="brand-light">wise</span></span>
        </a>
        <span className="topbar-tag">
          <span className="live-dot"></span>
          PERSONAL FINANCE
        </span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">YOUR MONEY, YOUR CONTROL</p>
          <h1>Make every rupee<br /> <span>count.</span></h1>
          <p className="hero-subtitle">
            A clearer view of your spending starts here.
          </p>
          <div className="hero-date">
            <span>◷</span>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one"></div>
          <div className="art-orbit orbit-two"></div>
          <div className="art-coin">₹</div>
          <div className="art-caption">
            <span>SMALL STEPS.</span>
            <strong>SMARTER SPENDING.</strong>
          </div>
        </div>
      </section>

      {error && <div className="error">{error}</div>}

      <section className="stats-grid">
        <article className="stat-card stat-main">
          <div className="stat-top">
            <span>Total recorded spending</span>
            <span className="stat-icon">↗</span>
          </div>
          <h2>₹{total.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</h2>
          <p>Across all recorded expenses</p>
          <div className="stat-decoration"></div>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span>This month's spending</span>
            <span className="stat-icon mint-icon">◷</span>
          </div>
          <h2>₹{monthTotal.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</h2>
          <p>Expenses dated this month</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span>Transactions</span>
            <span className="stat-icon lilac-icon">▤</span>
          </div>
          <h2>{expenses.length}</h2>
          <p>Total entries recorded</p>
        </article>
      </section>

      <section className="analytics-section">
        <div className="analytics-heading">
          <div>
            <p className="section-kicker">UNDERSTAND YOUR MONEY</p>
            <h2>Spending analytics</h2>
            <p className="analytics-subtitle">
              Your financial activity, at a glance.
            </p>
          </div>
          <span className="analytics-period">Last 6 months</span>
        </div>

        <div className="analytics-grid">
          <article className="analytics-card monthly-chart-card">
            <div className="analytics-card-heading">
              <div>
                <h3>Monthly spending</h3>
                <p>Track your spending over time</p>
              </div>
              <span className="analytics-icon">↗</span>
            </div>

            <div className="chart-total">
              <strong>
                ₹{currentMonthSpend.toLocaleString('en-IN', {
                  maximumFractionDigits: 2
                })}
              </strong>
              <span>This month</span>
            </div>

            <div className="bar-chart">
              {monthlyData.map((month) => (
                <div className="bar-column" key={`${month.year}-${month.month}`}>
                  <span className="bar-value">
                    {month.total > 0
                      ? month.total >= 1000
                        ? `₹${(month.total / 1000).toFixed(1)}k`
                        : `₹${Math.round(month.total)}`
                      : ''}
                  </span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${
                        month.month === new Date().getMonth() &&
                        month.year === new Date().getFullYear()
                          ? 'bar-current'
                          : ''
                      }`}
                      style={{
                        height: `${Math.max(
                          month.total > 0 ? 5 : 0,
                          (month.total / maxMonthlySpend) * 100
                        )}%`
                      }}
                      title={`${month.label}: ₹${month.total.toFixed(2)}`}
                    />
                  </div>
                  <span className="bar-label">{month.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="analytics-card category-chart-card">
            <div className="analytics-card-heading">
              <div>
                <h3>Spending by category</h3>
                <p>Where your money goes</p>
              </div>
              <span className="analytics-icon">◉</span>
            </div>

            {categoryData.length === 0 ? (
              <div className="analytics-empty">
                <span>◉</span>
                <p>Add expenses to see your breakdown.</p>
              </div>
            ) : (
              <>
                <div className="category-summary">
                  <div>
                    <span>Top category</span>
                    <strong>
                      {categoryIcons[topCategory.name] || '💳'}{' '}
                      {topCategory.name}
                    </strong>
                  </div>
                  <strong>
                    ₹{topCategory.total.toLocaleString('en-IN', {
                      maximumFractionDigits: 2
                    })}
                  </strong>
                </div>

                <div className="category-bars">
                  {categoryData.map((item, index) => (
                    <div className="category-bar-item" key={item.name}>
                      <div className="category-bar-label">
                        <span>
                          {categoryIcons[item.name] || '💳'} {item.name}
                        </span>
                        <strong>
                          {total > 0
                            ? ((item.total / total) * 100).toFixed(0)
                            : 0}%
                        </strong>
                      </div>
                      <div className="category-track">
                        <div
                          className={`category-fill category-fill-${index % 5}`}
                          style={{
                            width: `${total > 0
                              ? (item.total / total) * 100
                              : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </article>

          <article className="analytics-card comparison-card">
            <div className="analytics-card-heading">
              <div>
                <h3>Month comparison</h3>
                <p>Compared with last month</p>
              </div>
              <span className="analytics-icon">⇄</span>
            </div>

            <div className="comparison-values">
              <div>
                <span>Previous month</span>
                <strong>
                  ₹{previousMonthSpend.toLocaleString('en-IN', {
                    maximumFractionDigits: 2
                  })}
                </strong>
              </div>
              <div>
                <span>This month</span>
                <strong>
                  ₹{currentMonthSpend.toLocaleString('en-IN', {
                    maximumFractionDigits: 2
                  })}
                </strong>
              </div>
            </div>

            <div className="comparison-message">
              {monthlyChange === null ? (
                <span>
                  Add spending in both months for a percentage comparison.
                </span>
              ) : monthlyChange > 0 ? (
                <span className="change-up">
                  ↑ {monthlyChange.toFixed(1)}% more than last month
                </span>
              ) : monthlyChange < 0 ? (
                <span className="change-down">
                  ↓ {Math.abs(monthlyChange).toFixed(1)}% less than last month
                </span>
              ) : (
                <span>Spending is unchanged from last month.</span>
              )}
            </div>
          </article>
        </div>
      </section>
    
<section className="budget-section">
  <div className="budget-header">
    <div>
      <p className="section-eyebrow">MONTHLY PLANNING</p>
      <h2>My Monthly Budget</h2>
      <p>Set a spending limit and keep track of your money.</p>
    </div>
    <span className="budget-icon">₹</span>
  </div>

  <form
    className="budget-form"
    onSubmit={(e) => {
      e.preventDefault();
      saveBudget();
    }}
  >
    <label htmlFor="monthly-budget">Monthly budget (₹)</label>
    <div className="budget-input-row">
      <input
        id="monthly-budget"
        type="number"
        min="0.01"
        step="0.01"
        placeholder="Enter your monthly budget"
        value={budgetInput}
        onChange={(e) => setBudgetInput(e.target.value)}
      />
      <button type="submit">Save Budget</button>
    </div>
    {budgetMessage && (
      <p className="budget-message" role="status">
        {budgetMessage}
      </p>
    )}
  </form>

  <div className="budget-summary">
    <div>
      <span>Monthly limit</span>
      <strong>₹{budget.toLocaleString('en-IN')}</strong>
    </div>
    <div>
      <span>Spent this month</span>
      <strong>₹{monthTotal.toLocaleString('en-IN')}</strong>
    </div>
    <div>
      <span>Remaining</span>
      <strong>
        ₹{(budget - monthTotal).toLocaleString('en-IN')}
      </strong>
    </div>
  </div>

  <div
    className="budget-progress-track"
    role="progressbar"
    aria-label="Monthly budget used"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={
      budget > 0
        ? Math.min(100, Math.round((monthTotal / budget) * 100))
        : 0
    }
  >
    <div
      className={`budget-progress-fill ${
        budget > 0 && monthTotal > budget ? 'over-budget' : ''
      }`}
      style={{
        width: `${
          budget > 0
            ? Math.min(100, (monthTotal / budget) * 100)
            : 0
        }%`
      }}
    />
  </div>

  <p className="budget-status">
    {budget <= 0
      ? 'Set a budget to start tracking your monthly spending.'
      : monthTotal > budget
      ? `You are ₹${(monthTotal - budget).toLocaleString('en-IN')} over budget.`
      : `You've used ${Math.round((monthTotal / budget) * 100)}% of your monthly budget.`}
  </p>
</section>

      <main className="dashboard">
        <section className="panel form-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">KEEP TRACK</p>
              <h2>{editId ? 'Edit expense' : 'Add an expense'}</h2>
            </div>
            <span className="heading-icon">＋</span>
          </div>

          <p className="section-description">
            Record where your money goes.
          </p>

          <form ref={formRef} onSubmit={handleSubmit}>
            <label htmlFor="expense-title">Expense name</label>
            <input
              id="expense-title"
              type="text"
              placeholder="e.g. Weekend lunch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />

            <label htmlFor="expense-amount">Amount</label>
            <div className="amount-input">
              <span>₹</span>
              <input
                id="expense-amount"
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <label htmlFor="expense-category">Category</label>
            <select
              id="expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {categoryIcons[item]} {item}
                </option>
              ))}
            </select>

            <label htmlFor="expense-date">Date</label>
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <button className="primary" type="submit">
              {editId ? '✓  Save changes' : '+  Add expense'}
            </button>

            {editId && (
              <button
                className="secondary"
                type="button"
                onClick={resetForm}
              >
                Cancel editing
              </button>
            )}
          </form>

          <div className="form-note">
            <span>✦</span>
            Every little expense tells a story.
          </div>
        </section>

        <section className="panel transactions-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">YOUR ACTIVITY</p>
              <h2>Transactions</h2>
            </div>
            <span className="count-badge">{expenses.length} total</span>
          </div>

          <div className="transaction-tools">
            <div className="search-box">
              <span>⌕</span>
              <input
                aria-label="Search expenses"
                type="search"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-row">
              <select
                aria-label="Filter by category"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="All">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <select
                aria-label="Sort expenses"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </select>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-illustration">
                <span>₹</span>
                <i>＋</i>
              </div>
              <h3>
                {expenses.length === 0
                  ? 'Your story starts here'
                  : 'No matching expenses'}
              </h3>
              <p>
                {expenses.length === 0
                  ? 'Add your first expense and start understanding your spending.'
                  : 'Try a different search or category filter.'}
              </p>
            </div>
          ) : (
            <div className="transaction-list">
              {filteredExpenses.map((expense) => (
                <article className="transaction" key={expense._id}>
                  <div className={`category-icon category-${expense.category.toLowerCase()}`}>
                    {categoryIcons[expense.category] || '💳'}
                  </div>

                  <div className="transaction-info">
                    <h3>{expense.title}</h3>
                    <p>
                      <span className="category-label">{expense.category}</span>
                      <span className="transaction-dot">·</span>
                      {new Date(expense.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'UTC'
                      })}
                    </p>
                  </div>

                  <div className="transaction-end">
                    <strong>−₹{Number(expense.amount).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}</strong>
                    <div className="transaction-actions">
                      <button
                        className="action-edit"
                        type="button"
                        onClick={() => handleEdit(expense)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-delete"
                        type="button"
                        onClick={() => handleDelete(expense._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="list-footer">
            <span>Showing {filteredExpenses.length} of {expenses.length} expenses</span>
            <span className="footer-dot"></span>
            <span>Synced with your database</span>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span className="footer-brand">spendwise.</span>
        <span>Spend thoughtfully. Live freely.</span>
      </footer>
    </div>
  );
}

export default App;
