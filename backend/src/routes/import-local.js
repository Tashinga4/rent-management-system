const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const LocalDB = require('../config/localDB');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

const propertiesDB = new LocalDB('properties');
const suitesDB = new LocalDB('suites');
const roomsDB = new LocalDB('rooms');
const tenantsDB = new LocalDB('tenants');

// Bulk import endpoint
router.post('/bulk-tenants', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Read the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Delete uploaded file after reading
    fs.unlinkSync(req.file.path);

    if (data.length === 0) {
      return res.status(400).json({ success: false, error: 'Excel file is empty' });
    }

    const results = {
      properties: [],
      suites: [],
      rooms: [],
      tenants: [],
      errors: []
    };

    // Group tenants by property and rent amount
    const propertyMap = new Map();
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Extract data from row (handle various column name formats)
        const tenantName = row['Name'] || row['Tenant Name'] || row['name'] || row['tenant_name'];
        const email = row['Email'] || row['email'] || '';
        const phone = row['Phone'] || row['phone'] || row['Phone Number'] || '';
        const propertyName = row['Property'] || row['property'] || row['Building'] || 'Default Property';
        const rent = parseFloat(row['Rent'] || row['rent'] || row['Monthly Rent'] || 0);
        const moveInDate = row['Move In Date'] || row['move_in_date'] || row['MoveInDate'] || new Date().toISOString().split('T')[0];
        const leaseEndDate = row['Lease End Date'] || row['lease_end_date'] || row['LeaseEndDate'] || '';
        const emergencyContact = row['Emergency Contact'] || row['emergency_contact'] || '';
        const notes = row['Notes'] || row['notes'] || '';

        if (!tenantName || rent <= 0) {
          results.errors.push(`Row ${i + 2}: Missing tenant name or invalid rent amount`);
          continue;
        }

        // Get or create property
        if (!propertyMap.has(propertyName)) {
          let property = await propertiesDB.find({ name: propertyName });
          
          if (property.length === 0) {
            property = await propertiesDB.create({
              name: propertyName,
              type: 'Residential',
              address: '',
              description: 'Auto-imported property',
              status: 'active',
              bedrooms: 0,
              bathrooms: 0,
              rent: 0,
              roomsPerTenant: 0,
              suites: 0,
              tenantId: null
            });
            results.properties.push(property);
          } else {
            property = property[0];
          }
          
          propertyMap.set(propertyName, {
            property: property,
            suitesByRent: new Map()
          });
        }

        const propertyData = propertyMap.get(propertyName);
        const propertyId = propertyData.property._id;

        // Get or create suite for this rent amount
        let suite;
        if (propertyData.suitesByRent.has(rent)) {
          // Get next available vacant suite for this rent
          const existingSuites = propertyData.suitesByRent.get(rent);
          suite = existingSuites.find(s => s.status === 'vacant');
          
          if (!suite) {
            // Create new suite if all occupied
            const suiteCount = await suitesDB.find({ propertyId: propertyId });
            const suiteNumber = `Suite ${100 + suiteCount.length + 1}`;
            
            suite = await suitesDB.create({
              propertyId: propertyId,
              suiteNumber: suiteNumber,
              floor: Math.floor(suiteCount.length / 10) + 1,
              totalRooms: Math.floor(rent / 175) + 1, // Estimate rooms based on rent
              rentAmount: rent,
              status: 'vacant',
              tenantId: null,
              description: 'Auto-imported suite',
              amenities: []
            });
            
            results.suites.push(suite);
            existingSuites.push(suite);
          }
        } else {
          // Find existing suites with this rent or create new one
          let existingSuites = await suitesDB.find({ propertyId: propertyId, rentAmount: rent });
          
          if (existingSuites.length === 0) {
            const suiteCount = await suitesDB.find({ propertyId: propertyId });
            const suiteNumber = `Suite ${100 + suiteCount.length + 1}`;
            
            suite = await suitesDB.create({
              propertyId: propertyId,
              suiteNumber: suiteNumber,
              floor: Math.floor(suiteCount.length / 10) + 1,
              totalRooms: Math.floor(rent / 175) + 1,
              rentAmount: rent,
              status: 'vacant',
              tenantId: null,
              description: 'Auto-imported suite',
              amenities: []
            });
            
            results.suites.push(suite);
            existingSuites = [suite];
          } else {
            suite = existingSuites.find(s => s.status === 'vacant') || existingSuites[0];
          }
          
          propertyData.suitesByRent.set(rent, existingSuites);
        }

        // Create room in suite if not exists
        let rooms = await roomsDB.find({ suiteId: suite._id });
        if (rooms.length === 0) {
          const room = await roomsDB.create({
            suiteId: suite._id,
            roomNumber: 'Room 1',
            roomType: 'bedroom',
            size: '10x12 ft',
            hasBathroom: false,
            hasWindow: true,
            furnishingStatus: 'unfurnished',
            description: 'Auto-imported room'
          });
          results.rooms.push(room);
          rooms = [room];
        }

        // Create tenant
        const tenant = await tenantsDB.create({
          name: tenantName,
          email: email,
          phone: phone,
          suiteId: suite._id,
          roomId: rooms[0]._id,
          propertyId: propertyId,
          moveInDate: moveInDate,
          rent: rent,
          paymentStatus: 'pending',
          lastPaymentDate: null,
          leaseEndDate: leaseEndDate,
          emergencyContact: emergencyContact,
          notes: notes
        });

        results.tenants.push(tenant);

        // Update suite status to occupied
        await suitesDB.update(suite._id, {
          status: 'occupied',
          tenantId: tenant._id
        });

        // Update suite in map
        suite.status = 'occupied';

      } catch (error) {
        results.errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Import completed. Created ${results.properties.length} properties, ${results.suites.length} suites, ${results.rooms.length} rooms, and ${results.tenants.length} tenants.`,
      data: {
        propertiesCreated: results.properties.length,
        suitesCreated: results.suites.length,
        roomsCreated: results.rooms.length,
        tenantsImported: results.tenants.length,
        errors: results.errors
      }
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get import template
router.get('/template', (req, res) => {
  const template = [
    {
      'Name': 'John Doe',
      'Email': 'john@example.com',
      'Phone': '+1234567890',
      'Property': 'Building A',
      'Rent': 350,
      'Move In Date': '2024-01-15',
      'Lease End Date': '2025-01-14',
      'Emergency Contact': 'Jane Doe - +1234567891',
      'Notes': 'Good tenant'
    },
    {
      'Name': 'Sarah Smith',
      'Email': 'sarah@example.com',
      'Phone': '+1234567892',
      'Property': 'Building A',
      'Rent': 350,
      'Move In Date': '2024-02-01',
      'Lease End Date': '2025-02-01',
      'Emergency Contact': 'Tom Smith - +1234567893',
      'Notes': ''
    }
  ];

  const ws = xlsx.utils.json_to_sheet(template);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Tenants');
  
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Disposition', 'attachment; filename=tenant_import_template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

module.exports = router;
