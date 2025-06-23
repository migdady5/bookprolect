const express = require('express');
const router = express.Router();
const { bookAppointment } = require('../controllers/appointmentsController');
const { authMiddleware } = require('../middleware/authMiddleware'); // لو بدك تحمي الراوت

router.post('/book', authMiddleware, bookAppointment);

module.exports = router; 