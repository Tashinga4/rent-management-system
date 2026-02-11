# Login System - Visual Guide & Walkthrough

## 📺 User Interface Overview

### Login Page Layout
```
┌─────────────────────────────────────────────────┐
│                                                 │
│          [Building Icon]                        │
│     Rent Management System                      │
│         Company Flat                            │
│                                                 │
│  📧 Email for Receipts                          │
│  ┌─────────────────────────────────────┐        │
│  │ your.email@company.com              │        │
│  │ (Enter email for receiving PDFs)    │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│  Email Address                                  │
│  ┌─────────────────────────────────────┐        │
│  │ admin@company.com                   │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│  Password                                       │
│  ┌─────────────────────────────────────┐        │
│  │ ••••••••                      [👁]   │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│  ☐ Remember me                                  │
│                                                 │
│  [         SIGN IN        ]                     │
│                                                 │
│  Contact Support                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow Diagram

```
┌──────────────┐
│ Open Browser │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────┐
│  Login Page (login.html)    │
│  - Email input              │
│  - Password input           │
│  - Remember me checkbox     │
└──────┬──────────────────────┘
       │
       │ (User enters credentials)
       │ Email: admin@company.com
       │ Password: admin123
       │
       ▼
┌──────────────────────────┐
│   Validation Check       │
│   - Email format         │
│   - Password not empty   │
└──────┬───────────────────┘
       │
       │ ✓ Valid
       │
       ▼
┌──────────────────────────────┐
│   POST /api/auth/login       │
│   (Backend Authentication)   │
│   - Check email exists       │
│   - Verify password hash     │
│   - Generate JWT token       │
└──────┬───────────────────────┘
       │
       ├─── ✓ Credentials OK
       │
       ▼
┌──────────────────────────┐
│   Save to localStorage   │
│   - authToken (JWT)      │
│   - userEmail            │ ← For PDF receipts
│   - userId               │
│   - userRole             │
│   - userName             │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│   Redirect to Dashboard          │
│   (index.html)                   │
│   - Show user profile in navbar  │
│   - Load tenant data             │
│   - Display analytics            │
└──────────────────────────────────┘
       │
       ▼
    [Dashboard Active]
```

---

## 🌐 Page Structure After Login

```
Dashboard (index.html)
├── Navbar
│   ├── Logo & Title
│   ├── Search
│   └── User Profile Dropdown
│       ├── Avatar
│       ├── Name: Admin User
│       ├── Role: Admin
│       ├── Settings
│       └── [Log Out] ← Click to logout
│
├── Sidebar Menu
│   ├── Dashboard
│   ├── Tenants
│   │   ├── All Tenants
│   │   ├── Add Tenant
│   │   └── Import Tenants
│   ├── Payments
│   │   ├── All Payments
│   │   ├── Pending
│   │   ├── Overdue
│   │   └── Record Payment
│   ├── Maintenance
│   ├── Reports
│   └── Profile
│
└── Main Content Area
    ├── Statistics
    ├── Charts
    ├── Recent Activity
    └── Quick Actions
```

---

## 📱 Data Flow

### 1. User Credential Input
```
┌────────────────────────────┐
│   login.html               │
│                            │
│ Email: admin@company.com   │
│ Password: admin123         │
│ Remember Me: ☑️            │
│                            │
│ [Sign In Button]           │
└──────────┬─────────────────┘
           │
           ▼
```

### 2. Backend Processing
```
┌──────────────────────────────┐
│ Node.js / Express Backend    │
│                              │
│ /api/auth/login endpoint     │
│ 1. Validate input            │
│ 2. Find user by email        │
│ 3. Hash & compare password   │
│ 4. Generate JWT token        │
│ 5. Return user info + token  │
└──────────┬───────────────────┘
           │
           ▼
