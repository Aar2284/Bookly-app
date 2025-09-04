// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase config (these would normally be environment variables)
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "bookly-app-demo.firebaseapp.com",
  projectId: "bookly-app-demo",
  storageBucket: "bookly-app-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;