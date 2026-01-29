const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get profile
router.get('/', async (req, res) => {
  try {
    res.json({ success: true, message: 'Profile endpoint' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update profile
router.put('/', async (req, res) => {
  try {
    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
