const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const { CATEGORIES } = require('../models/Expense');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const { search, category, start_date, end_date, sort = 'date', order = 'desc' } = req.query;
  const filter = { userId: req.user.id };

  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
  ];
  if (category && CATEGORIES.includes(category)) filter.category = category;
  if (start_date || end_date) {
    filter.date = {};
    if (start_date) filter.date.$gte = start_date;
    if (end_date) filter.date.$lte = end_date;
  }

  const allowedSort = ['date', 'amount', 'title', 'createdAt'];
  const sortField = allowedSort.includes(sort) ? sort : 'date';
  const sortDir = order === 'asc' ? 1 : -1;

  try {
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ [sortField]: sortDir }).lean(),
      Expense.countDocuments(filter),
    ]);
    res.json({ success: true, expenses, total });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/stats', async (req, res) => {
  const userId = req.user.id;
  try {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [totalAgg, monthlyAgg, byCategory, last6Months, recent] = await Promise.all([
      Expense.aggregate([{ $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId) } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Expense.aggregate([{ $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId), date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId) } }, { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { total: -1 } }, { $project: { category: '$_id', total: 1, count: 1, _id: 0 } }]),
      Expense.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId), date: { $gte: getDateNMonthsAgo(6) } } },
        { $group: { _id: { $substr: ['$date', 0, 7] }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
        { $project: { month: '$_id', total: 1, _id: 0 } },
      ]),
      Expense.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(5).lean(),
    ]);

    res.json({
      success: true,
      stats: {
        totalExpenses: totalAgg[0]?.total || 0,
        totalCount: totalAgg[0]?.count || 0,
        monthlyExpenses: monthlyAgg[0]?.total || 0,
        byCategory,
        last6Months,
        recentTransactions: recent,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, expense });
  } catch {
    res.status(404).json({ success: false, message: 'Expense not found' });
  }
});

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('category').isIn(CATEGORIES).withMessage('Invalid category'),
  body('date').isISO8601().withMessage('Valid date required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { title, amount, category, date, description } = req.body;
    const expense = await Expense.create({ userId: req.user.id, title, amount: parseFloat(amount), category, date, description: description || '' });
    res.status(201).json({ success: true, message: 'Expense added', expense });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('category').isIn(CATEGORIES).withMessage('Invalid category'),
  body('date').isISO8601().withMessage('Valid date required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { title, amount, category, date, description } = req.body;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title, amount: parseFloat(amount), category, date, description: description || '' },
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense updated', expense });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

function getDateNMonthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().split('T')[0];
}

module.exports = router;
