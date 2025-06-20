require('dotenv').config();
const express = require('express');
const cors = require('cors');

const loginRoutes = require('./routes/login');
const patientRoutes = require('./routes/patient');

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

// ✅ Protected routes
app.use('/api/patients', authMiddleware, patientRoutes);

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
