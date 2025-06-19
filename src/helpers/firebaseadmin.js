const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Helper function to check if all required env vars exist
function isEnvServiceAccountAvailable() {
  return (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

let firebaseConfig;

if (isEnvServiceAccountAvailable()) {
  // Load from environment variables
  firebaseConfig = {
    credential: admin.credential.cert({
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    }),
  };
  console.log('✅ Firebase Admin initialized from environment variables');
} else {
  // Fallback to serviceAccountKey.json
  const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = require(serviceAccountPath);
      firebaseConfig = {
        credential: admin.credential.cert(serviceAccount),
      };
      console.log('✅ Firebase Admin initialized from serviceAccountKey.json');
    } catch (error) {
      console.error('❌ Error loading service account key file:', error);
      process.exit(1);
    }
  } else {
    console.error('❌ Firebase credentials not found in env or serviceAccountKey.json');
    process.exit(1);
  }
}

if (!admin.apps.length) {
  try {
    admin.initializeApp(firebaseConfig);
    console.log('🚀 Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    throw error;
  }
}

module.exports = admin;
