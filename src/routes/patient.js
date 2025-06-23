const express = require('express');

const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken, requireDoctorOrAdmin, authMiddleware } = require('../middleware/authMiddleware');

// Apply authentication and role check to all patient routes
router.use(authenticateToken);
router.use(requireDoctorOrAdmin);

// GET /api/patients - Get all patients (doctors and admins only)
router.get('/', patientController.getAllPatients);

// GET /api/patients/:id - Get specific patient
router.get('/:id', patientController.getPatientById);

// GET /api/patients/:id/full - Get patient with full history
router.get('/:id/full', patientController.getPatientWithHistory);

// POST /api/patients - Create new patient
router.post('/', patientController.createPatient);

// PUT /api/patients/:id - Update patient
router.put('/:id', patientController.updatePatient);

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', patientController.deletePatient);

// POST /api/patients/:id/history - Add medical record
router.post('/:id/history', authMiddleware, patientController.addPatientHistory);

// GET /api/patients/username/:username - Get patient by username
router.get('/username/:username', patientController.getPatientByUsername);

module.exports = router;
