
const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

// Get the budget for a month
router.get('/:month', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      month: req.params.month
    });

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save or update the budget
router.put('/:month', async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        message: 'Budget must be greater than zero'
      });
    }

    const budget = await Budget.findOneAndUpdate(
      { month: req.params.month },
      {
        month: req.params.month,
        amount: amount
      },
     {
     returnDocument: 'after',
     upsert: true,
    runValidators: true
    }
    );

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
