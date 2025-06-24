const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

exports.bookAppointment = async (req, res) => {
  try {
    const { doctorID, patientID, date, startTime, endTime, note } = req.body;

    if (!doctorID || !patientID || !date || !startTime || !endTime) {
      return res.status(400).json({ 
        message: 'doctorID, patientID, date, startTime, and endTime are required' 
      });
    }

    console.log(`🔍 Checking availability for doctor ${doctorID} on ${date} from ${startTime} to ${endTime}`);

    // التحقق إذا هذا الوقت محجوز
    const slotRef = db.collection('available')
      .doc(doctorID)
      .collection(date)
      .where('from', '==', startTime)
      .where('to', '==', endTime)
      .where('is_booked', '==', false);

    const snapshot = await slotRef.get();

    console.log('Available slots snapshot:', snapshot.docs.map(doc => doc.data()));

    if (snapshot.empty) {
      return res.status(400).json({ message: 'This slot is already booked or does not exist' });
    }

    const slotDoc = snapshot.docs[0];

    // 1. احجز الموعد في bookedAppointments collection
    const appointmentData = {
      doctorID,
      patientID,
      date,
      startTime,
      endTime,
      note: note || '',
      slotID: slotDoc.id,
      createdAt: new Date().toISOString(),
      status: 'booked'
    };

    const appointmentRef = await db.collection('bookedAppointments').add(appointmentData);
    const newAppointment = await appointmentRef.get();

    // 2. حدث الحالة إلى is_booked: true
    await slotDoc.ref.update({
      'is_booked': true
    });

    console.log(`✅ Appointment booked successfully with ID: ${appointmentRef.id}`);

    res.status(200).json({ 
      message: 'Appointment booked successfully',
      appointmentID: appointmentRef.id,
      appointment: {
        id: newAppointment.id,
        ...newAppointment.data()
      }
    });

  } catch (err) {
    console.error('❌ Error booking appointment:', err);
    res.status(500).json({ message: 'Something went wrong while booking appointment' });
  }
};

// Fetch all available slots for a doctor on a specific date
exports.getAvailableSlots = async (req, res) => {
  try {
    // Accept data from both query parameters and request body
    const doctorID = req.query.doctorID || req.body.doctorID;
    const date = req.query.date || req.body.date;

    if (!doctorID || !date) {
      return res.status(400).json({ 
        message: 'doctorID and date are required (can be sent as query parameters or in request body)' 
      });
    }

    console.log(`🔍 Fetching available slots for doctor ${doctorID} on ${date}`);

    // Get all slots for the doctor on the specified date
    const slotsSnapshot = await db.collection('available')
      .doc(doctorID)
      .collection(date)
      .get();

    const availableSlots = [];
    const bookedSlots = [];

    slotsSnapshot.forEach(doc => {
      const slotData = doc.data();
      const slot = {
        id: doc.id,
        from: slotData.from,
        to: slotData.to,
        is_booked: slotData.is_booked || false
      };

      if (slot.is_booked) {
        bookedSlots.push(slot);
      } else {
        availableSlots.push(slot);
      }
    });

    console.log(`✅ Found ${availableSlots.length} available slots and ${bookedSlots.length} booked slots`);

    res.status(200).json({
      message: 'Available slots retrieved successfully',
      doctorID,
      date,
      availableSlots,
      bookedSlots,
      totalSlots: availableSlots.length + bookedSlots.length,
      availableCount: availableSlots.length,
      bookedCount: bookedSlots.length
    });

  } catch (err) {
    console.error('❌ Error fetching available slots:', err);
    res.status(500).json({ message: 'Something went wrong while fetching slots' });
  }
};

// Fetch all available slots for all doctors on a specific date
exports.getAllAvailableSlots = async (req, res) => {
  try {
    // Accept data from both query parameters and request body
    const date = req.query.date || req.body.date;

    if (!date) {
      return res.status(400).json({ 
        message: 'date is required (can be sent as query parameter or in request body)' 
      });
    }

    console.log(`🔍 Fetching all available slots for date: ${date}`);

    // Get all doctors first
    const doctorsSnapshot = await db.collection('Doctors').get();
    const allSlots = [];

    for (const doctorDoc of doctorsSnapshot.docs) {
      const doctorData = doctorDoc.data();
      const doctorID = doctorDoc.id;

      // Get slots for this doctor on the specified date
      const slotsSnapshot = await db.collection('available')
        .doc(doctorID)
        .collection(date)
        .get();

      const doctorSlots = [];
      slotsSnapshot.forEach(doc => {
        const slotData = doc.data();
        doctorSlots.push({
          id: doc.id,
          from: slotData.from,
          to: slotData.to,
          is_booked: slotData.is_booked || false
        });
      });

      if (doctorSlots.length > 0) {
        allSlots.push({
          doctorID,
          doctorName: doctorData.name || 'Unknown Doctor',
          doctorEmail: doctorData.email,
          specialty: doctorData.specialty,
          slots: doctorSlots,
          availableCount: doctorSlots.filter(slot => !slot.is_booked).length,
          bookedCount: doctorSlots.filter(slot => slot.is_booked).length
        });
      }
    }

    console.log(`✅ Found slots for ${allSlots.length} doctors on ${date}`);

    res.status(200).json({
      message: 'All available slots retrieved successfully',
      date,
      doctors: allSlots,
      totalDoctors: allSlots.length
    });

  } catch (err) {
    console.error('❌ Error fetching all available slots:', err);
    res.status(500).json({ message: 'Something went wrong while fetching slots' });
  }
}; 