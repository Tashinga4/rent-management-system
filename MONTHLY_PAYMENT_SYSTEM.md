# Monthly Payment System - User Guide

## Overview
The system automatically generates monthly rent charges for all occupied compartments and allows you to record payments and generate receipts each month.

## How It Works

### 1. **Automatic Monthly Payment Generation**

The system runs an **automated job every month on the 1st at 12:01 AM** that:

- ✅ Scans all 80 compartments
- ✅ Finds compartments with `status: 'occupied'` and an assigned tenant
- ✅ Creates a **Pending** payment record for each occupied compartment
- ✅ Sets the **due date** based on the compartment's `paymentDueDay` (default: 1st of the month)
- ✅ Uses the compartment's `rentAmount` as the payment amount
- ✅ Skips compartments that already have a payment for the current month

**Example:**
- Compartment C001 has a tenant paying $350/month
- On February 1st at 12:01 AM, the system automatically creates:
  - **Payment Record**: Due Date: Feb 1, 2026 | Amount: $350 | Status: Pending

### 2. **Recording Monthly Payments**

When a tenant pays their rent, you can record the payment:

#### **From the Compartments Page:**

1. Navigate to **Compartments** page
2. Find the compartment with the tenant
3. Click the **"Mark Paid"** button next to the tenant
4. In the modal that opens:
   - **Payment Amount**: Enter the amount paid (pre-filled with rent amount)
   - **Payment Method**: Select Cash/Card/Bank Transfer/Check
   - **Payment Date**: Select when payment was received
   - **Notes**: Add any additional details (optional)
5. Click **"Record Payment & Generate Receipt"**

#### **What Happens:**
- ✅ The payment status changes from **Pending** → **Paid**
- ✅ The `paidDate` is recorded
- ✅ A receipt is automatically generated
- ✅ The compartment's `lastPaymentDate` is updated
- ✅ You can print the receipt immediately

### 3. **Payment Tracking Through Months**

**Each Month:**
- **Day 1 (12:01 AM)**: System auto-creates new payment records for all occupied compartments
- **Days 1-30**: You record payments as tenants pay throughout the month
- **Overdue Detection**: System automatically marks pending payments as overdue if the due date has passed

**Example Timeline:**
```
February 1, 2026 12:01 AM:
  ✅ Payment created for C001 - Due: Feb 1 - Status: Pending

February 5, 2026:
  📝 Tenant pays $350
  ✅ You record payment - Status: Paid - Receipt generated

March 1, 2026 12:01 AM:
  ✅ NEW payment created for C001 - Due: Mar 1 - Status: Pending
  (February payment still exists with Status: Paid)

March 5, 2026:
  📝 Tenant pays $350 again
  ✅ You record March payment - Status: Paid - Receipt generated
```

### 4. **Payment History**

Every payment is stored permanently in the database, allowing you to:
- ✅ Track payment history for each tenant
- ✅ View all payments ever made
- ✅ Generate historical reports
- ✅ See which months were paid vs. unpaid
- ✅ Track payment methods used

**To View Payment History:**
- Go to **Payments → All Payments** page
- Filter by tenant, date range, or status
- Export to Excel for reporting

### 5. **Payment Statuses**

| Status | Description |
|--------|-------------|
| **Pending** | Payment is due but not yet received |
| **Paid** | Payment has been recorded and receipt generated |
| **Overdue** | Due date has passed and payment not received |
| **Partial** | Partial payment received (less than full rent) |
| **Paid in Advance** | Tenant paid before the due date |

### 6. **Manual Payment Generation**

If needed, you can manually trigger payment generation (useful for testing or if the automatic job fails):

**Via API:**
```bash
POST http://localhost:5000/api/payments/generate-monthly
```

**Response:**
```json
{
  "success": true,
  "created": 5,    // Number of new payments created
  "skipped": 75    // Number of compartments skipped (already have payment)
}
```

### 7. **Payment Summary Dashboard**

The compartments page shows real-time payment statistics:

- 💵 **Total Paid**: Count of paid payments this month
- ✅ **Up to Date**: Tenants who paid on time
- ⏰ **Due Soon**: Payments approaching due date
- ⚠️ **Overdue**: Payments past due date
- 📊 **Partial**: Partial payments received
- ⏩ **Paid in Advance**: Payments received early

### 8. **Receipt Generation**

When you record a payment, a receipt is automatically generated with:

- ✅ Receipt number (payment ID)
- ✅ Tenant information (name, compartment)
- ✅ Payment date and amount
- ✅ Payment method
- ✅ Month/period covered
- ✅ Running balance (if applicable)

