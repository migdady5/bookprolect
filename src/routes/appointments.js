const express = require('express');
const router = express.Router();
const { 
  bookAppointment, 
  getAvailableSlots, 
  getAllAvailableSlots 
} = require('../controllers/appointmentsController');
const { authMiddleware } = require('../middleware/authMiddleware'); // لو بدك تحمي الراوت

// Book an appointment (requires authentication)
router.post('/book', authMiddleware, bookAppointment);

// Get available slots for a specific doctor on a specific date
// Accepts both GET (query parameters) and POST (request body)
router.route('/slots')
  .get(getAvailableSlots)
  .post(getAvailableSlots);

// Get all available slots for all doctors on a specific date
// Accepts both GET (query parameters) and POST (request body)
router.route('/all-slots')
  .get(getAllAvailableSlots)
  .post(getAllAvailableSlots);

module.exports = router; 