const admin = require('./firebaseadmin');

/**
 * Helper function to fix user data by adding authId field
 * This should be run once to migrate existing users
 */
async function fixUserData() {
  const db = admin.firestore();
  
  try {
    console.log('🔧 Starting user data fix...');
    
    // Fix Doctors collection
    console.log('🔍 Checking Doctors collection...');
    const doctorsSnapshot = await db.collection('Doctors').get();
    
    for (const doc of doctorsSnapshot.docs) {
      const doctorData = doc.data();
      
      if (!doctorData.authId && doctorData.email) {
        console.log(`🔧 Fixing doctor: ${doctorData.email}`);
        
        try {
          // Get Firebase Auth user by email
          const userRecord = await admin.auth().getUserByEmail(doctorData.email);
          
          // Update the document with authId
          await doc.ref.update({
            authId: userRecord.uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`✅ Fixed doctor: ${doctorData.email} -> ${userRecord.uid}`);
        } catch (error) {
          console.log(`❌ Could not find Firebase Auth user for: ${doctorData.email}`);
        }
      }
    }
    
    // Fix patients collection
    console.log('🔍 Checking patients collection...');
    const patientsSnapshot = await db.collection('patients').get();
    
    for (const doc of patientsSnapshot.docs) {
      const patientData = doc.data();
      
      if (!patientData.authId && patientData.email) {
        console.log(`🔧 Fixing patient: ${patientData.email}`);
        
        try {
          // Get Firebase Auth user by email
          const userRecord = await admin.auth().getUserByEmail(patientData.email);
          
          // Update the document with authId
          await doc.ref.update({
            authId: userRecord.uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`✅ Fixed patient: ${patientData.email} -> ${userRecord.uid}`);
        } catch (error) {
          console.log(`❌ Could not find Firebase Auth user for: ${patientData.email}`);
        }
      }
    }
    
    console.log('✅ User data fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing user data:', error);
  }
}

/**
 * Helper function to create a test user
 */
async function createTestUser() {
  const db = admin.firestore();
  
  try {
    console.log('👤 Creating test user...');
    
    // First, create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: 'testdoctor@example.com',
      password: 'password123',
      displayName: 'Test Doctor'
    });
    
    console.log(`✅ Created Firebase Auth user: ${userRecord.uid}`);
    
    // Then, create Firestore document
    const doctorData = {
      name: 'Test Doctor',
      email: 'testdoctor@example.com',
      specialty: 'General Medicine',
      authId: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('Doctors').add(doctorData);
    console.log(`✅ Created Firestore document: ${docRef.id}`);
    
    return {
      uid: userRecord.uid,
      email: 'testdoctor@example.com',
      password: 'password123',
      firestoreId: docRef.id
    };
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

module.exports = {
  fixUserData,
  createTestUser
}; 