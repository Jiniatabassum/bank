require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Account = require('./models/Account');
const admin = require('firebase-admin');

// Firebase Admin SDK initialization
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const seedUsers = async () => {
  try {
    console.log('🌱 Starting seed process...');

    // Default users to create
    const defaultUsers = [
      {
        email: 'customer@abayabank.com',
        password: 'customer123',
        name: 'Default Customer',
        phone: '01712345678',
        nidOrPassport: '1234567890123',
        role: 'customer'
      },
      {
        email: 'admin@abayabank.com',
        password: 'admin123',
        name: 'Admin User',
        phone: '01798765432',
        nidOrPassport: '9876543210987',
        role: 'admin'
      }
    ];

    for (const userData of defaultUsers) {
      // Check if user already exists in MongoDB
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`✓ User ${userData.email} already exists`);
        continue;
      }

      // Create user in Firebase
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.name,
        });
        console.log(`✓ Firebase user created: ${userData.email}`);
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          // Get existing Firebase user
          firebaseUser = await admin.auth().getUserByEmail(userData.email);
          console.log(`✓ Firebase user already exists: ${userData.email}`);
        } else {
          throw error;
        }
      }

      // Create user in MongoDB
      const user = await User.create({
        firebaseUid: firebaseUser.uid,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        nidOrPassport: userData.nidOrPassport,
        role: userData.role,
        lastLogin: new Date()
      });

      console.log(`✓ MongoDB user created: ${userData.email}`);

      // Create a default account for customer
      if (userData.role === 'customer') {
        const account = await Account.create({
          userId: user._id,
          accountType: 'savings',
          balance: 50000, // Starting balance
          status: 'active'
        });
        console.log(`✓ Default account created for ${userData.email}: ${account.accountNumber}`);
      }
    }

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('📧 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Customer Account:');
    console.log('   Email: customer@abayabank.com');
    console.log('   Password: customer123');
    console.log('');
    console.log('👨‍💼 Admin Account:');
    console.log('   Email: admin@abayabank.com');
    console.log('   Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedUsers();
