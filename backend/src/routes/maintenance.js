const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');

// Get all maintenance requests
router.get('/', async (req, res) => {
  try {
    const requests = await Maintenance.find()
      .populate('propertyId')
      .populate('tenantId')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get maintenance request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await Maintenance.findById(req.params.id)
      .populate('propertyId')
      .populate('tenantId');
    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new maintenance request
router.post('/', async (req, res) => {
  try {
    const request = new Maintenance(req.body);
    await request.save();
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update maintenance request
router.put('/:id', async (req, res) => {
  try {
    const request = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete maintenance request
router.delete('/:id', async (req, res) => {
  try {
    const request = await Maintenance.findByIdAndDelete(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }
    res.json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get open maintenance requests
router.get('/status/open', async (req, res) => {
  try {
    const requests = await Maintenance.find({ status: 'Open' })
      .populate('propertyId')
      .populate('tenantId');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
