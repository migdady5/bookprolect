const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let firebaseConfig;

// Try to load from service account key file
const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    firebaseConfig = {
      credential: admin.credential.cert(serviceAccount)
    };
    console.log('Firebase Admin initialized from service account key file');
  } catch (error) {
    console.error('Error loading service account key file:', error);
    process.exit(1);
  }
} else {
  console.error('serviceAccountKey.json not found in project root');
  console.error('Please ensure the Firebase service account key file exists');
  process.exit(1);
}

if (!admin.apps.length) {
  try {
    admin.initializeApp(firebaseConfig);
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

module.exports = admin;
