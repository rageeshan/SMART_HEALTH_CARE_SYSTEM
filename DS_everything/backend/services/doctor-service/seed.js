const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doctor = require('./src/models/Doctor');
const Availability = require('./src/models/Availability');


dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_doctors';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...', MONGO_URI);
    await mongoose.connect(MONGO_URI);

    console.log('Clearing existing data...');
    await Doctor.deleteMany({});
    await Availability.deleteMany({});


    console.log('Seeding doctors...');
    
    // Create 3 demo doctors
    const d1 = await Doctor.create({
      userId: 'doc-001',
      name: 'Dr. Sarah Connor',
      specialty: 'Cardiologist',
      qualifications: ['MBBS', 'MD Cardiology'],
      experienceYears: 12,
      contactNumber: '+94771001001',
      consultationFee: 3500
    });

    const d2 = await Doctor.create({
      userId: 'doc-002',
      name: 'Dr. James Smith',
      specialty: 'Dermatologist',
      qualifications: ['MBBS', 'MD Dermatology'],
      experienceYears: 8,
      contactNumber: '+94771002002',
      consultationFee: 2500
    });

    const d3 = await Doctor.create({
      userId: 'doc-003',
      name: 'Dr. Emily Chen',
      specialty: 'Pediatrician',
      qualifications: ['MBBS', 'DCH'],
      experienceYears: 15,
      contactNumber: '+94771003003',
      consultationFee: 3000
    });

    console.log('Seeding availability slots...');

    await Availability.create({
      doctorId: d1._id,
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '12:00'
    });
    
    await Availability.create({
      doctorId: d1._id,
      dayOfWeek: 'Wednesday',
      startTime: '14:00',
      endTime: '18:00'
    });

    await Availability.create({
      doctorId: d2._id,
      dayOfWeek: 'Tuesday',
      startTime: '10:00',
      endTime: '16:00'
    });

    await Availability.create({
      doctorId: d3._id,
      dayOfWeek: 'Friday',
      startTime: '08:00',
      endTime: '14:00'
    });

    console.log('\n--- SUCCESS! Seed Data Inserted ---');
    console.log('\nYou can now use these User IDs to log in as a Doctor:');
    console.log('1. doc-001 (Dr. Sarah Connor)');
    console.log('2. doc-002 (Dr. James Smith)');
    console.log('3. doc-003 (Dr. Emily Chen)');
    console.log('\nFor a Patient, you can use any username, e.g.: p-001, patient-xyz, etc.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDatabase();
