const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Appointment = require('./src/models/Appointment');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_doctors';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...', MONGO_URI);
    await mongoose.connect(MONGO_URI);

    console.log('Clearing existing data...');

    await Appointment.deleteMany({});

    console.log('Appointments wiped!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDatabase();
