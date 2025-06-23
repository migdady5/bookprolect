// generateSlots.js
require('dotenv').config();

const admin = require('./helpers/firebaseadmin');
const { getFirestore } = require('firebase-admin/firestore');

// ✅ ابدأ الاتصال بـ Firebase
// Using shared Firebase admin configuration from helpers/firebaseadmin.js

const db = getFirestore();

// 🔁 days ترتيب الأيام من الأحد للسبت
const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// 🗑️ Delete past slots function
const deletePastSlots = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // نثبت الساعة 00:00:00 لتسهيل المقارنة

    const snapshot = await db.collection('available').get();

    for (const doc of snapshot.docs) {
      const docDate = new Date(doc.id); // assuming the doc.id is date string like '2025-06-28'
      if (docDate < today) {
        await doc.ref.delete();
        console.log(`🗑️ Deleted past slot for ${doc.id}`);
      }
    }
    console.log('✅ Past slots cleanup completed');
  } catch (error) {
    console.error('❌ Error deleting past slots:', error);
  }
};

async function generateNextWeekSlots() {
  try {
    const doctorsSnapshot = await db.collection('Doctors').get();

    for (const doc of doctorsSnapshot.docs) {
      const doctor = doc.data();
      const doctorID = doc.id;
      const workingDays = doctor.workingDays || [];
      const defaultSlots = doctor.defaultSlots || [];

      // 👇 نجيب تاريخ بداية الأسبوع الجاي (مثلاً السبت الجاي)
      const today = new Date();
      const nextSaturday = new Date(today);
      nextSaturday.setDate(today.getDate() + (6 - today.getDay()) + 1); // السبت الجاي

      for (let i = 0; i < 7; i++) {
        const date = new Date(nextSaturday);
        date.setDate(nextSaturday.getDate() + i);

        const dayName = daysOfWeek[date.getDay()];

        if (!workingDays.includes(dayName)) continue;

        const formattedDate = date.toISOString().split('T')[0]; // "2025-06-30"

        const availableRef = db
          .collection('available')
          .doc(doctorID)
          .collection(formattedDate);

        for (const slot of defaultSlots) {
          await availableRef.add({
            from: slot.from,
            to: slot.to,
            is_booked: false,
          });
        }

        console.log(`✅ Created slots for ${doctor.name} on ${formattedDate}`);
      }
    }

    console.log('✅ All slots created.');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Main execution function
async function main() {
  try {
    console.log('🚀 Starting slot generation and cleanup...');
    
    // First, delete past slots
    await deletePastSlots();
    
    // Then, generate new slots for next week
    await generateNextWeekSlots();
    
    console.log('✅ All operations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in main execution:', error);
    process.exit(1);
  }
}

// Run the main function
main();
