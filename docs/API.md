# Abaya Bank API Documentation

Base URL: `http://localhost:5000/api`

All authenticated endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user with Firebase authentication.

**Request Body:**
```json
{
  "firebaseUid": "firebase-user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "nidOrPassport": "NID123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "user@example.com",
      "phone": "+1234567890",
      "role": "customer",
      "isActive": true,
      "createdAt": "2025-12-28T00:00:00.000Z"
    }
  }
}
```

### Verify Token
**POST** `/auth/verify`

Verify Firebase ID token and get user data.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token verified successfully",
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "customer"
    }
  }
}
```

---

## Account Endpoints

### Create Account
**POST** `/accounts`

Create a new bank account.

**Request Body:**
```json
{
  "accountType": "savings",
  "initialDeposit": 1000,
  "interestRate": 3.5,
  "maturityDate": "2026-12-28T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "account": {
      "_id": "account-id",
      "userId": "user-id",
      "accountNumber": "AB12345678901234",
      "accountType": "savings",
      "balance": 1000,
      "status": "active",
      "currency": "USD",
      "openingDate": "2025-12-28T00:00:00.000Z"
    }
  }
}
```

### Get User Accounts
**GET** `/accounts`

Get all accounts for authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "_id": "account-id",
        "accountNumber": "AB12345678901234",
        "accountType": "savings",
        "balance": 5000,
        "status": "active"
      }
    ]
  }
}
```

### Get Account by ID
**GET** `/accounts/:id`

Get detailed account information.

**Response:**
```json
{
  "success": true,
  "data": {
    "account": {
      "_id": "account-id",
      "accountNumber": "AB12345678901234",
      "accountType": "savings",
      "balance": 5000,
      "status": "active",
      "userId": {
        "name": "John Doe",
        "email": "user@example.com"
      }
    },
    "recentTransactions": []
  }
}
```

---

## Transaction Endpoints

### Deposit Money
**POST** `/transactions/deposit`

Deposit money into an account.

**Request Body:**
```json
{
  "accountId": "account-id",
  "amount": 500,
  "description": "Monthly deposit"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deposit successful",
  "data": {
    "transaction": {
      "_id": "txn-id",
      "transactionId": "TXN1735344000000012345",
      "transactionType": "deposit",
      "amount": 500,
      "balanceAfter": 5500,
      "createdAt": "2025-12-28T00:00:00.000Z"
    },
    "newBalance": 5500
  }
}
```

### Withdraw Money
**POST** `/transactions/withdraw`

Withdraw money from an account.

**Request Body:**
```json
{
  "accountId": "account-id",
  "amount": 200,
  "description": "ATM withdrawal"
}
```

**Response:** Similar to deposit

### Transfer Money
**POST** `/transactions/transfer`

Transfer money between accounts.

**Request Body:**
```json
{
  "fromAccountId": "source-account-id",
  "toAccountId": "dest-account-id",
  "amount": 300,
  "description": "Payment transfer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transfer successful",
  "data": {
    "transactions": [
      {
        "transactionType": "transfer_out",
        "amount": 300,
        "balanceAfter": 4700
      },
      {
        "transactionType": "transfer_in",
        "amount": 300,
        "balanceAfter": 1300
      }
    ],
    "fromAccountBalance": 4700,
    "toAccountBalance": 1300
  }
}
```

### Get Transactions
**GET** `/transactions?accountId=xxx&page=1&limit=20`

Get transactions with filters.

