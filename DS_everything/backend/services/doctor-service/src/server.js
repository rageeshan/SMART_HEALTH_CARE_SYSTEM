const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/doctors', require('./routes/doctorRoutes'));

// Health check route
app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }));

const PORT = process.env.PORT || 5002;

app.listen(PORT, console.log(`Doctor & Appointment Service running on port ${PORT}`));
