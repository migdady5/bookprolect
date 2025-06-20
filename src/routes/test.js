const express = require('express');
const router = express.Router();
const { authenticateToken, requireDoctorOrAdmin } = require('../middleware/authMiddleware');

// Test endpoint to verify authentication
router.get('/auth-test', authenticateToken, requireDoctorOrAdmin, (req, res) => {
  res.json({
    message: 'Authentication successful!',
    user: {
      uid: req.user.uid,
      role: req.user.role,
      name: req.user.profile.name || req.user.profile.email
    },
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to get a specific patient (for testing)
router.get('/patient/:id', authenticateToken, requireDoctorOrAdmin, async (req, res) => {
  try {
    const patientId = req.params.id;
    const admin = require('../helpers/firebaseadmin');
    const db = admin.firestore();
    
    console.log(`🔍 Testing: ${req.user.role} ${req.user.profile.name || req.user.profile.email} accessing patient ${patientId}`);
    
    const patientDoc = await db.collection('patients').doc(patientId).get();
    
    if (!patientDoc.exists) {
      return res.status(404).json({
        message: 'Patient not found',
        patientId: patientId,
        authenticatedUser: {
          role: req.user.role,
          name: req.user.profile.name || req.user.profile.email
        }
      });
    }
    
    res.json({
      message: 'Patient access successful!',
      patient: {
        id: patientDoc.id,
        ...patientDoc.data()
      },
      accessedBy: {
        role: req.user.role,
        name: req.user.profile.name || req.user.profile.email
      }
    });
    
  } catch (error) {
    console.error('❌ Error in test patient access:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

module.exports = router; 