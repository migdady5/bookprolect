const admin = require('../helpers/firebaseadmin');
const db = admin.firestore();

// GET /api/patients - Get all patients
exports.getAllPatients = async (req, res) => {
  try {
    console.log(`🔍 ${req.user.role} ${req.user.profile.name || req.user.profile.email} fetching all patients`);
    
    const patientsSnapshot = await db.collection('Patients').get();
    const patients = [];
    
    patientsSnapshot.forEach(doc => {
      patients.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.status(200).json({
      message: 'Patients retrieved successfully',
      count: patients.length,
      patients: patients,
      accessedBy: {
        role: req.user.role,
        name: req.user.profile.name || req.user.profile.email
      }
    });
  } catch (error) {
    console.error('❌ Error fetching patients:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// GET /api/patients/:id - Get specific patient
exports.getPatientById = async (req, res) => {
  try {
    const patientId = req.params.id;
    console.log(`🔍 ${req.user.role} ${req.user.profile.name || req.user.profile.email} fetching patient ${patientId}`);
    
    const patientDoc = await db.collection('Patients').doc(patientId).get();

    if (!patientDoc.exists) {
      return res.status(404).json({ 
        message: 'Patient not found',
        patientId: patientId
      });
    }

    return res.status(200).json({
      message: 'Patient retrieved successfully',
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
    console.error('❌ Error fetching patient:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// POST /api/patients - Create new patient
exports.createPatient = async (req, res) => {
  try {
    const { name, email, phone, dateOfBirth, address, medicalHistory } = req.body;
    
    console.log(`➕ ${req.user.role} ${req.user.profile.name || req.user.profile.email} creating new patient`);
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        message: 'Name and email are required' 
      });
    }

    // Check if patient with this email already exists
    const existingPatient = await db.collection('Patients')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingPatient.empty) {
      return res.status(409).json({ 
        message: 'Patient with this email already exists' 
      });
    }

    const patientData = {
      name,
      email,
      phone: phone || null,
      dateOfBirth: dateOfBirth || null,
      address: address || null,
      medicalHistory: medicalHistory || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid,
      createdByRole: req.user.role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const patientRef = await db.collection('Patients').add(patientData);
    const newPatient = await patientRef.get();

    return res.status(201).json({
      message: 'Patient created successfully',
      patient: {
        id: newPatient.id,
        ...newPatient.data()
      },
      createdBy: {
        role: req.user.role,
        name: req.user.profile.name || req.user.profile.email
      }
    });
  } catch (error) {
    console.error('❌ Error creating patient:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// GET /api/patients/:id/full - Get patient with full history
exports.getPatientWithHistory = async (req, res) => {
  try {
    const patientId = req.params.id;

    console.log(`📋 ${req.user.role} ${req.user.profile.name || req.user.profile.email} fetching full profile for patient ${patientId}`);

    // Get patient doc
    const patientDoc = await db.collection('Patients').doc(patientId).get();
    if (!patientDoc.exists) {
      return res.status(404).json({ message: 'Patient not found', patientId });
    }

    // Get history records
    const historySnapshot = await db.collection('patint_history')
      .where('patient_id', '==', patientId)
      .get();

    const history = [];
    historySnapshot.forEach(doc => {
      history.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({
      message: 'Full patient profile retrieved',
      patient: {
        id: patientDoc.id,
        ...patientDoc.data()
      },
      history,
      accessedBy: {
        role: req.user.role,
        name: req.user.profile.name || req.user.profile.email
      }
    });
  } catch (error) {
    console.error('❌ Error fetching full patient profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/patients/:id - Update patient
exports.updatePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { name, email, phone, dateOfBirth, address, medicalHistory } = req.body;
    
    console.log(`✏️ ${req.user.role} ${req.user.profile.name || req.user.profile.email} updating patient ${patientId}`);
    
    // Check if patient exists
    const patientDoc = await db.collection('Patients').doc(patientId).get();
    
    if (!patientDoc.exists) {
      return res.status(404).json({ 
        message: 'Patient not found',
        patientId: patientId
      });
    }

    // Check if email is being changed and if it conflicts with existing patient
    if (email && email !== patientDoc.data().email) {
      const existingPatient = await db.collection('Patients')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!existingPatient.empty) {
        return res.status(409).json({ 
          message: 'Patient with this email already exists' 
        });
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone !== undefined && { phone }),
      ...(dateOfBirth !== undefined && { dateOfBirth }),
      ...(address !== undefined && { address }),
      ...(medicalHistory !== undefined && { medicalHistory }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.uid,
      updatedByRole: req.user.role
    };

    await db.collection('Patients').doc(patientId).update(updateData);
    
    // Get updated patient data
    const updatedPatient = await db.collection('Patients').doc(patientId).get();

    return res.status(200).json({
      message: 'Patient updated successfully',
      patient: {
        id: updatedPatient.id,
        ...updatedPatient.data()
      },
      updatedBy: {
        role: req.user.role,
        name: req.user.profile.name || req.user.profile.email
      }
    });
  } catch (error) {
    console.error('❌ Error updating patient:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// DELETE /api/patients/:id - Delete patient
exports.deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    console.log(`🗑️ ${req.user.role} ${req.user.profile.name || req.user.profile.email} deleting patient ${patientId}`);
    
    // Check if patient exists
    const patientDoc = await db.collection('Patients').doc(patientId).get();
    
    if (!patientDoc.exists) {
      return res.status(404).json({ 
        message: 'Patient not found',
        patientId: patientId
      });
    }

    await db.collection('Patients').doc(patientId).delete();

    return res.status(200).json({
      message: 'Patient deleted successfully',
      patientId: patientId,
      deletedBy: {
        role: req.user.role,
        name: req.user.profile.name || req.user.profile.email
      }
    });
  } catch (error) {
    console.error('❌ Error deleting patient:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// POST /api/patients/:id/history - Add medical record
exports.addPatientHistory = async (req, res) => {
  try {
    const patientId = req.params.id;
    const {
      diag,
      treatment,
      notes,
      cost,
      payment_method,
      doctor_name,
      attachments
    } = req.body;

    if (!diag || !treatment || !cost || !payment_method || !doctor_name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const historyData = {
      diag,
      treatment,
      notes: notes || '',
      cost,
      payment_method,
      doctor_name,
      attachments: attachments || null,
      patient_id: patientId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid
    };

    const docRef = await db.collection('patint_history').add(historyData);

    return res.status(201).json({
      message: 'History record added',
      id: docRef.id,
      data: historyData
    });

  } catch (error) {
    console.error('❌ Error adding patient history:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/patients/username/:username - Get patient by username
exports.getPatientByUsername = async (req, res) => {
  try {
    const username = req.params.username.trim();
    console.log(req.params.username);

    console.log(`🔍 ${req.user.role} ${req.user.profile.name || req.user.profile.email} fetching patient by username: ${username}`);

    const patientsRef = db.collection('Patients');
    const snapshot = await patientsRef.where('username', '==', username).get();

    if (snapshot.empty) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patients = [];
    snapshot.forEach(doc => {
      patients.push({ id: doc.id, ...doc.data() });
    });

    return res.status(200).json({ 
      message: 'Patient(s) found by username',
      patients,
      accessedBy: {
        role: req.user.role,
        name: req.user.profile.name || req.user.profile.email
      }
    });
  } catch (error) {
    console.error('❌ Error fetching patient by username:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
