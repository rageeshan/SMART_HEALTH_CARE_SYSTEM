const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { startReminderScheduler } = require('./controllers/appointmentController');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/appointments', require('./routes/appointmentRoutes'));

// Health check route
app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }));

const PORT = process.env.PORT || 5004;

app.listen(PORT, () => {
  console.log(`Appointment Service running on port ${PORT}`);
  startReminderScheduler();
});