**Query Parameters:**
- `accountId` - Filter by account ID
- `type` - Filter by transaction type
- `startDate` - Filter from date
- `endDate` - Filter to date
- `minAmount` - Minimum amount
- `maxAmount` - Maximum amount
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalTransactions": 100,
      "hasMore": true
    }
  }
}
```

### Download Transaction Receipt
**GET** `/transactions/:id/receipt`

Download PDF receipt for a transaction.

**Response:** PDF file

### Get Monthly Statement
**GET** `/transactions/statement/:accountId?month=12&year=2025`

Get monthly account statement.

**Response:**
```json
{
  "success": true,
  "data": {
    "account": {
      "accountNumber": "AB12345678901234",
      "accountType": "savings",
      "currentBalance": 5000
    },
    "period": {
      "month": 12,
      "year": 2025,
      "startDate": "2025-12-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.000Z"
    },
    "transactions": [],
    "summary": {
      "totalDeposits": 2000,
      "totalWithdrawals": 500,
      "totalTransfersIn": 300,
      "totalTransfersOut": 200,
      "transactionCount": 15
    }
  }
}
```

### Download Monthly Statement PDF
**GET** `/transactions/statement/:accountId/download?month=12&year=2025`

Download PDF statement.

**Response:** PDF file

---

## Loan Endpoints

### Calculate EMI
**POST** `/loans/calculate-emi`

Calculate EMI for loan parameters.

**Request Body:**
```json
{
  "principalAmount": 50000,
  "interestRate": 12,
  "tenureMonths": 24
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emiAmount": 2353.67,
    "totalPayableAmount": 56488.08,
    "totalInterest": 6488.08,
    "principalAmount": 50000,
    "interestRate": 12,
    "tenureMonths": 24,
    "formula": "EMI = [P × R × (1 + R)^N] / [(1 + R)^N - 1]",
    "explanation": {
      "P": "Principal loan amount",
      "R": "Monthly interest rate (annual rate / 12 / 100)",
      "N": "Loan tenure in months"
    }
  }
}
```

### Apply for Loan
**POST** `/loans`

Submit loan application.

**Request Body:**
```json
{
  "accountId": "account-id",
  "loanType": "personal",
  "principalAmount": 50000,
  "interestRate": 12,
  "tenureMonths": 24,
  "purpose": "Home renovation",
  "employmentStatus": "employed",
  "monthlyIncome": 5000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Loan application submitted successfully",
  "data": {
    "loan": {
      "_id": "loan-id",
      "loanNumber": "LOAN1735344000000123",
      "principalAmount": 50000,
      "emiAmount": 2353.67,
      "status": "requested"
    }
  }
}
```

### Get User Loans
**GET** `/loans`

Get all loans for authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "loans": [
      {
        "_id": "loan-id",
        "loanNumber": "LOAN1735344000000123",
        "loanType": "personal",
        "principalAmount": 50000,
        "emiAmount": 2353.67,
        "status": "active",
        "remainingEmis": 20,
        "nextEmiDate": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Pay EMI
**POST** `/loans/:id/pay-emi`

Manually pay EMI for a loan.

**Response:**
```json
{
  "success": true,
  "message": "EMI paid successfully",
  "data": {
    "loan": {
      "remainingEmis": 19,
      "outstandingBalance": 47646.33
    },
    "transaction": {},
    "remainingBalance": 2646.33
  }
}
```

---

## Admin Endpoints

All admin endpoints require admin role.

### Get All Users
**GET** `/admin/users?page=1&limit=20&search=john&status=active`

Get all users with pagination.

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "user-id",
        "name": "John Doe",
        "email": "user@example.com",
        "role": "customer",
        "isActive": true,
        "accountCount": 2
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalUsers": 200
    }
  }
}
```

### Get All Accounts
**GET** `/admin/accounts?status=active&accountType=savings`

Get all accounts with filters.

### Freeze/Unfreeze Account
**PATCH** `/admin/accounts/:id/freeze`

Toggle account freeze status.

**Request Body:**
```json
{
  "reason": "Suspicious activity detected"
}
```

### Get All Loans
**GET** `/admin/loans?status=requested`

Get all loans with filters.

### Approve Loan
**POST** `/loans/:id/approve`

Approve loan and disburse amount.

### Reject Loan
**POST** `/loans/:id/reject`

**Request Body:**
```json
{
  "reason": "Insufficient credit history"
}
```

### Reverse Transaction
**POST** `/admin/transactions/:id/reverse`

Reverse a completed transaction.

**Request Body:**
```json
{
  "reason": "Customer request - wrong amount"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction reversed successfully",
  "data": {
    "originalTransaction": {},
    "reversalTransaction": {},
    "newBalance": 5200
  }
}
```

### Get Analytics
**GET** `/admin/analytics?period=month`

Get analytics dashboard data.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "transactions": {
        "totalDeposits": 150000,
        "totalWithdrawals": 80000,
        "totalTransfers": 45000,
        "transactionCount": 450
      },
      "accounts": {
        "total": 250,
        "active": 230,
        "frozen": 20
      },
      "loans": {
        "total": 75,
        "active": 50,
        "paid": 20,
        "overdue": 5,
        "requested": 10
      },
      "users": {
        "total": 200,
        "active": 195
      }
    },
    "trends": {
      "monthly": [],
      "accountGrowth": [],
      "loanStatus": []
    }
  }
}
```

### Get Audit Logs
**GET** `/admin/audit-logs?action=account_frozen&page=1`

Get audit trail logs.

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "log-id",
        "userId": {},
        "action": "account_frozen",
        "targetType": "account",
        "targetId": "account-id",
        "reason": "Suspicious activity",
        "createdAt": "2025-12-28T00:00:00.000Z"
      }
    ],
    "pagination": {}
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
