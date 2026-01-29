const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// Get all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('tenantId')
      .populate('propertyId')
      .sort({ dueDate: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('tenantId')
      .populate('propertyId');
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new payment
router.post('/', async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update payment
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending payments
router.get('/status/pending', async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'Pending' })
      .populate('tenantId')
      .populate('propertyId');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get overdue payments
router.get('/status/overdue', async (req, res) => {
  try {
    const today = new Date();
    const payments = await Payment.find({ 
      status: 'Overdue',
      dueDate: { $lt: today }
    })
      .populate('tenantId')
      .populate('propertyId');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
