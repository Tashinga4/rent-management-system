const express = require('express');
const router = express.Router();
const LocalDB = require('../config/localDB');
const db = new LocalDB('payments');

router.get('/', async (req, res) => {
  try {
    const payments = db.find();
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payment = db.create(req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
