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

  // Step 2: Check "Doctors" collection (includes both doctors and admins) by authId first, then by email
  let doctorSnapshot = await admin
    .firestore()
    .collection('Doctors')
    .where('authId', '==', userId)
    .limit(1)
    .get();

  if (doctorSnapshot.empty) {
    // Fallback: check by email
    doctorSnapshot = await admin
      .firestore()
      .collection('Doctors')
      .where('email', '==', email)
      .limit(1)
      .get();
  }

  if (!doctorSnapshot.empty) {
    const doctorDoc = doctorSnapshot.docs[0];
    const doctorData = doctorDoc.data();
    
    // If user was found by email but doesn't have authId, add it
    if (!doctorData.authId) {
      console.log(`🔄 Adding authId to existing doctor document for ${email}`);
      await admin.firestore()
        .collection('Doctors')
        .doc(doctorDoc.id)
        .update({ authId: userId });
      
      doctorData.authId = userId;
    }
    
    // Determine role based on the role field in the document
    const userRole = doctorData.role || 'doctor'; // Default to doctor if no role specified
    
    return {
      token: idToken,
      role: userRole, // This will be 'doctor' or 'admin'
      user: doctorData,
      userId,
    };
  }

  // Step 3: Check "Patients" collection (only for patients) by authId first, then by email
  let patientSnapshot = await admin
    .firestore()
    .collection('Patients')
    .where('authId', '==', userId)
    .limit(1)
    .get();

  if (patientSnapshot.empty) {
    // Fallback: check by email
    patientSnapshot = await admin
      .firestore()
      .collection('Patients')
      .where('email', '==', email)
      .limit(1)
      .get();
  }

  if (!patientSnapshot.empty) {
    const patientDoc = patientSnapshot.docs[0];
    const patientData = patientDoc.data();
    
    // If user was found by email but doesn't have authId, add it
    if (!patientData.authId) {
      console.log(`🔄 Adding authId to existing patient document for ${email}`);
      await admin.firestore()
        .collection('Patients')
        .doc(patientDoc.id)
        .update({ authId: userId });
      
      patientData.authId = userId;
    }
    
    return {
      token: idToken,
      role: 'patient',
      user: patientData,
      userId,
    };
  }

  // Step 4: Check for admin custom claims (legacy fallback)
  try {
    const userRecord = await admin.auth().getUser(userId);
    if (userRecord.customClaims?.role === "admin") {
      return {
        token: idToken,
        role: 'admin',
        user: { 
          email: userRecord.email,
          authId: userId,
          role: 'admin'
        },
        userId,
      };
    }
  } catch (error) {
    console.error('Error checking admin claims:', error);
  }

  // User not found in any collection
  console.log(`❌ User ${email} (UID: ${userId}) not found in Firestore collections`);
  
  // Provide helpful error message
  throw new Error('User exists in Firebase Auth but has no role assigned. Please use /api/admin/assign-role to assign a role or /api/signup to create a new account with role.');
}

module.exports = {
  loginUser
};
