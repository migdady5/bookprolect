const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { createDoctor, createAdmin, getUserRole } = require('../helpers/createUserRole');
const admin = require('../helpers/firebaseadmin');

// This route doesn't require role check since we're setting up roles
router.post('/assign-role', authenticateToken, async (req, res) => {
  try {
    const { email, role, additionalData } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({
        error: 'Email and role are required'
      });
    }

    if (!['doctor', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Role must be either "doctor" or "admin"'
      });
    }

    console.log(`🔄 Assigning role ${role} to ${email}`);

    // Get the user from Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      return res.status(404).json({
        error: 'User not found in Firebase Auth',
        message: 'Make sure the user exists in Firebase Authentication'
      });
    }

    // Check if user already has a role
    const existingRole = await getUserRole(userRecord.uid);
    if (existingRole) {
      return res.status(409).json({
        error: 'User already has a role',
        currentRole: existingRole.role,
        message: 'User already exists in the system'
      });
    }

    // Create user document with role
    let result;
    if (role === 'doctor') {
      result = await createDoctor(userRecord.uid, email, additionalData);
    } else if (role === 'admin') {
      result = await createAdmin(userRecord.uid, email, additionalData);
    }

    return res.status(201).json({
      message: 'Role assigned successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        role: role,
        ...result.user
      }
    });

  } catch (error) {
    console.error('❌ Error assigning role:', error);
    return res.status(500).json({
      error: 'Failed to assign role',
      message: error.message
    });
  }
});

// Get current user's role
router.get('/my-role', authenticateToken, async (req, res) => {
  try {
    const userRole = await getUserRole(req.user.uid);
    
    if (!userRole) {
      return res.status(404).json({
        error: 'No role assigned',
        message: 'User exists in Firebase Auth but has no role assigned',
        uid: req.user.uid,
        suggestions: [
          'Use /api/admin/assign-role to assign a role',
          'Contact administrator to get role assigned'
        ]
      });
    }

    return res.json({
      message: 'Role found',
      user: {
        uid: req.user.uid,
        role: userRole.role,
        profile: userRole.profile
      }
    });

  } catch (error) {
    console.error('❌ Error getting user role:', error);
    return res.status(500).json({
      error: 'Failed to get user role',
      message: error.message
    });
  }
});

// List all users with roles
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const db = admin.firestore();
    
    // Get all doctors
    const doctorsSnap = await db.collection('Doctors').get();
    const doctors = [];
    doctorsSnap.forEach(doc => {
      doctors.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Get all patients
    const patientsSnap = await db.collection('Patients').get();
    const patients = [];
    patientsSnap.forEach(doc => {
      patients.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.json({
      message: 'Users retrieved successfully',
      doctors: {
        count: doctors.length,
        users: doctors
      },
      patients: {
        count: patients.length,
        users: patients
      }
    });

  } catch (error) {
    console.error('❌ Error listing users:', error);
    return res.status(500).json({
      error: 'Failed to list users',
      message: error.message
    });
  }
});

module.exports = router; 