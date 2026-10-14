const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const MONGO_URI =
      process.env.MONGO_URI || 'mongodb://localhost:27017/taskManagementDB';
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error(
      'Hint: make sure MongoDB is running, or set MONGO_URI in backend/.env'
    );
    process.exit(1);
  }
};

module.exports = connectDB;