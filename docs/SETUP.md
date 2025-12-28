# Abaya Bank - Setup Guide

Complete setup instructions for running Abaya Bank locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager
- **Git** for version control
- **Firebase Account** - [Create one](https://firebase.google.com/)

## Part 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: "Abaya Bank"
4. Follow the setup wizard
5. Enable Google Analytics (optional)

### 1.2 Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Enable **Email/Password** sign-in method
4. (Optional) Enable other providers as needed

### 1.3 Get Firebase Configuration

**For Frontend (Web App):**
1. Go to Project Settings → General
2. Scroll to "Your apps" section
3. Click "Web" icon (</>) to add a web app
4. Register app with nickname: "Abaya Bank Web"
5. Copy the Firebase config object
6. Save these values for `.env` file

**For Backend (Admin SDK):**
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values:
   - `project_id`
   - `private_key`
   - `client_email`

### 1.4 Create Test Users

1. In Authentication tab, click "Add user"
2. Create an admin user:
   - Email: `admin@abayabank.com`
   - Password: `admin123`
3. Create a customer user:
   - Email: `customer@abayabank.com`
   - Password: `customer123`

## Part 2: MongoDB Setup

### 2.1 Install MongoDB

**Windows:**
```bash
# Download installer from mongodb.com
# Run installer and follow wizard
# MongoDB will run as a service automatically
```

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

**Linux (Ubuntu):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### 2.2 Verify MongoDB Installation

```bash
mongo --version
# or
mongosh --version
```

### 2.3 Create Database

MongoDB will create the database automatically when you first connect, but you can create it manually:

```bash
mongosh
use abaya-bank
db.createCollection("users")
exit
```

## Part 3: Backend Setup

### 3.1 Install Dependencies

```bash
cd backend
npm install
```

### 3.2 Configure Environment Variables

Create `.env` file in `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` file with your values:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/abaya-bank

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# JWT (optional)
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string

# Frontend URL
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

**Note:** For `FIREBASE_PRIVATE_KEY`, replace actual newlines with `\n`:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANB...\n-----END PRIVATE KEY-----\n
```

### 3.3 Create Logs Directory

```bash
mkdir logs
```

### 3.4 Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on: `http://localhost:5000`

### 3.5 Verify Backend

Open browser or use curl:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Abaya Bank API is running",
  "timestamp": "2025-12-28T00:00:00.000Z"
}
```

## Part 4: Frontend Setup

### 4.1 Install Dependencies

```bash
cd frontend
npm install
```

### 4.2 Configure Environment Variables

Create `.env` file in `frontend/` directory:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 4.3 Start Frontend Development Server

```bash
npm run dev
```

Frontend will run on: `http://localhost:3000`

## Part 5: Create Initial Data

### 5.1 Register Admin User

1. Open browser: `http://localhost:3000/register`
2. Fill registration form with admin email
3. Complete registration

### 5.2 Upgrade User to Admin Role

Since the first user needs to be admin, update manually in MongoDB:

```bash
mongosh
use abaya-bank
db.users.updateOne(
  { email: "admin@abayabank.com" },
  { $set: { role: "admin" } }
)
```

### 5.3 Create Test Accounts

1. Login as admin or customer
2. Navigate to Accounts section
3. Create test accounts:
   - Savings Account with $5000
   - Student Account with $1000
   - FDR Account with $10000

## Part 6: Testing the Application

### 6.1 Test Customer Features

1. **Login:** `http://localhost:3000/login`
2. **Create Account:** Create a savings account
3. **Deposit:** Deposit $500
4. **Withdraw:** Withdraw $100
5. **Transfer:** Transfer $50 to another account
6. **Apply for Loan:** Submit loan application
7. **Download Receipt:** Download transaction PDF

### 6.2 Test Admin Features

1. **Login as Admin**
2. **View Analytics:** Check dashboard
3. **Manage Users:** View all users
4. **Freeze Account:** Freeze a test account
5. **Approve Loan:** Approve pending loan
6. **Reverse Transaction:** Reverse a transaction
7. **View Audit Logs:** Check admin actions

## Part 7: Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
Solution: Ensure MongoDB is running
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Firebase Authentication Error:**
```
Error: Firebase Admin SDK initialization failed
```
Solution: 
- Verify Firebase credentials in `.env`
- Ensure private key is properly formatted with `\n`
- Check service account permissions

**Port Already in Use:**
```
Error: listen EADDRINUSE: address already in use :::5000
```
Solution: Kill process or change PORT in `.env`
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### Frontend Issues

**API Connection Error:**
```
Error: Network Error
```
Solution:
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in `.env`
- Verify CORS settings in backend

**Firebase Auth Error:**
```
Error: Firebase: Error (auth/invalid-api-key)
```
Solution:
- Verify Firebase config in `.env`
- Ensure all VITE_ variables are set
- Restart development server after .env changes

## Part 8: Production Deployment

### 8.1 Backend Deployment (Example: Heroku)

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create abaya-bank-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=<your-mongodb-atlas-uri>
heroku config:set FIREBASE_PROJECT_ID=<your-project-id>
# ... set all other env variables

# Deploy
git push heroku main
```

### 8.2 Frontend Deployment (Example: Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Set environment variables in Vercel dashboard
# Update VITE_API_URL to production backend URL
```

### 8.3 MongoDB Atlas (Production Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Set up database user
4. Whitelist IP addresses
5. Get connection string
6. Update `MONGODB_URI` in backend `.env`

## Part 9: Development Tips

### Useful Commands

**Backend:**
```bash
# Install new package
npm install package-name

# Run tests
npm test

# Check logs
tail -f logs/combined.log

# Format code
npm run lint
```

**Frontend:**
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Check bundle size
npm run build -- --analyze
```

### Database Management

**View Collections:**
```bash
mongosh
use abaya-bank
show collections
db.users.find().pretty()
db.accounts.find().pretty()
```

**Backup Database:**
```bash
mongodump --db abaya-bank --out ./backup
```

**Restore Database:**
```bash
mongorestore --db abaya-bank ./backup/abaya-bank
```

## Part 10: Next Steps

1. **Implement Full Frontend Pages:** Complete all dashboard and management pages
2. **Add Tests:** Write unit and integration tests
3. **Enhance Security:** Implement 2FA, rate limiting improvements
4. **Add Features:** Notifications, document upload, mobile app
5. **Performance:** Add caching, optimize queries
6. **Monitoring:** Set up logging, error tracking (Sentry)
7. **Documentation:** API documentation with Swagger

## Support

For issues or questions:
- Check [API Documentation](./API.md)
- Review error logs in `backend/logs/`
- Check browser console for frontend errors

---

**Built with ❤️ by Abaya Bank Team**
