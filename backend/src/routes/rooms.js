const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().populate('suiteId').populate('propertyId');
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single room
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('suiteId').populate('propertyId');
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create room
router.post('/', async (req, res) => {
  try {
    const room = new Room(req.body);
    await room.save();
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update room
router.put('/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete room
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, message: 'Room deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
