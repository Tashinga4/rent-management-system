const express = require('express');
const router = express.Router();
const LocalDB = require('../config/localDB');
const db = new LocalDB('properties');

// Get all properties
router.get('/', async (req, res) => {
  try {
    const properties = db.find();
    res.json({ success: true, data: properties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = db.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, data: property });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new property
router.post('/', async (req, res) => {
  try {
    const property = db.create({
      name: req.body.name,
      type: req.body.type,
      bedrooms: req.body.bedrooms || 0,
      bathrooms: req.body.bathrooms || 0,
      rent: req.body.rent,
      roomsPerTenant: req.body.roomsPerTenant || 0,
      suites: req.body.suites || 0,
      description: req.body.description || '',
      address: req.body.address || '',
      status: req.body.status || 'vacant',
      tenantId: req.body.tenantId || null
    });
    res.status(201).json({ success: true, data: property });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update property
router.put('/:id', async (req, res) => {
  try {
    const property = db.update(req.params.id, req.body);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, data: property });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete property
router.delete('/:id', async (req, res) => {
  try {
    const property = db.delete(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, message: 'Property deleted successfully', data: property });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
