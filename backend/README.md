# RentMS Backend API

Backend API for the Rent Management System built with Express.js and MongoDB.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables:
- Copy `.env` file and update with your settings
- Set MongoDB URI (or use MongoDB Atlas)
- Set JWT secret key

3. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will run on http://localhost:5000

## API Endpoints

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `GET /api/properties/status/vacant` - Get vacant properties

### Tenants
- `GET /api/tenants` - Get all tenants
- `GET /api/tenants/:id` - Get tenant by ID
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant
- `GET /api/tenants/status/active` - Get active tenants

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `GET /api/payments/status/pending` - Get pending payments
- `GET /api/payments/status/overdue` - Get overdue payments

### Maintenance
- `GET /api/maintenance` - Get all maintenance requests
- `GET /api/maintenance/:id` - Get request by ID
- `POST /api/maintenance` - Create new request
- `PUT /api/maintenance/:id` - Update request
- `DELETE /api/maintenance/:id` - Delete request
- `GET /api/maintenance/status/open` - Get open requests

## Database Models

### Property
- propertyId, name, address, type, bedrooms, bathrooms, rent, status, tenantId

### Tenant
- firstName, lastName, email, phone, propertyId, leaseStart, leaseEnd, status

### Payment
- tenantId, propertyId, amount, dueDate, paidDate, status, paymentMethod

### Maintenance
- propertyId, tenantId, title, description, priority, status, scheduledDate, cost
