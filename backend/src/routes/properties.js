const express = require('express');
const router = express.Router();
const Property = require('../models/Property');

// Get all properties
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find().populate('tenantId');
    res.json({ success: true, data: properties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('tenantId');
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new property
router.post('/', async (req, res) => {
  try {
    const property = new Property({
      name: req.body.name,
      type: req.body.type,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      rent: req.body.rent,
      capacity: req.body.capacity,
      roomsPerTenant: req.body.roomsPerTenant,
      suites: req.body.suites,
      description: req.body.description,
      address: req.body.address,
      status: req.body.status || 'vacant',
      tenantId: req.body.tenantId || null
    });
    await property.save();
    res.status(201).json({ success: true, data: property });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update property
router.put('/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete property
router.delete('/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, message: 'Property deleted successfully', data: property });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get vacant properties
router.get('/status/vacant', async (req, res) => {
  try {
    const properties = await Property.find({ status: 'Vacant' });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
