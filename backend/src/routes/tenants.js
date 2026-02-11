const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const Payment = require('../models/Payment');

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
    // Check if tenant with same name already has a compartment assigned
    if (req.body.firstName && req.body.lastName && req.body.compartment) {
      const duplicateName = await Tenant.findOne({
        firstName: { $regex: new RegExp(`^${req.body.firstName}$`, 'i') },
        lastName: { $regex: new RegExp(`^${req.body.lastName}$`, 'i') },
        compartment: { $ne: null },
        status: { $in: ['Active', 'Pending'] }
      });
      
      if (duplicateName) {
        return res.status(409).json({
          success: false,
          error: `A tenant named ${req.body.firstName} ${req.body.lastName} already has access to a compartment. Each person can only be assigned to one compartment.`
        });
      }
    }
    
    // Check if compartment is already occupied
    if (req.body.compartment) {
      const existingTenant = await Tenant.findOne({ 
        compartment: req.body.compartment,
        status: { $in: ['Active', 'Pending'] }
      });
      
      if (existingTenant) {
        return res.status(409).json({
          success: false,
          error: 'This compartment is already occupied by another tenant. Please select a different compartment.'
        });
      }
    }
    
    const tenant = new Tenant(req.body);
    await tenant.save();

    const rentAmount = Number(req.body.rentAmount) || 350;
    const paidDate = req.body.leaseStart ? new Date(req.body.leaseStart) : new Date();
    
    // Determine if initial rent should be marked as paid based on checkbox
    const initialRentPaid = req.body.initialRentPaid === true || req.body.initialRentPaid === 'true';
    const paymentStatus = initialRentPaid ? 'Paid' : 'Pending';
    
    const payment = new Payment({
      tenantId: tenant._id,
      compartmentId: tenant.compartment || undefined,
      amount: rentAmount,
      dueDate: paidDate,
      paidDate: initialRentPaid ? paidDate : undefined, // Only set paidDate if marked as paid
      status: paymentStatus,
      paymentMethod: req.body.paymentMethod || 'cash',
      notes: `Initial rent payment on tenant creation${initialRentPaid ? ' - Marked as Paid on Move-In' : ''}`
    });
    await payment.save();

    res.status(201).json({ success: true, data: tenant, initialPayment: payment });
  } catch (error) {
    if (error.code === 11000 && error.message.includes('compartment')) {
      return res.status(409).json({
        success: false,
        error: 'This compartment is already occupied by another tenant.'
      });
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update tenant
router.put('/:id', async (req, res) => {
  try {
    // Check if tenant with same name already has a compartment assigned
    if (req.body.firstName && req.body.lastName && req.body.compartment) {
      const duplicateName = await Tenant.findOne({
        firstName: { $regex: new RegExp(`^${req.body.firstName}$`, 'i') },
        lastName: { $regex: new RegExp(`^${req.body.lastName}$`, 'i') },
        compartment: { $ne: null },
        _id: { $ne: req.params.id },  // Exclude current tenant
        status: { $in: ['Active', 'Pending'] }
      });
      
      if (duplicateName) {
        return res.status(409).json({
          success: false,
          error: `A tenant named ${req.body.firstName} ${req.body.lastName} already has access to a compartment. Each person can only be assigned to one compartment.`
        });
      }
    }
    
    // Check if trying to assign to an occupied compartment
    if (req.body.compartment) {
      const existingTenant = await Tenant.findOne({ 
        compartment: req.body.compartment,
        _id: { $ne: req.params.id },  // Exclude current tenant
        status: { $in: ['Active', 'Pending'] }
      });
      
      if (existingTenant) {
        return res.status(409).json({
          success: false,
          error: 'This compartment is already occupied by another tenant. Please select a different compartment.'
        });
      }
    }
    
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
    if (error.code === 11000 && error.message.includes('compartment')) {
      return res.status(409).json({
        success: false,
        error: 'This compartment is already occupied by another tenant.'
      });
    }
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
