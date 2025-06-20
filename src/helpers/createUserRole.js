const admin = require('./firebaseadmin');
const db = admin.firestore();

/**
 * Create a user document in Firestore with role assignment
 * @param {string} uid - Firebase Auth UID
 * @param {string} email - User email
 * @param {string} role - 'doctor', 'admin', or 'patient'
 * @param {object} additionalData - Additional user data
 */
async function createUserWithRole(uid, email, role, additionalData = {}) {
  try {
    console.log(`🔄 Creating user document for ${email} with role ${role}`);
    
    // Filter out undefined values from additionalData
    const filteredData = Object.fromEntries(
      Object.entries(additionalData).filter(([_, value]) => value !== undefined)
    );
    
    const userData = {
      email: email,
      authId: uid, // This links the Firestore document to Firebase Auth
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...filteredData
    };

    // Determine which collection to use based on role
    // Doctors and admins go to 'Doctors' collection, patients go to 'Patients' collection
    const collectionName = (role === 'doctor' || role === 'admin') ? 'Doctors' : 'Patients';
    
    // Check if user already exists
    const existingUser = await db.collection(collectionName)
      .where('authId', '==', uid)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      console.log(`⚠️ User ${email} already exists in ${collectionName}`);
      return {
        success: false,
        message: 'User already exists',
        user: existingUser.docs[0].data()
      };
    }

    // Create the user document
    const userRef = await db.collection(collectionName).add(userData);
    const newUser = await userRef.get();

    console.log(`✅ User ${email} created successfully in ${collectionName}`);
    
    return {
      success: true,
      message: 'User created successfully',
      userId: newUser.id,
      user: {
        id: newUser.id,
        ...newUser.data()
      }
    };

  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
}

/**
 * Create a doctor user
 */
async function createDoctor(uid, email, doctorData = {}) {
  // Filter out undefined values
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
  
  return await createUserWithRole(uid, email, 'doctor', defaultData);
}

/**
 * Create an admin user
 */
async function createAdmin(uid, email, adminData = {}) {
  // Filter out undefined values
  const filteredData = Object.fromEntries(
    Object.entries(adminData).filter(([_, value]) => value !== undefined)
  );
  
  const defaultData = {
    name: filteredData.name || 'Admin ' + email.split('@')[0],
    permissions: filteredData.permissions || ['read', 'write', 'delete'],
    ...filteredData
  };
  
  return await createUserWithRole(uid, email, 'admin', defaultData);
}

/**
 * Get user role from Firestore
 */
async function getUserRole(uid) {
  try {
    // Check Doctors collection (includes both doctors and admins)
    const doctorSnap = await db.collection('Doctors')
      .where('authId', '==', uid)
      .limit(1)
      .get();

    if (!doctorSnap.empty) {
      const userData = doctorSnap.docs[0].data();
      
      // Check if this is an admin (has role field set to 'admin')
      if (userData.role === 'admin') {
        return {
          role: 'admin',
          profile: userData
        };
      }
      
      // Otherwise, it's a doctor
      return {
        role: 'doctor',
        profile: userData
      };
    }

    // Check Patients collection (only for patients)
    const patientSnap = await db.collection('Patients')
      .where('authId', '==', uid)
      .limit(1)
      .get();

    if (!patientSnap.empty) {
      return {
        role: 'patient',
        profile: patientSnap.docs[0].data()
      };
    }

    return null; // User not found
  } catch (error) {
    console.error('Error getting user role:', error);
    throw error;
  }
}

module.exports = {
  createUserWithRole,
  createDoctor,
  createAdmin,
  getUserRole
}; 