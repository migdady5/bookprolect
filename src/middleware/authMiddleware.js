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

    // Check if the user is a doctor or admin in the Doctors collection
    const doctorSnap = await db.collection("Doctors")
      .where("authId", "==", uid)
      .limit(1)
      .get();

    if (!doctorSnap.empty) {
      const userData = doctorSnap.docs[0].data();
      
      // Determine role based on the role field in the document
      const userRole = userData.role || 'doctor'; // Default to doctor if no role specified
      
      req.user = {
        uid,
        role: userRole, // This will be 'doctor' or 'admin'
        profile: userData
      };
      return next();
    }

    // Check if the user is a patient in the Patients collection
    const patientSnap = await db.collection("Patients")
      .where("authId", "==", uid)
      .limit(1)
      .get();

    if (!patientSnap.empty) {
      const userData = patientSnap.docs[0].data();
      
      req.user = {
        uid,
        role: "patient",
        profile: userData
      };
      return next();
    }

    // Optional: Check if admin (from custom claim - legacy fallback)
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
      return res.status(403).json({ error: `Access denied: ${role} role required` });
    }

    next();
  };
};

// Middleware for patient routes - only doctors and admins can access
const requireDoctorOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "doctor" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied: Doctor or admin role required" });
  }

  next();
};

// Optional convenience exports
const requireDoctor = requireRole("doctor");
const requirePatient = requireRole("patient");
const requireAdmin = requireRole("admin");

module.exports = {
  authenticateToken,
  authMiddleware: authenticateToken, // Alias for backward compatibility
  requireRole,
  requireDoctor,
  requirePatient,
  requireAdmin,
  requireDoctorOrAdmin
};