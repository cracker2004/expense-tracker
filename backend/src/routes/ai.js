const express = require('express');
const Groq = require('groq-sdk');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_groq_key_here') {
    return res.status(503).json({
      success: false,
      message: '⚠️ Groq API key not set. Open backend/.env and set GROQ_API_KEY=your_actual_key, then restart the server.'
    });
  }

  try {
    const userId = mongoose.Types.ObjectId.createFromHexString(req.user.id);
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [totalAgg, monthlyAgg, byCategory, recent] = await Promise.all([
      Expense.aggregate([{ $match: { userId } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Expense.aggregate([{ $match: { userId, date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { userId } }, { $group: { _id: '$category', total: { $sum: '$amount' } } }, { $sort: { total: -1 } }]),
      Expense.find({ userId }).sort({ date: -1 }).limit(10).select('title amount category date').lean(),
    ]);

    const total = totalAgg[0]?.total || 0;
    const count = totalAgg[0]?.count || 0;
    const monthly = monthlyAgg[0]?.total || 0;

    const expenseContext = `
User's Live Expense Data:
- All-time total: ₹${total.toFixed(2)} across ${count} expenses
- This month (${now.toLocaleString('default', { month: 'long', year: 'numeric' })}): ₹${monthly.toFixed(2)}
- By category: ${byCategory.map(c => `${c._id}: ₹${c.total.toFixed(2)}`).join(', ') || 'No data yet'}
- Recent 10 transactions: ${recent.map(e => `${e.title} (₹${e.amount}, ${e.category}, ${e.date})`).join('; ') || 'None yet'}
`;

    const systemInstruction = `You are a smart, friendly personal finance assistant for an Expense Tracker app.
Help users understand spending habits, give budgeting advice, and answer questions about their expenses.
Use the real live data below for personalized insights. Format amounts in Indian Rupees (₹).

${expenseContext}

Rules:
- Use the data above to give specific, personalized answers
- Give practical, actionable budgeting tips
- Keep responses concise (2-4 sentences max unless more detail is needed)
- Be warm and encouraging, not judgmental about spending
- If no data exists yet, encourage the user to add expenses first`;

    // --- CHAT HISTORY CLEANUP ---
    let formattedHistory = history
      .filter(m => m.role && m.content)
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

    // Groq also requires history to start with 'user'
    const firstUserIndex = formattedHistory.findIndex(msg => msg.role === 'user');
    if (firstUserIndex !== -1) {
      formattedHistory = formattedHistory.slice(firstUserIndex);
    } else {
      formattedHistory = [];
    }

    // --- FALLBACK MODEL ARRAY ---
    const MODELS = [
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
    ];

    const client = new Groq({ apiKey: apiKey.trim() });

    let responseText;
    let lastError = null;

    for (const modelName of MODELS) {
      try {
        console.log(`🤖 Attempting to connect via: ${modelName}`);

        const result = await client.chat.completions.create({
          model: modelName,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemInstruction },
            ...formattedHistory,
            { role: 'user', content: message.trim() }
          ]
        });

        responseText = result.choices[0].message.content;

        if (responseText) {
          console.log(`✅ Success using model: ${modelName}`);
          break;
        }
      } catch (err) {
        lastError = err;
        const errorMsg = err.message?.toLowerCase() || '';

        console.warn(`⚠️ Model ${modelName} failed. Reason: ${err.message}`);

        if (errorMsg.includes('invalid_api_key') || errorMsg.includes('authentication')) {
          throw err;
        }
        continue;
      }
    }

    if (!responseText) {
      throw lastError || new Error('All fallback models failed.');
    }

    res.json({ success: true, message: responseText });
  } catch (err) {
    console.error('Groq AI error:', err.message);
    const errorMsg = err.message?.toLowerCase() || '';

    if (errorMsg.includes('invalid_api_key') || errorMsg.includes('authentication')) {
      return res.status(401).json({ success: false, message: '❌ Invalid Groq API key. Double-check the key in backend/.env and restart the server.' });
    }
    if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('rate limit')) {
      return res.status(429).json({ success: false, message: '⚠️ Groq API rate limit reached. Please wait a moment before sending another message.' });
    }

    res.status(500).json({ success: false, message: 'AI Service Error: ' + err.message });
  }
});

module.exports = router;