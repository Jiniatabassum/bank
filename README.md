# Abaya Bank - Modern Banking Web Application

A full-stack banking application with light bluish UI, built with React, Node.js, Express, MongoDB, and Firebase Authentication.

## 🎯 MVP vs v1 Scope

### **MVP Scope** (Core Banking Features)
1. **Authentication & User Management**
   - Firebase-based registration/login
   - User profile management (name, email, phone, NID/passport)
   - Role-based access control (Admin, Customer)

2. **Account Management**
   - Create multiple account types (Savings, Student, FDR)
   - View account details and balances
   - Account status management (active/frozen)

3. **Basic Banking Operations**
   - Deposit money
   - Withdraw money
   - Transfer between accounts (same user)
   - View transaction history

4. **Admin Features**
   - View all users and accounts
   - Freeze/unfreeze accounts
   - Basic analytics dashboard (total deposits, withdrawals, transfers)

### **v1 Scope** (Enhanced Features)
1. **Advanced Transactions**
   - User-to-user transfers
   - Transaction filtering (date range, type, amount)
   - PDF receipt download
   - Transaction reversal with audit logs

2. **Loan Management**
   - Loan application by customers
   - EMI calculation with formula display
   - Admin loan approval workflow
   - Auto-deduct EMI (monthly cron job)
   - Loan status tracking (requested/approved/active/paid/overdue)

3. **Reports & Analytics**
   - Monthly statement generation
   - Advanced dashboard with charts (Recharts)
   - Monthly trends for deposits/withdrawals
   - Loan status breakdown
   - Account growth visualization

4. **Security & Audit**
   - Complete audit log for admin actions
   - Rate limiting
   - Input validation (Zod)
   - Transaction reversal audit trail

## 📁 Project Structure

```
abaya-bank/
├── backend/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   ├── firebase.js          # Firebase Admin SDK
│   │   └── env.js               # Environment variables
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Account.js           # Account schema
│   │   ├── Transaction.js       # Transaction schema
│   │   ├── Loan.js              # Loan schema
│   │   └── AuditLog.js          # Audit log schema
│   ├── middleware/
│   │   ├── auth.js              # Firebase token verification
│   │   ├── rbac.js              # Role-based access control
│   │   ├── validation.js        # Request validation
│   │   ├── rateLimiter.js       # Rate limiting
│   │   └── errorHandler.js      # Global error handler
│   ├── routes/
│   │   ├── auth.routes.js       # Auth routes
│   │   ├── user.routes.js       # User routes
│   │   ├── account.routes.js    # Account routes
│   │   ├── transaction.routes.js # Transaction routes
│   │   ├── loan.routes.js       # Loan routes
│   │   └── admin.routes.js      # Admin routes
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── account.controller.js
│   │   ├── transaction.controller.js
│   │   ├── loan.controller.js
│   │   └── admin.controller.js
│   ├── services/
│   │   ├── transaction.service.js # Transaction logic
│   │   ├── loan.service.js        # Loan & EMI logic
│   │   ├── pdf.service.js         # PDF generation
│   │   └── analytics.service.js   # Analytics calculations
│   ├── jobs/
│   │   └── emiDeduction.job.js   # Cron job for EMI
│   ├── utils/
│   │   ├── logger.js             # Winston logger
│   │   └── helpers.js            # Helper functions
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # Entry point
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── RegisterForm.jsx
│   │   │   ├── accounts/
│   │   │   │   ├── AccountCard.jsx
│   │   │   │   ├── CreateAccountForm.jsx
│   │   │   │   └── AccountDetails.jsx
│   │   │   ├── transactions/
│   │   │   │   ├── TransactionForm.jsx
│   │   │   │   ├── TransactionList.jsx
│   │   │   │   └── TransactionFilter.jsx
│   │   │   ├── loans/
│   │   │   │   ├── LoanApplicationForm.jsx
│   │   │   │   ├── LoanCard.jsx
│   │   │   │   └── EMICalculator.jsx
│   │   │   ├── admin/
│   │   │   │   ├── UserTable.jsx
│   │   │   │   ├── AnalyticsChart.jsx
│   │   │   │   └── LoanApprovalPanel.jsx
│   │   │   └── common/
│   │   │       ├── Button.jsx
│   │   │       ├── Input.jsx
│   │   │       ├── Card.jsx
│   │   │       └── Modal.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── customer/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Accounts.jsx
│   │   │   │   ├── Transactions.jsx
│   │   │   │   ├── Statements.jsx
│   │   │   │   └── Loans.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── UsersManagement.jsx
│   │   │       ├── AccountsManagement.jsx
│   │   │       └── LoansManagement.jsx
│   │   ├── services/
│   │   │   ├── api.js            # Axios instance
│   │   │   ├── auth.service.js   # Auth API calls
│   │   │   ├── account.service.js
│   │   │   ├── transaction.service.js
│   │   │   └── loan.service.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth state management
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useAccounts.js
│   │   ├── utils/
│   │   │   ├── firebase.js       # Firebase config
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── docs/
    ├── API.md                    # API documentation
    └── SETUP.md                  # Setup instructions
```

