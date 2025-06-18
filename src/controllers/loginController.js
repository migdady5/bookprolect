const admin = require('../helpers/firebaseadmin');
const fetch = require('node-fetch');

async function loginUser(email, password) {
  const firebaseApiKey = process.env.FIREBASE_API_KEY;
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error.message || 'Invalid credentials');
  }

  const userId = data.localId;

  // Check doctors collection first
  const doctorDoc = await admin.firestore().collection('doctors').doc(userId).get();
  if (doctorDoc.exists) {
    return {
      token: data.idToken,
      role: 'doctor',
      user: doctorDoc.data(),
      userId,
    };
  }

  // Else check patients collection
  const patientDoc = await admin.firestore().collection('patients').doc(userId).get();
  if (patientDoc.exists) {
    return {
      token: data.idToken,
      role: 'patient',
      user: patientDoc.data(),
      userId,
    };
  }

  throw new Error('User profile not found in doctors or patients collections');
}

module.exports = {
  loginUser
};
