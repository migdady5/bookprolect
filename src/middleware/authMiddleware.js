const admin = require('../helpers/firebaseadmin');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const db = admin.firestore();

    // Check if the user is a doctor
    const doctorSnap = await db.collection("Doctors")
      .where("authId", "==", uid)
      .limit(1)
      .get();

    if (!doctorSnap.empty) {
      const doctorData = doctorSnap.docs[0].data();
      req.user = {
        uid,
        role: "doctor",
        profile: doctorData
      };
      return next();
    }

    // Check if the user is a patient
    const patientSnap = await db.collection("patients")
      .where("authId", "==", uid)
      .limit(1)
      .get();

    if (!patientSnap.empty) {
      const patientData = patientSnap.docs[0].data();
      req.user = {
        uid,
        role: "patient",
        profile: patientData
      };
      return next();
    }
// Optional: Check if admin (from custom claim or separate collection)
    const userRecord = await admin.auth().getUser(uid);
    if (userRecord.customClaims?.role === "admin") {
      req.user = {
        uid,
        role: "admin",
        profile: { email: userRecord.email }
      };
      return next();
    }

    return res.status(403).json({ error: "User not found in system" });
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: "Access denied: ${role} role required" });
    }

    next();
  };
};

// Optional convenience exports
const requireDoctor = requireRole("doctor");
const requirePatient = requireRole("patient");
const requireAdmin = requireRole("admin");

module.exports = {
  authenticateToken,
  requireRole,
  requireDoctor,
  requirePatient,
  requireAdmin
};