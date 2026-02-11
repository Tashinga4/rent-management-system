# Quick Setup Guide - Login System

## 🚀 Quick Start (5 Minutes)

### 1. Seed the Database
```bash
cd C:\Users\Dylan\Downloads\sneat-1.0.0\rent-management-system\backend
npm run seed
```

**Output:**
```
✅ Created admin user: admin@company.com / admin123
✅ Created 4 tenants
✅ Created sample payments
✅ Created maintenance requests
✅ Database seeded successfully!
```

### 2. Start the Server
```bash
npm start
```

**Output:**
```
Server running on port 5000
API available at http://localhost:5000/api
MongoDB connected successfully
Payment processor scheduler started
```

### 3. Open Login Page
```
http://localhost:5000/login.html
```

### 4. Login with Test Credentials
- **Email:** `admin@company.com`
- **Password:** `admin123`
- **Receipt Email:** (same email - PDFs will be sent here)

### 5. Access Dashboard
After login, you'll be redirected to the dashboard at:
```
http://localhost:5000/index.html
```

---

## 📧 Email for Receipt Delivery

The email you enter in the login form will be used for:
- ✅ Sending tenant payment receipts as PDFs
- ✅ Sending payment reminders
- ✅ System notifications

**Current Test Email:** `admin@company.com`

---

## 🔑 User Accounts

### Admin Account (Created by Seed)
| Field | Value |
|-------|-------|
| Name | Admin User |
| Email | admin@company.com |
| Password | admin123 |
| Role | admin |
| Phone | 555-0000 |

### Tenants (For Reference)
- John Smith (Compartment 101)
- Sarah Johnson (Compartment 102)
- Mike Davis (Compartment 205)
- Emma Wilson (Compartment 312)

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `login.html` | Login page (entry point) |
| `assets/js/auth.js` | Authentication helper script |
| `models/User.js` | User database schema |
| `routes/auth.js` | Login/authentication API |
| `seed.js` | Database seeding script |

---

## 🔐 How It Works

### Login Process
1. Enter email & password
2. Backend verifies credentials
3. JWT token is issued
4. Token stored in browser (localStorage)
5. Redirect to dashboard

### Protected Pages
All main pages automatically:
- Check if user is logged in
- Redirect to login if not
- Display user info in navbar
- Allow logout from any page

### Logout Process
1. Click "Log Out" in dropdown
2. Clear all authentication data
3. Redirect to login page

---

## ✅ What's Included

### Frontend Features
- ✅ Professional login page
- ✅ Email input for receipt delivery
- ✅ Password field with visibility toggle
- ✅ "Remember Me" option
- ✅ Error messages & validation
- ✅ Loading state during login
- ✅ Auto-redirect if already logged in

### Backend Features
- ✅ User authentication API
- ✅ Password hashing (bcryptjs)
- ✅ JWT token generation
- ✅ User creation/seeding
- ✅ Email storage for receipts

### Protected Pages
- ✅ Dashboard
- ✅ Tenants Management
- ✅ Payments
- ✅ Maintenance
- ✅ Reports
- ✅ Profile Settings

---

## 🧪 Testing

### Test Login Flow
```
1. Open http://localhost:5000/login.html
2. Enter: admin@company.com
3. Enter: admin123
4. Click "Sign In"
5. Should redirect to dashboard (index.html)
```

### Test Protected Pages
```
1. Try accessing dashboard without logging in
2. Should redirect to login page
3. User profile should appear in navbar after login
4. Logout button should clear session
```

### Test Email Storage
```javascript
// Open browser console and run:
localStorage.getItem('userEmail')
// Should return: admin@company.com
```

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to server"
**Solution:**
```bash
# Make sure backend is running
npm start
# Check if running on port 5000
```

### Problem: "Invalid credentials"
**Solution:**
```
- Email must be: admin@company.com (lowercase)
- Password must be: admin123
- Run: npm run seed (to recreate user)
```

### Problem: "Database seeding failed"
**Solution:**
```bash
# Make sure MongoDB is running
# Check .env file has correct MONGODB_URI
# Verify: mongodb://localhost:27017/rent_management
```

### Problem: Login page keeps redirecting
**Solution:**
```javascript
// Clear localStorage
localStorage.clear()
// Refresh page
```

---

## 📊 API Endpoints

### Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "admin@company.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "phone": "555-0000"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 💾 Browser Storage

### Stored After Login
```javascript
localStorage.authToken        // JWT token for API calls
localStorage.userEmail        // Email for receipt delivery
localStorage.userId          // User's database ID
localStorage.userRole        // User's role (admin, manager, etc)
localStorage.userName        // User's full name
```

### To View Stored Data
```javascript
// In browser console:
Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('user'))
```

---

## 🎯 Next Steps

1. ✅ **Test Login** - Verify it works
2. ✅ **Create More Users** - Add via registration or database
3. ✅ **Test Protected Pages** - Verify auth on all pages
4. ✅ **Integrate Email** - Setup email service for receipts
5. ✅ **Add Roles** - Implement role-based access control

---

## 📚 Full Documentation

For complete technical documentation, see: [AUTHENTICATION.md](./AUTHENTICATION.md)

---

**Version:** 1.0.0  
**Last Updated:** January 30, 2026
