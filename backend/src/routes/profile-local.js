const express = require('express');
const router = express.Router();
const LocalDB = require('../config/localDB');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const db = new LocalDB('profile');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../assets/img/avatars/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get current user profile
router.get('/', async (req, res) => {
  try {
    const profiles = db.find();
    // Return first profile or default
    if (profiles.length > 0) {
      res.json({ success: true, data: profiles[0] });
    } else {
      // Create default profile if none exists
      const defaultProfile = db.create({
        name: 'John Doe',
        email: 'admin@rentms.com',
        role: 'Admin',
        company: 'RentMS',
        phone: '',
        bio: '',
        avatar: '../assets/img/avatars/1.png'
      });
      res.json({ success: true, data: defaultProfile });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const updated = db.update(req.params.id, {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role || 'Admin',
      company: req.body.company || 'RentMS',
      phone: req.body.phone || '',
      bio: req.body.bio || '',
      avatar: req.body.avatar
    });
    
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Upload profile picture
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const avatarPath = `../assets/img/avatars/uploads/${req.file.filename}`;
    res.json({ success: true, avatarPath: avatarPath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
