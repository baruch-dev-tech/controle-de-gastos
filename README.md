Expense Tracker

A web app for logging personal income and expenses, tracking your monthly balance, and seeing where your money goes. Built with vanilla HTML, CSS, and JavaScript: no framework, no backend. Data is stored in your browser.

<<img width="1352" height="640" alt="image" src="https://github.com/user-attachments/assets/da99d4e0-084e-4c75-8ad6-3031c5cf3c5c" />-->



 Features

- Add income and expenses with a description, amount, category, and date
- Edit and delete transactions
- Filter by month
- Monthly summary: balance, total income, and total expenses
- Spending by category, shown as a doughnut chart (Chart.js) alongside percentage bars
- Automatic persistence in the browser (`localStorage`): your data is still there after you close and reopen the page
- Responsive layout that adapts to small screens

 Tech Stack

- HTML5
- CSS3 (Grid, Flexbox, and custom properties)
- JavaScript (ES6+), no build step
- [Chart.js 4](https://www.chartjs.org/), loaded from a CDN and used only for the chart

Getting Started

There is nothing to install.

```bash
git clone https://github.com/YOUR-USERNAME/expense-tracker.git
cd expense-tracker
```

Open `index.html` in your browser (double-click it or drag it into a browser window).

If you prefer a local server:

```bash
npx serve .
# or
python3 -m http.server 8000


Note: the chart loads Chart.js from a CDN, so it needs an internet connection. Offline, the app still works and shows only the percentage bars.

## Project Structure

```
.
├── index.html   page markup
├── style.css    styles and responsive layout
└── script.js    state, persistence, and rendering
```

How It Works

State and rendering. Transactions live in an array (`transacoes`). Every change (adding, editing, deleting, or switching months) updates the array, saves it, and calls `render()`, which redraws the summary, chart, and list from that state. The UI is always a function of the data.

Data model. Each transaction is an object:

js

  id: 1760000000000,        // Date.now() at creation time
  descricao: "Groceries",   // description
  valor: 150.5,             // amount
  tipo: "despesa",          // "despesa" (expense) | "receita" (income)
  categoria: "Alimentação", // category; income entries use "Receita"
  data: "2026-10-16"        // ISO format (YYYY-MM-DD)
}
```

Persistence. The array is serialized with `JSON.stringify` and stored in `localStorage` under the key `gastos:transacoes`. Reads are wrapped in `try/catch`, so corrupted data or unavailable storage won't crash the app.

Technical decisions

- List items are built with `createElement` and `textContent` rather than `innerHTML`, so user input is never interpreted as HTML (this prevents XSS).
- Dates are handled as `YYYY-MM-DD` strings and never pass through `Date`, which avoids the off-by-one-day bug caused by time zones.
- Currency is formatted with `toLocaleString("pt-BR", { style: "currency", currency: "BRL" })`.

 Known Limitations

- Data exists only in the browser and on the device where it was created. Clearing site data erases everything, and there is no sync across devices.
- Amounts are stored as floating-point numbers, so summing cents can occasionally produce tiny rounding differences. Real financial systems store amounts as integer cents.
- The chart requires an internet connection (CDN).
- There are no automated tests.

 Roadmap

- [ ] Store amounts as integer cents
- [ ] Export and import transactions as CSV (which doubles as a backup)
- [ ] Serve Chart.js locally so the chart works offline
- [ ] Automated tests for the calculation functions
- [ ] Backend with an API and database for authentication and cross-device sync

 Author

Built by Davi. < baruch-dev-tech -->

License

Distributed under the MIT License. <!-- add a LICENSE file to the repository, or remove this section -->
