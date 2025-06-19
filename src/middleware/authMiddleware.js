const admin = require('../helpers/firebaseadmin');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user data from Firestore
    const userId = decodedToken.uid;
    
    // Check doctors collection first
    const doctorDoc = await admin.firestore().collection('doctors').doc(userId).get();
    if (doctorDoc.exists) {
      req.user = {
        ...decodedToken,
        role: 'doctor',
        profile: doctorDoc.data()
      };
      return next();
    }

    // Check patients collection
    const patientDoc = await admin.firestore().collection('patients').doc(userId).get();
    if (patientDoc.exists) {
      req.user = {
        ...decodedToken,
        role: 'patient',
        profile: patientDoc.data()
      };
      return next();
    }

    return res.status(403).json({ error: 'User profile not found' });
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  authMiddleware,
  checkRole
};