**Receipt is displayed in a modal** where you can:
- 📄 Print immediately
- 📧 Email to tenant (if configured)
- 💾 Save as PDF

## API Endpoints

### Payment Endpoints

```
GET    /api/payments                      - Get all payments
POST   /api/payments                      - Create new payment
GET    /api/payments/:id                  - Get payment by ID
PUT    /api/payments/:id                  - Update payment
DELETE /api/payments/:id                  - Delete payment

POST   /api/payments/:id/mark-paid        - Mark payment as paid
GET    /api/payments/monthly-status/:tenantId  - Get tenant's current month status
GET    /api/payments/summary/monthly      - Get monthly payment summary
POST   /api/payments/generate-monthly     - Manual payment generation trigger
```

### Example: Mark Payment as Paid

**Request:**
```bash
POST /api/payments/698b1234abcd5678efgh9012/mark-paid
Content-Type: application/json

{
  "paidDate": "2026-02-05",
  "paymentMethod": "Bank Transfer",
  "amount": 350
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "698b1234abcd5678efgh9012",
    "tenantId": {...},
    "compartmentId": {...},
    "amount": 350,
    "status": "Paid",
    "paidDate": "2026-02-05T00:00:00.000Z",
    "dueDate": "2026-02-01T00:00:00.000Z",
    "paymentMethod": "Bank Transfer",
    "receiptGenerated": true,
    "receiptGeneratedAt": "2026-02-05T10:30:00.000Z"
  }
}
```

## Database Schema

### Payment Model

```javascript
{
  tenantId: ObjectId (ref: Tenant) - Required
  compartmentId: ObjectId (ref: Compartment) - Required
  propertyId: ObjectId (ref: Property) - Optional
  amount: Number - Required
  dueDate: Date - Required
  paidDate: Date - Optional
  status: String - "Pending" | "Paid" | "Overdue" | "Partial"
  paymentMethod: String - "Cash" | "Card" | "Bank Transfer" | "Check"
  receiptGenerated: Boolean
  receiptPath: String
  receiptGeneratedAt: Date
  notes: String
  reference: String
  createdAt: Date - Auto-generated
}
```

## Configuration

### Modify Payment Due Day

To change the payment due day for a compartment:

```javascript
// Update compartment
PUT /api/compartments/:id
{
  "paymentDueDay": 5  // Payments due on 5th of each month
}
```

### Schedule Configuration

The monthly job schedule is configured in:
```
backend/src/services/monthlyPaymentGenerator.js
```

**Default Schedule:** `'1 0 1 * *'` (12:01 AM on the 1st of every month)

**To Change:**
```javascript
const schedule = '1 0 5 * *';  // 12:01 AM on the 5th of every month
```

## Troubleshooting

### Payments Not Auto-Generating

1. **Check Server Logs:**
   - Look for: "✅ Monthly payment generator initialized"
   - Errors will show: "❌ Error generating monthly payments"

2. **Verify Compartment Status:**
   - Compartment must have `status: 'occupied'`
   - Compartment must have a `tenant` assigned

3. **Check Date/Time:**
   - Server timezone must be configured correctly
   - Job runs at 12:01 AM server time

### Manual Trigger Not Working

1. **Ensure MongoDB is Connected:**
   ```bash
   GET /api/health
   ```

2. **Check for Duplicate Payments:**
   - System won't create duplicate payments for the same month
   - Verify no payment exists for current month

### Payment Not Marked as Paid

1. **Verify Payment Exists:**
   ```bash
   GET /api/payments/:id
   ```

2. **Check Required Fields:**
   - `amount` must be positive number
   - `paidDate` should be valid date
   - `paymentMethod` should be valid enum value

## Best Practices

1. ✅ **Record payments promptly** when received
2. ✅ **Generate receipts** for all payments
3. ✅ **Review monthly summary** at end of each month
4. ✅ **Follow up on overdue payments** regularly
5. ✅ **Keep payment notes** for any special circumstances
6. ✅ **Backup payment data** regularly
7. ✅ **Verify automated job** runs successfully each month

## Summary

The monthly payment system provides a **fully automated, recurring billing solution** where:

1. Payments are **automatically generated** on the 1st of each month
2. You **record payments** as tenants pay throughout the month
3. **Receipts are generated** automatically when payments are recorded
4. **Payment history** is preserved indefinitely
5. **Each month is independent** - new payments are created for each billing period

This ensures **accurate tracking** of all rent payments across all 80 compartments, **every month**, with **complete historical records** and **automated receipt generation**.
