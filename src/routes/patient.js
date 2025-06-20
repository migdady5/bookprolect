const express = require('express');
const router = express.Router();
const {
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');
const { authMiddleware } = require('../middleware/authMiddleware');

// GET /api/patients/:id
router.get('/:id', authMiddleware, getPatientById);

// POST /api/patients
router.post('/', authMiddleware, createPatient);

// PUT /api/patients/:id
router.put('/:id', authMiddleware, updatePatient);

// DELETE /api/patients/:id
router.delete('/:id', authMiddleware, deletePatient);

module.exports = router;
