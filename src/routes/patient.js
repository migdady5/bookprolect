const express = require('express');
const router = express.Router();
const {
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getAllPatients
} = require('../controllers/patientController');
const { authenticateToken, requireDoctorOrAdmin } = require('../middleware/authMiddleware');

// Apply authentication and role check to all patient routes
router.use(authenticateToken);
router.use(requireDoctorOrAdmin);

// GET /api/patients - Get all patients (doctors and admins only)
router.get('/', getAllPatients);

// GET /api/patients/:id - Get specific patient
router.get('/:id', getPatientById);

// POST /api/patients - Create new patient
router.post('/', createPatient);

// PUT /api/patients/:id - Update patient
router.put('/:id', updatePatient);

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', deletePatient);

module.exports = router;
