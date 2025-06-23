const admin = require('../helpers/firebaseadmin');
const db = admin.firestore();

// GET /api/doctors/:id - Get doctor by ID
exports.getDoctorById = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctorDoc = await db.collection('Doctors').doc(doctorId).get();

    if (!doctorDoc.exists) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.status(200).json({
      message: 'Doctor retrieved successfully',
      doctor: {
        id: doctorDoc.id,
        ...doctorDoc.data()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching doctor:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
