require('dotenv').config();
const express = require('express');
const cors = require('cors');

const loginRoutes = require('./routes/login');
const signupRoutes = require('./routes/signup');
const patientRoutes = require('./routes/patient');
const debugRoutes = require('./routes/debug');
const testRoutes = require('./routes/test');
const adminRoutes = require('./routes/admin');
const doctorRoutes = require('./routes/doctor');
const appointmentsRoutes = require('./routes/appointments');

const { corsMiddleware } = require('./middleware/corsMiddleware');
const { authMiddleware } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(corsMiddleware);

// ✅ Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// ✅ Public routes
app.use('/api/auth', loginRoutes);
app.use('/api/signup', signupRoutes);

// ✅ Debug routes (for troubleshooting)
app.use('/api/debug', debugRoutes);

// ✅ Test routes (for debugging)
app.use('/api/test', testRoutes);

// ✅ Admin routes (for role assignment)
app.use('/api/admin', adminRoutes);

// ✅ Protected routes (authentication applied in route files)
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentsRoutes);

// ✅ Test protected route
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
