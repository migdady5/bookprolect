const admin = require('firebase-admin');
const db = admin.firestore();

exports.getPatientById = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patientDoc = await db.collection('patients').doc(patientId).get();

    if (!patientDoc.exists) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.status(200).json(patientDoc.data());
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// يمكنك إضافة باقي الدوال هنا مثل:
exports.createPatient = async (req, res) => { /* ... */ };
exports.updatePatient = async (req, res) => { /* ... */ };
exports.deletePatient = async (req, res) => { /* ... */ };
