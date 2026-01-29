const express = require('express');
const router = express.Router();
const LocalDB = require('../config/localDB');
const db = new LocalDB('tenants');

router.get('/', async (req, res) => {
  try {
    const tenants = db.find();
    res.json({ success: true, data: tenants });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tenant = db.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const tenant = db.create({
      name: req.body.name,
      email: req.body.email || '',
      phone: req.body.phone || '',
      suiteId: req.body.suiteId || '',
      roomId: req.body.roomId || null,
      propertyId: req.body.propertyId || '',
      moveInDate: req.body.moveInDate,
      rent: req.body.rent || 0,
      paymentStatus: req.body.paymentStatus || 'pending',
      lastPaymentDate: req.body.lastPaymentDate || null,
      balance: req.body.balance || 0,
      leaseEndDate: req.body.leaseEndDate || null,
      emergencyContact: req.body.emergencyContact || '',
      notes: req.body.notes || ''
    });
    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const tenant = db.update(req.params.id, req.body);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const tenant = db.delete(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    res.json({ success: true, message: 'Tenant deleted successfully', data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
