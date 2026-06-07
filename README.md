# Expense Tracker Application

A full-stack Expense Tracker with AI-powered finance assistant built with React.js, Node.js, and Google Gemini AI.

## Features

- **User Authentication** — Register/Login with JWT
- **Add / Edit / Delete Expenses** — Full CRUD with validation
- **View Expense History** — Sortable, paginated table
- **Search Expenses** — Live debounced search
- **Filter by Category** — Food, Transport, Shopping, Health, etc.
- **Dashboard** — Total expenses, monthly spend, charts (Bar + Doughnut)
- **AI Finance Assistant** — Chat with Gemini AI with full conversation context and your live expense data
- **Dark Mode** — Toggle between light and dark themes
- **Responsive UI** — Mobile-first design

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Chart.js |
| Backend | Node.js, Express, sql.js (SQLite) |
| Auth | JWT + bcryptjs |
| AI Chat | Google Gemini 1.5 Flash |
| Icons | Lucide React |

## Setup Instructions

### Prerequisites
- Node.js v18+
- A Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Configure Gemini API Key

Edit `backend/.env` and replace the placeholder:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Quick Start (both servers)
```bash
chmod +x start.sh
./start.sh
```

### 3. Manual Start

**Backend:**
```bash
cd backend
npm install
npm start
# Runs on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 4. Open in browser
Visit: **http://localhost:5173**

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/expenses | List expenses (search, filter, sort) |
| POST | /api/expenses | Create expense |
| PUT | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |
| GET | /api/expenses/stats | Dashboard stats |
| POST | /api/ai/chat | AI chat with Gemini |

## Environment Variables

`backend/.env`:
```
PORT=5000
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```
