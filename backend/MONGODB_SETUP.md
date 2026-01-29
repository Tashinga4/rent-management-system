# MongoDB Setup Guide for RentMS

## Prerequisites
- MongoDB installed locally or access to a MongoDB instance
- Node.js and npm installed

## Setup Instructions

### 1. Install MongoDB (if not already installed)

**Windows:**
- Download from: https://www.mongodb.com/try/download/community
- Run the installer
- MongoDB will be installed as a Windows Service

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

### 2. Start MongoDB Server

**Windows (if installed as service):**
```bash
# MongoDB should start automatically
# To verify it's running:
netstat -ano | findstr ":27017"
```

**macOS/Linux:**
```bash
# If using brew on macOS:
brew services start mongodb-community

# Or manually:
mongod
```

### 3. Update Backend Configuration

Edit `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/rentms
PORT=5000
NODE_ENV=development
```

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Start the Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 6. Verify Connection

You should see:
```
✅ Connected to MongoDB
🚀 RentMS Backend Server Running (MongoDB)
📍 Port: 5000
📡 API: http://localhost:5000/api
```

## Testing the API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Get All Properties
```bash
curl http://localhost:5000/api/properties
```

### Create a Property
```bash
curl -X POST http://localhost:5000/api/properties \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Apartment",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "type": "apartment",
    "bedrooms": 2,
    "bathrooms": 1,
    "totalArea": 850,
    "status": "vacant"
  }'
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB server is running: `mongod`
- Check if port 27017 is accessible
- Verify MONGODB_URI in .env file

### Port Already in Use
```bash
# Kill process on port 5000
# Windows:
netstat -ano | findstr ":5000"
taskkill /PID <PID> /F

# macOS/Linux:
lsof -i :5000
kill -9 <PID>
```

### Module Not Found
```bash
cd backend
npm install
```

## API Endpoints

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Tenants
- `GET /api/tenants` - Get all tenants
- `GET /api/tenants/:id` - Get tenant by ID
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

### Maintenance
- `GET /api/maintenance` - Get all maintenance requests
- `GET /api/maintenance/:id` - Get maintenance request by ID
- `POST /api/maintenance` - Create new maintenance request
- `PUT /api/maintenance/:id` - Update maintenance request
- `DELETE /api/maintenance/:id` - Delete maintenance request

### Suites
- `GET /api/suites` - Get all suites
- `GET /api/suites/:id` - Get suite by ID
- `POST /api/suites` - Create new suite
- `PUT /api/suites/:id` - Update suite
- `DELETE /api/suites/:id` - Delete suite

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

## Database Structure

The application uses the following MongoDB collections:

- **properties** - Property information
- **tenants** - Tenant details
- **payments** - Rent payment records
- **maintenance** - Maintenance requests
- **suites** - Apartment/suite units
- **rooms** - Individual rooms within suites
- **users** - User accounts and profiles
