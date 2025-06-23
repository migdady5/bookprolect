const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

exports.bookAppointment = async (req, res) => {
  try {
    const { doctorID, patientID, date, startTime, endTime, note } = req.body;

    // التحقق إذا هذا الوقت محجوز
    const slotRef = db.collection('available')
      .doc(doctorID)
      .collection(date)
      .where('slots.from', '==', startTime)
      .where('slots.to', '==', endTime)
      .where('slots.is_booked', '==', false);

    const snapshot = await slotRef.get();

    console.log('Available slots snapshot:', snapshot.docs.map(doc => doc.data()));

    if (snapshot.empty) {
      return res.status(400).json({ message: 'This slot is already booked or does not exist' });
    }

    const slotDoc = snapshot.docs[0];

    // 1. احجز الموعد
    await db.collection('appointments').add({
      doctorID,
      patientID,
      date,
      startTime,
      endTime,
      note,
      createdAt: new Date().toISOString(),
      status: 'booked'
    });

    // 2. حدث الحالة إلى is_booked: true
    await slotDoc.ref.update({
      'slots.is_booked': true
    });

    res.status(200).json({ message: 'Appointment booked successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}; 