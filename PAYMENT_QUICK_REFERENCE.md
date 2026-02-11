# Monthly Payment System - Quick Reference

## Monthly Cycle Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MONTH 1 (e.g., February)                 │
└─────────────────────────────────────────────────────────────┘

Day 1 @ 12:01 AM
    │
    ├─> System scans all 80 compartments
    ├─> Finds 5 occupied compartments
    ├─> Creates 5 payment records (Status: Pending)
    │   • C001 - $350 - Due: Feb 1
    │   • C012 - $400 - Due: Feb 1
    │   • C025 - $375 - Due: Feb 1
    │   • C048 - $450 - Due: Feb 1
    │   • C073 - $420 - Due: Feb 1
    │
Day 1-28 (Throughout the month)
    │
    ├─> Feb 3: C001 tenant pays $350
    │   └─> You record payment → Status: Paid → Receipt generated
    │
    ├─> Feb 5: C012 tenant pays $400
    │   └─> You record payment → Status: Paid → Receipt generated
    │
    ├─> Feb 10: C025 tenant pays $375
    │   └─> You record payment → Status: Paid → Receipt generated
    │
    ├─> Feb 20: C048 tenant pays $450
    │   └─> You record payment → Status: Paid → Receipt generated
    │
    └─> Feb 28: C073 HASN'T PAID YET
        └─> Status: Overdue (past due date)

┌─────────────────────────────────────────────────────────────┐
│                    MONTH 2 (e.g., March)                    │
└─────────────────────────────────────────────────────────────┘

March 1 @ 12:01 AM
    │
    ├─> System scans all 80 compartments again
    ├─> Creates NEW payment records for March
    │   • C001 - $350 - Due: Mar 1 - Status: Pending
    │   • C012 - $400 - Due: Mar 1 - Status: Pending
    │   • C025 - $375 - Due: Mar 1 - Status: Pending
    │   • C048 - $450 - Due: Mar 1 - Status: Pending
    │   • C073 - $420 - Due: Mar 1 - Status: Pending
    │
    ├─> February payments still exist:
    │   • C001 - $350 - Feb - Status: Paid ✓
    │   • C012 - $400 - Feb - Status: Paid ✓
    │   • C025 - $375 - Feb - Status: Paid ✓
    │   • C048 - $450 - Feb - Status: Paid ✓
    │   • C073 - $420 - Feb - Status: Overdue ⚠️
    │
Day 1-31 (Throughout March)
    │
    ├─> March 1: C073 pays February + March ($420 x 2 = $840)
    │   └─> Record Feb payment → Status: Paid
    │   └─> Record Mar payment → Status: Paid
    │
    └─> Other tenants pay throughout the month
        └─> Each payment recorded separately

┌─────────────────────────────────────────────────────────────┐
│                  MONTH 3 and beyond...                       │
└─────────────────────────────────────────────────────────────┘

The cycle continues every month indefinitely.
```

## Key Concepts

### 🔄 Recurring Billing
- **New payments created automatically** on the 1st of each month
- **Each month is a separate payment record**
- **Historical payments are preserved forever**

### 📊 Payment States

```
Pending → [You record payment] → Paid ✓
   ↓
   └─> [Due date passes] → Overdue ⚠️
```

### 📋 Example: One Tenant Across 3 Months

**Tenant: John Doe | Compartment: C001 | Rent: $350/month**

| Month | Created Date | Due Date | Paid Date | Status | Receipt |
|-------|-------------|----------|-----------|--------|---------|
| Feb | Feb 1 @ 12:01 AM | Feb 1 | Feb 3 | Paid | #001 |
| Mar | Mar 1 @ 12:01 AM | Mar 1 | Mar 5 | Paid | #002 |
| Apr | Apr 1 @ 12:01 AM | Apr 1 | Apr 2 | Paid | #003 |
| May | May 1 @ 12:01 AM | May 1 | - | Pending | - |

## Recording a Payment (Step-by-Step)

```
1. Go to Compartments page
   ↓
2. Find tenant's compartment
   ↓
3. Click "Mark Paid" button
   ↓
4. Fill payment details:
   • Amount: $350
   • Method: Bank Transfer
   • Date: Today's date
   • Notes: (optional)
   ↓
5. Click "Record Payment & Generate Receipt"
   ↓
6. Receipt appears
   ↓
7. Print or save receipt
   ↓
8. Payment status changes: Pending → Paid ✓
```

## What Gets Created

### For Each Occupied Compartment

```javascript
{
  tenantId: "698ae3a1b...",           // The tenant
  compartmentId: "698adfc99...",      // The compartment
  amount: 350,                         // Rent amount from compartment
  dueDate: "2026-02-01T00:00:00Z",    // 1st of current month
  status: "Pending",                   // Unpaid
  notes: "Monthly rent for C001 - February 2026"
}
```

### When You Record Payment

```javascript
{
  // Original fields plus:
  status: "Paid",                      // Updated status
  paidDate: "2026-02-05T00:00:00Z",   // When you recorded it
  paymentMethod: "Bank Transfer",      // How they paid
  receiptGenerated: true,              // Receipt created
  receiptGeneratedAt: "2026-02-05T10:30:00Z"
}
```

## Database Growth

### Example After 1 Year (12 Months)

- **1 Tenant in 1 Compartment**: 12 payment records
- **5 Tenants in 5 Compartments**: 60 payment records
- **80 Tenants in 80 Compartments**: 960 payment records

All records are **preserved permanently** for historical tracking and reporting.

## Quick Commands

### Test Payment Generation
```bash
POST http://localhost:5000/api/payments/generate-monthly
```

### View All Payments
```bash
GET http://localhost:5000/api/payments
```

### View Monthly Summary
```bash
GET http://localhost:5000/api/payments/summary/monthly
```

### Check Tenant Payment Status
```bash
GET http://localhost:5000/api/payments/monthly-status/{tenantId}
```

## Summary

✅ **Automatic** - Payments generated on 1st of each month  
✅ **Recurring** - New payment created every month  
✅ **Historical** - All past payments preserved  
✅ **Individual** - Each tenant has separate payment per month  
✅ **Trackable** - Complete payment history  
✅ **Receipts** - Auto-generated when recording payment  
✅ **Flexible** - Record payments anytime during the month  

**Result:** Complete monthly rent tracking for all 80 compartments, automatically, forever.
