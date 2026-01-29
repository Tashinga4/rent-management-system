const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
  res.json({ success: true, message: 'Auth not implemented yet' });
});

router.post('/register', async (req, res) => {
  res.json({ success: true, message: 'Auth not implemented yet' });
});

module.exports = router;
