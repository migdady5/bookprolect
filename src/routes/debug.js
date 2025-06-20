const express = require('express');
const router = express.Router();
const admin = require('../helpers/firebaseadmin');

// Debug endpoint to check authentication and user data
router.get('/auth-debug', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      error: "No token provided",
      message: "Include Authorization: Bearer <token> header"
    });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    console.log("🔍 Debugging authentication...");
    
    // Step 1: Verify the token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    console.log("✅ Token verified successfully");
    console.log("🔑 Firebase UID:", uid);
    console.log("📧 Email:", decodedToken.email);

    const db = admin.firestore();
    const debugInfo = {
      tokenVerified: true,
      firebaseUid: uid,
      email: decodedToken.email,
      searches: []
    };

    // Step 2: Check Doctors collection
    console.log("🔍 Searching in 'Doctors' collection...");
    const doctorSnap = await db.collection("Doctors")
      .where("authId", "==", uid)
      .limit(1)
      .get();

    debugInfo.searches.push({
      collection: "Doctors",
      query: "authId == " + uid,
      found: !doctorSnap.empty,
      count: doctorSnap.size
    });

    if (!doctorSnap.empty) {
      const doctorData = doctorSnap.docs[0].data();
      console.log("✅ Found in Doctors collection:", doctorData);
      return res.json({
        success: true,
        userType: "doctor",
        uid: uid,
        profile: doctorData,
        debugInfo: debugInfo
      });
    }

    // Step 3: Check patients collection
    console.log("🔍 Searching in 'patients' collection...");
    const patientSnap = await db.collection("patients")
      .where("authId", "==", uid)
      .limit(1)
      .get();

    debugInfo.searches.push({
      collection: "patients",
      query: "authId == " + uid,
      found: !patientSnap.empty,
      count: patientSnap.size
    });

    if (!patientSnap.empty) {
      const patientData = patientSnap.docs[0].data();
      console.log("✅ Found in patients collection:", patientData);
      return res.json({
        success: true,
        userType: "patient",
        uid: uid,
        profile: patientData,
        debugInfo: debugInfo
      });
    }

    // Step 4: Check for admin custom claims
    console.log("🔍 Checking for admin custom claims...");
    const userRecord = await admin.auth().getUser(uid);
    const isAdmin = userRecord.customClaims?.role === "admin";
    
    debugInfo.searches.push({
      collection: "Firebase Auth",
      query: "customClaims.role == admin",
      found: isAdmin,
      customClaims: userRecord.customClaims
    });

    if (isAdmin) {
      console.log("✅ Found admin user with custom claims");
      return res.json({
        success: true,
        userType: "admin",
        uid: uid,
        profile: { email: userRecord.email },
        debugInfo: debugInfo
      });
    }

    // Step 5: Search by email instead of authId
    console.log("🔍 Searching by email in all collections...");
    const email = decodedToken.email;
    
    // Search in Doctors collection by email
    const doctorByEmail = await db.collection("Doctors")
      .where("email", "==", email)
      .limit(1)
      .get();

    debugInfo.searches.push({
      collection: "Doctors",
      query: "email == " + email,
      found: !doctorByEmail.empty,
      count: doctorByEmail.size
    });

    if (!doctorByEmail.empty) {
      const doctorData = doctorByEmail.docs[0].data();
      console.log("⚠️ Found doctor by email but no authId field:", doctorData);
      return res.json({
        success: false,
        error: "User found by email but missing authId field",
        suggestion: "Add authId field to user document",
        uid: uid,
        email: email,
        foundData: doctorData,
        debugInfo: debugInfo
      });
    }

    // Search in patients collection by email
    const patientByEmail = await db.collection("patients")
      .where("email", "==", email)
      .limit(1)
      .get();

    debugInfo.searches.push({
      collection: "patients",
      query: "email == " + email,
      found: !patientByEmail.empty,
      count: patientByEmail.size
    });

    if (!patientByEmail.empty) {
      const patientData = patientByEmail.docs[0].data();
      console.log("⚠️ Found patient by email but no authId field:", patientData);
      return res.json({
        success: false,
        error: "User found by email but missing authId field",
        suggestion: "Add authId field to user document",
        uid: uid,
        email: email,
        foundData: patientData,
        debugInfo: debugInfo
      });
    }

    // Step 6: Show all collections for debugging
    console.log("🔍 Listing all collections...");
    const collections = await db.listCollections();
    const collectionNames = collections.map(col => col.id);
    
    debugInfo.collections = collectionNames;
    debugInfo.searches.push({
      collection: "All Collections",
      query: "List of available collections",
      found: collectionNames.length,
      collections: collectionNames
    });

    console.log("❌ User not found in any collection");
    return res.status(404).json({
      success: false,
      error: "User not found in system",
      uid: uid,
      email: email,
      debugInfo: debugInfo,
      suggestions: [
        "Create user document in Firestore with authId field",
        "Check if user exists in correct collection",
        "Verify Firebase Auth user exists"
      ]
    });

  } catch (error) {
    console.error("❌ Token verification failed:", error);
    return res.status(401).json({ 
      success: false,
      error: "Invalid or expired token",
      details: error.message
    });
  }
});

module.exports = router; 