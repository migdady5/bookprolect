const express = require('express');
const router = express.Router();
const { 
  signupUser, 
  signupDoctor, 
  signupAdmin, 
  signupPatient 
} = require('../controllers/signupController');

// Helper function to filter out undefined values
function filterUndefinedValues(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  );
}

// Generic signup with role
router.post('/', async (req, res) => {
  try {
    const { email, password, role, ...userData } = req.body;

    // Validate required fields
    if (!email || !password || !role) {
      return res.status(400).json({
        error: 'Email, password, and role are required'
      });
    }

    // Validate role
    if (!['doctor', 'admin', 'patient'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be doctor, admin, or patient'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    // Filter out undefined values
    const filteredUserData = filterUndefinedValues(userData);

    const result = await signupUser(email, password, role, filteredUserData);

    res.status(201).json({
      message: 'User created successfully',
      token: result.token,
      user: result.user
    });

  } catch (error) {
    console.error('❌ Signup error:', error);
    
    // Handle specific Firebase errors
    if (error.message.includes('EMAIL_EXISTS')) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }
    
    if (error.message.includes('WEAK_PASSWORD')) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password is too weak. Use at least 6 characters'
      });
    }
    
    if (error.message.includes('INVALID_EMAIL')) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    res.status(500).json({
      error: 'Failed to create user',
      message: error.message
    });
  }
});

// Sign up a doctor
router.post('/doctor', async (req, res) => {
  try {
    const { email, password, name, specialty, phone, licenseNumber, ...otherData } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    const doctorData = filterUndefinedValues({
      name,
      specialty,
      phone,
      licenseNumber,
      ...otherData
    });

    const result = await signupDoctor(email, password, doctorData);

    res.status(201).json({
      message: 'Doctor account created successfully',
      token: result.token,
      user: result.user
    });

  } catch (error) {
    console.error('❌ Doctor signup error:', error);
    
    if (error.message.includes('EMAIL_EXISTS')) {
      return res.status(409).json({
        error: 'Doctor already exists',
        message: 'An account with this email already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to create doctor account',
      message: error.message
    });
  }
});

// Sign up an admin
router.post('/admin', async (req, res) => {
  try {
    const { email, password, name, permissions, ...otherData } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    const adminData = filterUndefinedValues({
      name,
      permissions,
      ...otherData
    });

    const result = await signupAdmin(email, password, adminData);

    res.status(201).json({
      message: 'Admin account created successfully',
      token: result.token,
      user: result.user
    });

  } catch (error) {
    console.error('❌ Admin signup error:', error);
    
    if (error.message.includes('EMAIL_EXISTS')) {
      return res.status(409).json({
        error: 'Admin already exists',
        message: 'An account with this email already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to create admin account',
      message: error.message
    });
  }
});

// Sign up a patient
router.post('/patient', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      phone, 
      dateOfBirth, 
      address, 
      medicalHistory, 
      ...otherData 
    } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    const patientData = filterUndefinedValues({
      name,
      phone,
      dateOfBirth,
      address,
      medicalHistory,
      ...otherData
    });

    const result = await signupPatient(email, password, patientData);

    res.status(201).json({
      message: 'Patient account created successfully',
      token: result.token,
      user: result.user
    });

  } catch (error) {
    console.error('❌ Patient signup error:', error);
    
    if (error.message.includes('EMAIL_EXISTS')) {
      return res.status(409).json({
        error: 'Patient already exists',
        message: 'An account with this email already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to create patient account',
      message: error.message
    });
  }
});

module.exports = router; 