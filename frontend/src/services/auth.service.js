import api from './api';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../utils/firebase';

/**
 * Register new user
 */
export const register = async (userData) => {
  const { email, password, name, phone, nidOrPassport } = userData;
  
  // Create user in Firebase
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  // Register user in backend
  const response = await api.post('/auth/register', {
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email,
    name,
    phone,
    nidOrPassport
  });
  
  return response;
};

/**
 * Login user
 */
export const login = async (email, password) => {
  // Sign in with Firebase
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  
  // Verify token with backend
  const response = await api.post('/auth/verify', {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return response;
};

/**
 * Logout user
 */
export const logout = async () => {
  await firebaseSignOut(auth);
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response;
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email) => {
  await firebaseSendPasswordResetEmail(auth, email);
};

/**
 * Verify Firebase token
 */
export const verifyToken = async () => {
  const response = await api.post('/auth/verify');
  return response;
};
