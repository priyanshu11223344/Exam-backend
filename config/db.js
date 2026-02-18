const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // stop infinite waiting
    });

    console.log("Connected to DB");
  } catch (error) {
    console.error("Mongo connection error:", error);
    throw error;
  }
};

module.exports = connectDB;