## 🚀 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK
- **Validation**: Zod
- **PDF Generation**: PDFKit
- **Job Scheduling**: node-cron
- **Logging**: Winston
- **Security**: express-rate-limit, helmet, cors

### Frontend
- **Framework**: React 18
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **Auth**: Firebase SDK
- **HTTP Client**: Axios
- **Charts**: Recharts
- **State Management**: React Context API
- **Icons**: React Icons / Heroicons

## 🔧 Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/abaya-bank

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# JWT (optional, for additional security)
JWT_SECRET=your-jwt-secret

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (v6+)
- Firebase Project with Authentication enabled
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Firebase config
npm start
```

### Database Initialization
```bash
# MongoDB will create collections automatically
# Optional: Run seed script for demo data
npm run seed
```

## 🔐 Security Features

1. **Firebase Authentication**: Secure token-based auth
2. **RBAC Middleware**: Role-based route protection
3. **Input Validation**: Zod schema validation on all endpoints
4. **Rate Limiting**: Prevent brute force attacks
5. **MongoDB Transactions**: Atomic operations for transfers and EMI
6. **Audit Logging**: Track all admin actions
7. **Helmet**: HTTP header security
8. **CORS**: Configured for specific origins

## 📊 Key Features Implementation

### Atomic Transactions (MongoDB Session)
```javascript
// Transfer example with atomic operation
const session = await mongoose.startSession();
session.startTransaction();
try {
  // Deduct from source account
  await Account.findByIdAndUpdate(sourceId, { $inc: { balance: -amount } }, { session });
  // Add to destination account
  await Account.findByIdAndUpdate(destId, { $inc: { balance: amount } }, { session });
  // Create transaction records
  await Transaction.create([txnData], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

### EMI Calculation Formula
```
EMI = [P × R × (1 + R)^N] / [(1 + R)^N - 1]

Where:
P = Principal loan amount
R = Monthly interest rate (annual rate / 12 / 100)
N = Loan tenure in months
```

### PDF Receipt Generation
- Uses PDFKit to generate transaction receipts
- Includes transaction details, timestamp, and unique receipt ID
- Downloadable via backend endpoint: `/api/transactions/:id/receipt`

## 📈 Analytics Dashboard

### Metrics Tracked
- Total deposits (monthly/yearly)
- Total withdrawals (monthly/yearly)
- Total transfers
- Active accounts vs frozen accounts
- Loan approval rate
- Overdue loans
- Account growth trends

### Charts (Recharts)
- Line chart: Monthly deposit/withdrawal trends
- Bar chart: Transaction volume by type
- Pie chart: Loan status distribution
- Area chart: Account growth over time

## 🔄 Cron Jobs

### EMI Auto-Deduction
- Runs monthly on the 1st day at 00:00
- Checks all active loans with pending EMIs
- Deducts EMI amount from linked account
- Updates loan status if fully paid
- Marks as overdue if insufficient balance
- Sends notification (future enhancement)

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 API Endpoints Overview

### Authentication
- `POST /api/auth/verify` - Verify Firebase token
- `POST /api/auth/register` - Register new user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

### Accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts` - Get user accounts
- `GET /api/accounts/:id` - Get account details
- `PATCH /api/accounts/:id/status` - Update status (Admin)

### Transactions
- `POST /api/transactions/deposit` - Deposit money
- `POST /api/transactions/withdraw` - Withdraw money
- `POST /api/transactions/transfer` - Transfer money
- `GET /api/transactions/:accountId` - Get transactions
- `GET /api/transactions/:id/receipt` - Download PDF receipt

### Loans
- `POST /api/loans` - Apply for loan
- `GET /api/loans` - Get user loans
- `POST /api/loans/:id/approve` - Approve loan (Admin)
- `POST /api/loans/calculate-emi` - Calculate EMI

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/analytics` - Get analytics data
- `POST /api/admin/transactions/:id/reverse` - Reverse transaction

## 🎨 UI Theme

### Light Blue Color Palette
```css
Primary: #60A5FA (blue-400)
Secondary: #3B82F6 (blue-500)
Accent: #93C5FD (blue-300)
Background: #EFF6FF (blue-50)
Cards: #DBEAFE (blue-100)
Text: #1E3A8A (blue-900)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for learning and commercial purposes.

## 👥 Roles & Permissions

### Customer
- Manage own accounts
- Perform transactions
- Apply for loans
- View own data

### Admin
- All customer permissions
- View all users and accounts
- Freeze/unfreeze accounts
- Approve/reject loans
- Reverse transactions
- Access analytics dashboard

## 🔮 Future Enhancements (v2)

- Multi-currency support
- Credit card management
- Bill payments integration
- Email/SMS notifications
- Two-factor authentication
- Investment accounts
- Mobile app (React Native)
- Real-time notifications (WebSockets)
- Document upload (KYC)
- Chatbot support

---

**Built with ❤️ for secure and modern banking**
