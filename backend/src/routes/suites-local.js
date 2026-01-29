const express = require('express');
const router = express.Router();
const LocalDB = require('../config/localDB');

const suitesDB = new LocalDB('suites');

// Get all suites
router.get('/', async (req, res) => {
  try {
    const suites = await suitesDB.find();
    res.json({ success: true, data: suites });
  } catch (error) {
    console.error('Error fetching suites:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get suites by property ID
router.get('/property/:propertyId', async (req, res) => {
  try {
    const suites = await suitesDB.find({ propertyId: req.params.propertyId });
    res.json({ success: true, data: suites });
  } catch (error) {
    console.error('Error fetching suites for property:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single suite by ID
router.get('/:id', async (req, res) => {
  try {
    const suite = await suitesDB.findById(req.params.id);
    if (!suite) {
      return res.status(404).json({ success: false, error: 'Suite not found' });
    }
    res.json({ success: true, data: suite });
  } catch (error) {
    console.error('Error fetching suite:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new suite
router.post('/', async (req, res) => {
  try {
    const suiteData = {
      propertyId: req.body.propertyId || '',
      suiteNumber: req.body.suiteNumber || '',
      floor: req.body.floor || '',
      totalRooms: parseInt(req.body.totalRooms) || 0,
      rentAmount: parseFloat(req.body.rentAmount) || 0,
      status: req.body.status || 'vacant',
      tenantId: req.body.tenantId || null,
      description: req.body.description || '',
      amenities: req.body.amenities || []
    };

    const suite = await suitesDB.create(suiteData);
    res.status(201).json({ success: true, data: suite });
  } catch (error) {
    console.error('Error creating suite:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update suite
router.put('/:id', async (req, res) => {
  try {
    const updateData = {};
    
    if (req.body.propertyId !== undefined) updateData.propertyId = req.body.propertyId;
    if (req.body.suiteNumber !== undefined) updateData.suiteNumber = req.body.suiteNumber;
    if (req.body.floor !== undefined) updateData.floor = req.body.floor;
    if (req.body.totalRooms !== undefined) updateData.totalRooms = parseInt(req.body.totalRooms);
    if (req.body.rentAmount !== undefined) updateData.rentAmount = parseFloat(req.body.rentAmount);
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.tenantId !== undefined) updateData.tenantId = req.body.tenantId;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.amenities !== undefined) updateData.amenities = req.body.amenities;

    const suite = await suitesDB.update(req.params.id, updateData);
    if (!suite) {
      return res.status(404).json({ success: false, error: 'Suite not found' });
    }
    res.json({ success: true, data: suite });
  } catch (error) {
    console.error('Error updating suite:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete suite
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await suitesDB.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Suite not found' });
    }
    res.json({ success: true, message: 'Suite deleted successfully' });
  } catch (error) {
    console.error('Error deleting suite:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
