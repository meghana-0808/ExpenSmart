# Personal Expense Tracker (ExpenSmart)

ExpenSmart is a personal expense tracker dashboard built as a lightweight, performant, and visual web application. It runs completely locally with zero cloud dependencies.

## Project Structure

```text
pet/
├── data/
│   └── expenses.json       # Local JSON datastore
├── public/
│   ├── app.js              # Frontend application logic
│   ├── index.html          # Main UI layout
│   └── style.css           # Styling and responsive layout
├── package.json            # Dependencies and scripts
├── README.md               # Setup instructions and project notes
└── server.js               # Express server and API routes
```
## Features Built

1. **Add Expense Form**:
   - Short text title (e.g., "Coffee at Starbucks").
   - Numeric amount (USD / local currency).
   - Category selector: *Food, Transport, Shopping, Bills, Entertainment, Other*.
   - Date picker (defaults to today's local date).
   - Optional, longer note textarea.
   - Robust inline validation (checking for empty titles, non-positive amounts, invalid dates, and invalid categories).

2. **Visual Dashboard Summary**:
   - Live metrics representing the **total spent in the current month** (updates automatically on adding/modifying transactions).
   - Visual progress bar relative to a monthly budget limit (configured at `$2,000`), with color-coded warnings (turns red when limit is exceeded).
   - Category breakdown list sorted by spent amount descending, complete with category-themed visual progress meters showing percentages.
   - Interactive month selector to view metrics for previous or future months (e.g. "2026-05").

3. **Transaction History List**:
   - Shows all fields: Title, category, date, note (truncated clean snippet, full text on hover), amount.
   - Sorted automatically by date descending (most recent first).
   - Interactive edit modal and delete confirmation prompt.
   - Responsive cards that collapse beautifully on tablet and mobile viewports.
   - Smooth slide-in item animations.

4. **Advanced Multi-Criteria Filtering**:
   - Partial text match on title (reactive search with debouncing).
   - Specific category filters.
   - Date range boundaries (from/to).
   - Quick preset buttons: "This Month", "Last 30 Days", "This Year".
   - "Clear Filters" button to reset UI state easily.

5. **Premium Styling & UI Polish**:
   - Beautiful font choice (`Plus Jakarta Sans`) from Google Fonts.
   - Modern glassmorphism panel backdrops (`backdrop-filter`).
   - Clean dark-mode toggle (persisted locally in `localStorage` and respects system preferences).
   - Dynamic real-time ticking clock in the header.
   - Clean toast alert system to notify users about CRUD actions.
   - Elegant loading state animations and zero-records empty state.

---

## Technical Stack Choices & Tradeoffs

- **Backend**: Node.js + Express.js
  - *Tradeoff*: Express is standard, lightweight, and loads instantly. Serving static files and building JSON APIs takes less than 200 lines of clean code.
- **Frontend**: HTML5, Vanilla CSS3 (HSL custom variables, CSS Grid, Flexbox, Keyframe Animations), and ES6+ JavaScript.
  - *Tradeoff*: Avoids complex frontend build stages (such as React, Vue, Vite, or Webpack). This ensures the application starts immediately with zero compilation delays, runs on any browser, and has a small file footprint.
- **Database**: Local JSON File (`data/expenses.json`)
  - *Tradeoff*: Eliminates database installation requirements (like SQLite binary compilation errors on Windows, or setting up MySQL/PostgreSQL). Safe for single-user desktop runtimes using asynchronous file locks via `fs.promises`. Not suitable for production-scale multi-user concurrent writing, but fits the practical test guidelines.

---

## Getting Started

Follow these instructions to run the application locally on your computer.

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (v16.0.0 or higher recommended).

### Installation & Run

1. Open a terminal in the folder containing this source code.
2. Install the necessary dependencies (Express):
   ```bash
   npm install
   ```
3. Start the local server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## Edge Cases Handled

- **Empty / Invalid Inputs**: The backend returns detailed validation status codes (`400 Bad Request`), and the frontend highlights invalid input borders in red with specific error text warnings.
- **Overlapping / Weird Date Ranges**: The date filter supports ranges where start and end date can be empty. If the start date is after the end date, the API filters correct logic natively and returns an empty list cleanly without throwing an exception.
- **Negative/Zero values**: Amounts are locked to positive values (`> 0`) using HTML attributes (`min="0.01"`, `step="0.01"`) and backend validation rules.
- **XSS Vulnerabilities**: User-generated title and note inputs are fully escaped in JavaScript (`escapeHTML()`) before being rendered into the DOM, avoiding script injections.
- **Persistence**: If the `data/expenses.json` file is deleted or missing, the server automatically initializes it with an empty array upon launch.

---

## Known Rough Edges

- **Currency Lock**: Currently displays USD formatting (`$`). Can be made dynamic for multi-currency configurations.
- **No pagination**: A heavy volume of expenses (e.g. >10,000 records) will render fine due to scrolling bounds but can slow DOM rendering. Virtual scrolling or API-side pagination would be recommended for long-term production.
- **Multi-user**: Single database file means all users share the same expense log. Adding authentication and user-specific database directories would resolve this.
