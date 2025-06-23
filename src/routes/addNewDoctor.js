// pages/api/auth/createDoctor.js
import admin from '../../../helpers/firebaseadmin';
import { authMiddleware, checkRole } from '../../../middleware/authMiddleware';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  await authMiddleware(req, res, async () => {
    await checkRole(['admin'])(req, res, async () => {
      const { email, password, name, phone, specialty } = req.body;
	  // Ensure the user is authenticated and has the right permissions
	  if (!req.user || !req.user.uid) {
		return res.status(401).json({ error: 'Unauthorized' });
	  }
      const MAIN_DOCTOR_UID = process.env.MAIN_DOCTOR_UID;
      if (req.user.uid !== MAIN_DOCTOR_UID) {
        return res.status(403).json({ error: 'Only the main doctor can add new doctors' });
      }

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
        // 1. Create Firebase Auth user
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: name,
        });

        const uid = userRecord.uid;

        // 2. Save doctor profile in Firestore
        await admin.firestore().collection('Doctors').doc(uid).set({
          email,
          name,
          phone: phone || '',
          specialty: specialty || '',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(201).json({ message: 'Doctor created successfully', uid });
      } catch (error) {
        console.error('Create doctor error:', error);
        return res.status(500).json({ error: error.message || 'Failed to create doctor' });
      }
    });
  });
}
