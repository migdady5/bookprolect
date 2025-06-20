const admin = require('../helpers/firebaseadmin');
const fetch = require('node-fetch');
const { createDoctor, createAdmin, createUserWithRole } = require('../helpers/createUserRole');

/**
 * Sign up a new user with role assignment
 */
async function signupUser(email, password, role, userData = {}) {
  const firebaseApiKey = process.env.FIREBASE_API_KEY;

  if (!firebaseApiKey) {
    throw new Error('Firebase API key not configured');
  }

  // Validate role
  if (!['doctor', 'admin', 'patient'].includes(role)) {
    throw new Error('Invalid role. Must be doctor, admin, or patient');
  }

  try {
    console.log(`🔄 Creating new user: ${email} with role: ${role}`);

    // Step 1: Create user in Firebase Auth
    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          returnSecureToken: true 
        }),
      }
    );

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      throw new Error(authData.error?.message || 'Failed to create user in Firebase Auth');
    }

    const userId = authData.localId;
    const idToken = authData.idToken;

    console.log(`✅ Firebase Auth user created - UID: ${userId}`);

    // Step 2: Create user document in Firestore with role
    let userResult;
    
    if (role === 'doctor') {
      userResult = await createDoctor(userId, email, userData);
    } else if (role === 'admin') {
      userResult = await createAdmin(userId, email, userData);
    } else if (role === 'patient') {
      userResult = await createUserWithRole(userId, email, 'patient', userData);
    }

    if (!userResult.success) {
      // If Firestore creation fails, we should clean up the Firebase Auth user
      try {
        await admin.auth().deleteUser(userId);
        console.log(`🧹 Cleaned up Firebase Auth user after Firestore failure`);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup Firebase Auth user:', cleanupError);
      }
      throw new Error(userResult.message || 'Failed to create user document');
    }

    console.log(`✅ User document created in Firestore`);

    // Step 3: Return success response
    return {
      success: true,
      message: 'User created successfully',
      token: idToken,
      user: {
        uid: userId,
        email: email,
        role: role,
        ...userResult.user
      }
    };

  } catch (error) {
    console.error('❌ Error in signup:', error);
    throw error;
  }
}

/**
 * Sign up a doctor
 */
async function signupDoctor(email, password, doctorData = {}) {
  // Filter out undefined values and provide defaults
  const filteredData = Object.fromEntries(
    Object.entries(doctorData).filter(([_, value]) => value !== undefined)
  );
  
  const defaultData = {
    name: filteredData.name || 'Dr. ' + email.split('@')[0],
    specialty: filteredData.specialty || 'General Medicine',
    phone: filteredData.phone || '',
    licenseNumber: filteredData.licenseNumber || '',
    ...filteredData
  };

  return await signupUser(email, password, 'doctor', defaultData);
}

/**
 * Sign up an admin
 */
async function signupAdmin(email, password, adminData = {}) {
  // Filter out undefined values and provide defaults
  const filteredData = Object.fromEntries(
    Object.entries(adminData).filter(([_, value]) => value !== undefined)
  );
  
  const defaultData = {
    name: filteredData.name || 'Admin ' + email.split('@')[0],
    permissions: filteredData.permissions || ['read', 'write', 'delete'],
    ...filteredData
  };

  return await signupUser(email, password, 'admin', defaultData);
}

/**
 * Sign up a patient
 */
async function signupPatient(email, password, patientData = {}) {
  // Filter out undefined values and provide defaults
  const filteredData = Object.fromEntries(
    Object.entries(patientData).filter(([_, value]) => value !== undefined)
  );
  
  const defaultData = {
    name: filteredData.name || email.split('@')[0],
    phone: filteredData.phone || '',
    dateOfBirth: filteredData.dateOfBirth || null,
    address: filteredData.address || '',
    medicalHistory: filteredData.medicalHistory || [],
    ...filteredData
  };

  return await signupUser(email, password, 'patient', defaultData);
}

module.exports = {
  signupUser,
  signupDoctor,
  signupAdmin,
  signupPatient
}; 