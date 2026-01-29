const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');

// Get all tenants
router.get('/', async (req, res) => {
  try {
    const tenants = await Tenant.find().populate('propertyId');
    res.json({ success: true, data: tenants });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get tenant by ID
router.get('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate('propertyId');
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new tenant
router.post('/', async (req, res) => {
  try {
    const tenant = new Tenant(req.body);
    await tenant.save();
    res.status(201).json(tenant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update tenant
router.put('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json(tenant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete tenant
router.delete('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active tenants
router.get('/status/active', async (req, res) => {
  try {
    const tenants = await Tenant.find({ status: 'Active' }).populate('propertyId');
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
