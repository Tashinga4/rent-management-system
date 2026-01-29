const express = require('express');
const router = express.Router();
const Suite = require('../models/Suite');

// Get all suites
router.get('/', async (req, res) => {
  try {
    const suites = await Suite.find().populate('propertyId').populate('currentTenant');
    res.json({ success: true, data: suites });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single suite
router.get('/:id', async (req, res) => {
  try {
    const suite = await Suite.findById(req.params.id).populate('propertyId').populate('currentTenant');
    if (!suite) {
      return res.status(404).json({ success: false, error: 'Suite not found' });
    }
    res.json({ success: true, data: suite });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create suite
router.post('/', async (req, res) => {
  try {
    const suite = new Suite(req.body);
    await suite.save();
    res.status(201).json({ success: true, data: suite });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update suite
router.put('/:id', async (req, res) => {
  try {
    const suite = await Suite.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!suite) {
      return res.status(404).json({ success: false, error: 'Suite not found' });
    }
    res.json({ success: true, data: suite });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete suite
router.delete('/:id', async (req, res) => {
  try {
    const suite = await Suite.findByIdAndDelete(req.params.id);
    if (!suite) {
      return res.status(404).json({ success: false, error: 'Suite not found' });
    }
    res.json({ success: true, message: 'Suite deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