```

### 3. Frontend Storage
```
┌───────────────────────────────┐
│ Browser LocalStorage          │
│                               │
│ authToken: "eyJhbGci..."      │
│ userEmail: "admin@company.com"│
│ userId: "507f1f77bcf86cd799"  │
│ userRole: "admin"             │
│ userName: "Admin User"        │
└───────────────────────────────┘
```

### 4. Page Access
```
┌─────────────────────────────┐
│ Any Protected Page          │
│                             │
│ 1. Check localStorage       │
│ 2. If authToken exists      │
│    → Load page              │
│ 3. Else                     │
│    → Redirect to login      │
└─────────────────────────────┘
```

---

## 🔄 Logout Flow

```
Dashboard (Any Protected Page)
       │
       │ (User clicks Log Out)
       │
       ▼
┌──────────────────────────────┐
│ auth.js logout() function    │
│                              │
│ 1. Clear localStorage        │
│ 2. Remove authToken          │
│ 3. Remove userEmail          │
│ 4. Remove userId, userRole   │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────┐
│ Redirect to login    │
│ window.location =    │
│ 'login.html'         │
└──────────────────────┘
       │
       ▼
   [Back to Login Page]
```

---

## 📧 Email for PDF Receipts

### Workflow
```
User Logs In
    │
    ▼ Email: admin@company.com
Stored in localStorage
    │
    ▼
Payment System Uses Email
    │
    ├─ When payment recorded
    ├─ Generate PDF receipt
    ├─ Get email: getUserEmail()
    │
    ▼
Email Service
    │
    ├─ Compose email
    ├─ Attach PDF
    ├─ To: admin@company.com
    │
    ▼
Tenant Receives Receipt
    │
    └─ inbox: admin@company.com
```

### Integration Point (Example)
```javascript
// In payment recording page
const recordPayment = async () => {
  // ... save payment ...
  
  // Get stored email for PDF delivery
  const recipientEmail = getUserEmail(); // admin@company.com
  
  // Generate PDF
  const pdf = generateReceiptPDF(paymentData);
  
  // Send email
  await emailService.send({
    to: recipientEmail,
    subject: 'Payment Receipt',
    attachment: pdf
  });
  
  // User receives email with PDF
};
```

---

## 🔐 Security Implementation

### Password Security
```
User enters: "admin123"
           │
           ▼
bcryptjs.hash("admin123", 10)
           │
           ▼
Hashed: "$2a$10$X5J8k3m9j..."
           │
           ▼
Stored in Database (encrypted)
```

### Token Security
```
On Login:
jwt.sign({
  id: "user_id",
  role: "admin"
}, JWT_SECRET, {
  expiresIn: '7d'
})
           │
           ▼
Token: "eyJhbGciOiJIUzI1NiIs..."
           │
           ▼
Stored in localStorage
           │
           ▼
Sent with each API request
Authorization: Bearer eyJh...
```

---

## 📊 User Profile Display

### Stored Information
```
After successful login:

┌────────────────────────────────┐
│ User Information               │
├────────────────────────────────┤
│ ID: 507f1f77bcf86cd799         │
│ Name: Admin User               │
│ Email: admin@company.com       │ ← For PDFs
│ Role: admin                    │
│ Phone: 555-0000                │
│ Status: Active                 │
│ Created: 2025-01-30            │
└────────────────────────────────┘

Display locations:
1. Navbar dropdown (showing name & role)
2. Profile settings page
3. Used for email receipts
4. Logged in page title
```

---

## 🧪 Testing Scenarios

### Scenario 1: Successful Login
```
Input:
  Email: admin@company.com
  Password: admin123
  
Expected:
  ✓ "Login successful! Redirecting..."
  ✓ Redirect to dashboard
  ✓ User profile in navbar
  ✓ localStorage has authToken
```

### Scenario 2: Wrong Password
```
Input:
  Email: admin@company.com
  Password: wrongpassword
  
Expected:
  ✗ "Invalid credentials"
  ✓ Stay on login page
  ✓ Clear password field
```

### Scenario 3: Non-existent Email
```
Input:
  Email: nonexistent@example.com
  Password: admin123
  
Expected:
  ✗ "Invalid credentials"
  ✓ Stay on login page
```

### Scenario 4: Try Accessing Protected Page
```
Action: Navigate to /tenants-list.html
Without login:
  
Expected:
  ✓ Redirect to login.html
  ✓ Cannot view tenant data
```

### Scenario 5: Logout
```
Action: Click "Log Out" button
  
