const express = require('express');
const router = express.Router();
const Compartment = require('../models/Compartment');
const Tenant = require('../models/Tenant');

/**
 * Initialize 80 fixed compartments
 * POST /api/compartments/initialize/eighty
 * Creates 80 compartments with 2 bedrooms and 1 bathroom each
 */
router.post('/initialize/eighty', async (req, res) => {
  try {
    // Check if compartments already exist
    const existingCount = await Compartment.countDocuments();
    
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: `${existingCount} compartments already exist. Skipping initialization.`,
        data: { count: existingCount }
      });
    }

    // Create 80 compartments
    const compartmentsToCreate = Array.from({ length: 80 }, (_, index) => ({
      compartmentNumber: `C${String(index + 1).padStart(3, '0')}`,
      name: `Compartment ${index + 1}`,
      type: 'apartment',
      bedrooms: 2,
      bathrooms: 1,
      status: 'vacant',
      rentAmount: 1000, // Default rent amount
      paymentDueDay: 1,
      description: '2 Bedroom, 1 Bathroom Apartment',
      amenities: ['Bedroom 1', 'Bedroom 2', 'Bathroom']
    }));

    const createdCompartments = await Compartment.insertMany(compartmentsToCreate);

    res.status(201).json({
      success: true,
      message: `Successfully initialized 80 compartments with 2 bedrooms and 1 bathroom each`,
      data: {
        count: createdCompartments.length,
        compartments: createdCompartments
      }
    });
  } catch (error) {
    console.error('Error initializing compartments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all compartments
 * GET /api/compartments
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const compartments = await Compartment.find()
      .limit(limit)
      .populate('tenant')
      .populate('property');
    
    res.json({ success: true, data: compartments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get single compartment by ID
 * GET /api/compartments/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const compartment = await Compartment.findById(req.params.id)
      .populate('tenant')
      .populate('property');
    
    if (!compartment) {
      return res.status(404).json({ error: 'Compartment not found' });
    }
    res.json(compartment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create new compartment
 * POST /api/compartments
 */
router.post('/', async (req, res) => {
  try {
    const { compartmentNumber, name, bedrooms, bathrooms, rentAmount, tenant } = req.body;

    // Check if compartment number already exists
    const existing = await Compartment.findOne({ compartmentNumber });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Compartment ${compartmentNumber} already exists`,
        data: existing
      });
    }

    const compartment = new Compartment({
      compartmentNumber,
      name: name || `Compartment ${compartmentNumber}`,
      bedrooms: bedrooms || 2,
      bathrooms: bathrooms || 1,
      status: tenant ? 'occupied' : 'vacant',
      rentAmount: rentAmount || 1000,
      tenant: tenant || null,
      type: 'apartment',
      amenities: ['Bedroom 1', 'Bedroom 2', 'Bathroom']
    });

    await compartment.save();
    const populated = await compartment.populate('tenant');

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    console.error('Error creating compartment:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Update compartment
 * PUT /api/compartments/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const compartment = await Compartment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('tenant').populate('property');

    if (!compartment) {
      return res.status(404).json({ error: 'Compartment not found' });
    }

    res.json({ success: true, data: compartment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Assign tenant to compartment
 * POST /api/compartments/:id/assign-tenant
 */
router.post('/:id/assign-tenant', async (req, res) => {
  try {
    const { tenantId, rentAmount } = req.body;
    const compartmentId = req.params.id;

    // Find compartment
    const compartment = await Compartment.findById(compartmentId);
    if (!compartment) {
      return res.status(404).json({ error: 'Compartment not found' });
    }

    if (tenantId) {
      // Find tenant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Check if tenant is already assigned to another compartment
      const existingAssignment = await Tenant.findOne({
        _id: tenantId,
        compartment: { $ne: null },
        compartmentNumber: { $ne: compartment.compartmentNumber }
      });

      if (existingAssignment) {
        return res.status(409).json({
          success: false,
          message: `Tenant is already assigned to compartment ${existingAssignment.compartmentNumber}. Each tenant can only be assigned to one compartment.`,
          error: `Tenant is already assigned to compartment ${existingAssignment.compartmentNumber}`
        });
      }

      // Update compartment
      compartment.tenant = tenantId;
      compartment.status = 'occupied';
      if (rentAmount) {
        compartment.rentAmount = rentAmount;
      }

      // Update tenant
      tenant.compartment = compartmentId;
      tenant.compartmentNumber = compartment.compartmentNumber;
      if (rentAmount) {
        tenant.rentAmount = rentAmount;
      }

      await compartment.save();
      await tenant.save();
    } else {
      // Remove tenant from compartment
      if (compartment.tenant) {
        const removedTenant = await Tenant.findById(compartment.tenant);
        if (removedTenant) {
          removedTenant.compartment = null;
          removedTenant.compartmentNumber = null;
          await removedTenant.save();
        }
      }

      compartment.tenant = null;
      compartment.status = 'vacant';
      await compartment.save();
    }

    const updated = await compartment.populate('tenant');
    res.json({
      success: true,
      message: tenantId ? 'Tenant assigned successfully' : 'Tenant removed successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error assigning tenant:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Remove tenant from compartment
 * POST /api/compartments/:id/remove-tenant
 */
router.post('/:id/remove-tenant', async (req, res) => {
  try {
    const compartment = await Compartment.findById(req.params.id);
    if (!compartment) {
      return res.status(404).json({ error: 'Compartment not found' });
    }

    // Remove tenant reference
    if (compartment.tenant) {
      const tenant = await Tenant.findById(compartment.tenant);
      if (tenant) {
        tenant.compartment = null;
        tenant.compartmentNumber = null;
        await tenant.save();
      }
    }

    compartment.tenant = null;
    compartment.status = 'vacant';
    await compartment.save();

    const updated = await compartment.populate('tenant');
    res.json({
      success: true,
      message: 'Tenant removed from compartment',
      data: updated
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Delete compartment
 * DELETE /api/compartments/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const compartment = await Compartment.findByIdAndDelete(req.params.id);
    if (!compartment) {
      return res.status(404).json({ error: 'Compartment not found' });
    }

    // If compartment had a tenant, remove the compartment reference from tenant
    if (compartment.tenant) {
      const tenant = await Tenant.findById(compartment.tenant);
      if (tenant) {
        tenant.compartment = null;
        tenant.compartmentNumber = null;
        await tenant.save();
      }
    }

    res.json({ success: true, message: 'Compartment deleted', data: compartment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
