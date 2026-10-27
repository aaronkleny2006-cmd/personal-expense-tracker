# Spendwise — Personal Expense Tracker

Spendwise is a full-stack web application that helps users record expenses, monitor spending habits, analyze their financial activity, and manage a monthly budget.

## Features

- **Expense Management:** Add, view, edit, and delete expenses.
- **Category Organization:** Categorize expenses such as Food, Transport, Shopping, Bills, Education, Health, and Entertainment.
- **Search and Filters:** Search transactions, filter by category, and sort expenses.
- **Spending Analytics:** View monthly spending charts, category breakdowns, and month-to-month comparisons.
- **Monthly Budget:** Set a monthly spending limit, view the amount spent and remaining, and track progress with a visual progress bar.
- **Database Persistence:** Store expenses and monthly budgets in MongoDB.
- **Responsive Interface:** A clean dashboard designed for convenient use.

## Technology Stack

### Frontend
- React
- Vite
- Axios
- CSS

### Backend
- Node.js
- Express.js
- Mongoose

### Database
- MongoDB Atlas

## Project Structure

```text
personal-expense-tracker/
├── backend/
│   ├── models/
│   │   ├── Expense.js
│   │   └── Budget.js
│   ├── routes/
│   │   ├── expenseRoutes.js
│   │   └── budgetRoutes.js
│   ├── .env.example
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- A MongoDB database, such as MongoDB Atlas
- Git

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd personal-expense-tracker
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository's actual URL.

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder and configure:

```dotenv
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Replace the placeholder with your own MongoDB connection string.

### 3. Start the backend

From the `backend` folder, run:

```bash
node server.js
```

The backend should run on port 5000.

### 4. Start the frontend

Open a second terminal from the project root and run:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

## Budget Tracking

Users can set a budget for the current month. Spendwise compares the budget with expenses recorded for that month and displays spending progress and the remaining amount.

## Future Improvements

- User authentication and individual accounts
- Export expenses to CSV
- Custom date-range reports
- Budget history and additional financial insights

## Author

Created as a full-stack web development project.

## License

No license has been specified yet.