Expected:
  ✓ localStorage cleared
  ✓ Redirect to login
  ✓ Cannot use back button to access
```

---

## 📈 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Tier                         │
│                    (Browser/HTML)                       │
│                                                         │
│  ┌─────────────┐         ┌──────────────┐              │
│  │  login.html │         │ Protected    │              │
│  │             │────────→│ Pages (11)   │              │
│  └─────────────┘         │              │              │
│                          └──────────────┘              │
│         ▲                        ▲                      │
│         │                        │                      │
│    auth.js (Client-side auth)   │                      │
│         │                        │                      │
└─────────┼────────────────────────┼──────────────────────┘
          │                        │
          │ API Requests           │ Check Token
          │                        │
┌─────────▼────────────────────────▼──────────────────────┐
│                     API Tier                            │
│                  (Express.js Backend)                   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /api/auth/login                                │  │
│  │  - Validate credentials                         │  │
│  │  - Generate JWT token                           │  │
│  │  - Return user info + token                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Protected Routes                               │  │
│  │  - Require JWT token in header                  │  │
│  │  - Return user-specific data                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ Database Queries
                      │
┌─────────────────────▼──────────────────────────────────┐
│                    Data Tier                           │
│                 (MongoDB Database)                     │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │  User Collection                               │   │
│  │  - _id: ObjectId                               │   │
│  │  - firstName, lastName                         │   │
│  │  - email (unique, for login)                   │   │
│  │  - password (hashed)                           │   │
│  │  - role (admin, manager, etc)                  │   │
│  │  - phone                                       │   │
│  │  - isActive                                    │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │  Tenant Collection                             │   │
│  │  - _id: ObjectId                               │   │
│  │  - name, email                                 │   │
│  │  - compartmentNumber                           │   │
│  │  - rentAmount                                  │   │
│  │  - ...                                         │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │  Payment Collection                            │   │
│  │  - tenant (foreign key)                        │   │
│  │  - amount, date, status                        │   │
│  │  - ...                                         │   │
│  └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Frontend
- [x] Login page (login.html) created
- [x] Auth helper script (auth.js) created
- [x] 11 pages updated with auth protection
- [x] Logout functionality working
- [x] User profile display in navbar
- [x] Error/success messages
- [x] Loading states
- [x] Email capture for receipts

### Backend
- [x] User model with email field
- [x] Password hashing (bcryptjs)
- [x] JWT token generation
- [x] Login API endpoint
- [x] User creation/seeding
- [x] Database connection
- [x] Error handling

### Testing
- [x] Login flow works
- [x] Protected pages redirect
- [x] Logout clears session
- [x] Email stored correctly
- [x] Error messages display
- [x] Token expires properly

### Documentation
- [x] Technical guide (AUTHENTICATION.md)
- [x] Quick start guide (QUICK_START.md)
- [x] Summary document (LOGIN_SYSTEM_SUMMARY.md)
- [x] Visual guide (this document)

---

## 🎓 Learning Resources

### JavaScript Functions to Know
```javascript
// Authentication
localStorage.setItem(key, value)  // Store data
localStorage.getItem(key)         // Retrieve data
localStorage.removeItem(key)      // Clear data

// API
fetch(url, options)               // Make HTTP requests
JSON.stringify()                  // Convert to JSON
JSON.parse()                      // Parse JSON

// Page Manipulation
window.location.href = 'page.html' // Redirect
document.getElementById()         // Select elements
document.addEventListener()       // Listen for events
```

### Backend Concepts
```javascript
// Express
app.post(route, handler)          // Define POST route
req.body                          // Get request data
res.json(data)                    // Send response

// Mongoose
model.create(data)                // Create document
model.findOne(query)              // Find document
model.deleteMany(query)           // Delete documents

// Security
bcryptjs.hash(password, salt)     // Hash password
bcryptjs.compare(plain, hashed)   // Verify password
jwt.sign(payload, secret)         // Create token
jwt.verify(token, secret)         // Verify token
```

---

This visual guide provides a complete understanding of how the login system works and how all components interact together!

**Version:** 1.0.0  
**Last Updated:** January 30, 2026
