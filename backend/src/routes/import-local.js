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

const handleBulkTenants = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Read the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    const dataRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Delete uploaded file after reading
    fs.unlinkSync(req.file.path);

    if (data.length === 0 && dataRows.length === 0) {
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
    
    const headerRow = dataRows[0] || [];
    const headerHasText = headerRow.filter((cell) => /[a-zA-Z]/.test(String(cell))).length >= 2;
    const headerHasCustom = headerRow.some((cell) => /quantity|qty|count/i.test(String(cell)))
      && headerRow.some((cell) => /name/i.test(String(cell)));
    const headerBased = headerHasText || headerHasCustom;

    const rowsToProcess = headerBased ? data : dataRows.slice(0);

    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];
      const rowValues = headerBased ? [] : row;

      if (!headerBased) {
        const isEmptyRow = rowValues.every((cell) => String(cell || '').trim() === '');
        if (isEmptyRow) {
          continue;
        }
      }
      
      try {
        // Extract data from row (handle various column name formats)
        const tenantName = headerBased ? (row['Name'] || row['Tenant Name'] || row['name'] || row['tenant_name']) : '';
        const email = headerBased ? (row['Email'] || row['email'] || '') : '';
        const phone = headerBased ? (row['Phone'] || row['phone'] || row['Phone Number'] || '') : '';
        const propertyName = headerBased ? (row['Property'] || row['property'] || row['Building'] || 'Default Property') : 'Default Property';
        const rent = headerBased ? parseFloat(row['Rent'] || row['rent'] || row['Monthly Rent'] || 0) : 0;
        const moveInDate = headerBased ? (row['Move In Date'] || row['move_in_date'] || row['MoveInDate'] || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
        const leaseEndDate = headerBased ? (row['Lease End Date'] || row['lease_end_date'] || row['LeaseEndDate'] || '') : '';
        const emergencyContact = headerBased ? (row['Emergency Contact'] || row['emergency_contact'] || '') : '';
        const notes = headerBased ? (row['Notes'] || row['notes'] || '') : '';

        // Custom format support: Quantity, Name, then monthly rent columns
        const quantityKey = headerBased ? Object.keys(row).find((key) =>
          ['quantity', 'qty', 'count'].includes(String(key).trim().toLowerCase())
        ) : null;
        const nameKey = headerBased ? Object.keys(row).find((key) =>
          ['name', 'tenant name', 'tenant'].includes(String(key).trim().toLowerCase())
        ) : null;
        const monthlyKeys = headerBased ? Object.keys(row).filter((key) => {
          const normalized = String(key).trim().toLowerCase();
          if (normalized === String(quantityKey || '').trim().toLowerCase()) return false;
          if (normalized === String(nameKey || '').trim().toLowerCase()) return false;
          return row[key] !== undefined && row[key] !== null && row[key] !== '' && !isNaN(parseFloat(row[key]));
        }) : [];
        const isCustomMonthlyFormat = headerBased ? (quantityKey && nameKey && monthlyKeys.length > 0) : true;

        if (isCustomMonthlyFormat) {
          const quantity = headerBased
            ? Math.max(1, parseInt(row[quantityKey], 10) || 1)
            : Math.max(1, parseInt(rowValues[0], 10) || 1);
          const baseName = headerBased
            ? String(row[nameKey] || '').trim()
            : String(rowValues[1] || '').trim();
          const monthValues = headerBased
            ? monthlyKeys.map((key) => ({ key, value: parseFloat(row[key]) }))
            : rowValues.slice(2).map((value, index) => ({ key: `Month ${index + 1}`, value: parseFloat(value) }))
            .filter((item) => !isNaN(item.value) && item.value > 0);

          if (!baseName || monthValues.length === 0) {
            results.errors.push(`Row ${i + 2}: Missing tenant name or monthly rent values`);
            continue;
          }

          const averageRent = monthValues.reduce((sum, item) => sum + item.value, 0) / monthValues.length;
          const monthlyNotes = monthValues.map((item) => `${item.key}: ${item.value}`).join(', ');

          for (let q = 1; q <= quantity; q++) {
            const derivedName = quantity > 1 ? `${baseName} #${q}` : baseName;

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
            if (propertyData.suitesByRent.has(averageRent)) {
              const existingSuites = propertyData.suitesByRent.get(averageRent);
              suite = existingSuites.find(s => s.status === 'vacant');
              if (!suite) {
                const suiteCount = await suitesDB.find({ propertyId: propertyId });
                const suiteNumber = `Suite ${100 + suiteCount.length + 1}`;
                suite = await suitesDB.create({
                  propertyId: propertyId,
                  suiteNumber: suiteNumber,
                  floor: Math.floor(suiteCount.length / 10) + 1,
                  totalRooms: Math.floor(averageRent / 175) + 1,
                  rentAmount: averageRent,
                  status: 'vacant',
                  tenantId: null,
                  description: 'Auto-imported suite',
                  amenities: []
                });
                results.suites.push(suite);
                existingSuites.push(suite);
              }
            } else {
              let existingSuites = await suitesDB.find({ propertyId: propertyId, rentAmount: averageRent });
              if (existingSuites.length === 0) {
                const suiteCount = await suitesDB.find({ propertyId: propertyId });
                const suiteNumber = `Suite ${100 + suiteCount.length + 1}`;
                suite = await suitesDB.create({
                  propertyId: propertyId,
                  suiteNumber: suiteNumber,
                  floor: Math.floor(suiteCount.length / 10) + 1,
                  totalRooms: Math.floor(averageRent / 175) + 1,
                  rentAmount: averageRent,
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
              propertyData.suitesByRent.set(averageRent, existingSuites);
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
              name: derivedName,
              email: email,
              phone: phone,
              suiteId: suite._id,
              roomId: rooms[0]._id,
              propertyId: propertyId,
              moveInDate: moveInDate,
              rent: averageRent,
              paymentStatus: 'pending',
              lastPaymentDate: null,
              leaseEndDate: leaseEndDate,
              emergencyContact: emergencyContact,
              notes: notes ? `${notes} | Monthly Rents: ${monthlyNotes}` : `Monthly Rents: ${monthlyNotes}`
            });

            results.tenants.push(tenant);

            // Update suite status to occupied
            await suitesDB.update(suite._id, {
              status: 'occupied',
              tenantId: tenant._id
            });

            suite.status = 'occupied';
          }

          continue;
        }

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
};

// Bulk import endpoint
router.post('/bulk-tenants', upload.single('file'), handleBulkTenants);
// Alias to match frontend
router.post('/bulk-upload', upload.single('file'), handleBulkTenants);

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
