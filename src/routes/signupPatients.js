// pages/api/auth/signupPatient.js
import admin from '../../../helpers/firebaseadmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password, first_name, last_name, phone, age, gender } = req.body;

  if (!email || !password || !first_name || !last_name || !age || !gender) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName: first_name, last_name, age, gender });

    await admin.firestore().collection('patients').doc(userRecord.uid).set({
      email,
      first_name,
      last_name,
      phone: phone || '',
      age,
      gender,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ message: 'Patient signed up successfully', uid: userRecord.uid });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
