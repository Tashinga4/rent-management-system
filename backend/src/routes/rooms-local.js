const express = require('express');
const router = express.Router();
const LocalDB = require('../config/localDB');

const roomsDB = new LocalDB('rooms');

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await roomsDB.find();
    res.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get rooms by suite ID
router.get('/suite/:suiteId', async (req, res) => {
  try {
    const rooms = await roomsDB.find({ suiteId: req.params.suiteId });
    res.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Error fetching rooms for suite:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single room by ID
router.get('/:id', async (req, res) => {
  try {
    const room = await roomsDB.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new room
router.post('/', async (req, res) => {
  try {
    const roomData = {
      suiteId: req.body.suiteId || '',
      roomNumber: req.body.roomNumber || '',
      roomType: req.body.roomType || 'bedroom',
      size: req.body.size || '',
      hasBathroom: req.body.hasBathroom || false,
      hasWindow: req.body.hasWindow || false,
      furnishingStatus: req.body.furnishingStatus || 'unfurnished',
      description: req.body.description || ''
    };

    const room = await roomsDB.create(roomData);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update room
router.put('/:id', async (req, res) => {
  try {
    const updateData = {};
    
    if (req.body.suiteId !== undefined) updateData.suiteId = req.body.suiteId;
    if (req.body.roomNumber !== undefined) updateData.roomNumber = req.body.roomNumber;
    if (req.body.roomType !== undefined) updateData.roomType = req.body.roomType;
    if (req.body.size !== undefined) updateData.size = req.body.size;
    if (req.body.hasBathroom !== undefined) updateData.hasBathroom = req.body.hasBathroom;
    if (req.body.hasWindow !== undefined) updateData.hasWindow = req.body.hasWindow;
    if (req.body.furnishingStatus !== undefined) updateData.furnishingStatus = req.body.furnishingStatus;
    if (req.body.description !== undefined) updateData.description = req.body.description;

    const room = await roomsDB.update(req.params.id, updateData);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete room
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await roomsDB.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
