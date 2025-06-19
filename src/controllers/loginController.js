const admin = require('../helpers/firebaseadmin');
const fetch = require('node-fetch');

async function loginUser(email, password) {
  const firebaseApiKey = process.env.FIREBASE_API_KEY;

  // Step 1: Sign in with Firebase Auth REST API
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
    throw new Error(data.error?.message || 'Invalid credentials');
  }

  const userId = data.localId;
  const idToken = data.idToken;

  console.log(`✅ Firebase Auth login successful - UID: ${userId}`);

  // Step 2: Check "Doctors" collection by email
  const doctorSnapshot = await admin
    .firestore()
    .collection('Doctors')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (!doctorSnapshot.empty) {
    const doctorDoc = doctorSnapshot.docs[0];
    return {
      token: idToken,
      role: 'doctor',
      user: doctorDoc.data(),
      userId,
    };
  }

  // Step 3: Check "patients" collection by email
  const patientSnapshot = await admin
    .firestore()
    .collection('patients')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (!patientSnapshot.empty) {
    const patientDoc = patientSnapshot.docs[0];
    return {
      token: idToken,
      role: 'patient',
      user: patientDoc.data(),
      userId,
    };
  }

  throw new Error(data.error?.message || 'Invalid credentials');
}

module.exports = {
  loginUser
};
