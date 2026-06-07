require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Expense Tracker API running' }));

async function start() {
  await connectDB();

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/expenses', require('./routes/expenses'));
  app.use('/api/ai', require('./routes/ai'));

  app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch(err => { console.error('Startup error:', err); process.exit(1); });
