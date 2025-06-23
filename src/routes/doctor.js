const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken, requireDoctorOrAdmin } = require('../middleware/authMiddleware');

// حماية الراوت
router.use(authenticateToken);
router.use(requireDoctorOrAdmin);

// GET doctor by ID
router.get('/:id', doctorController.getDoctorById);

// بعدين ممكن تضيف هون باقي الراوتات زي:
// router.post('/:id/schedule', doctorController.addAvailableHours);
// router.get('/:id/appointments', doctorController.getAppointments);

module.exports = router;
