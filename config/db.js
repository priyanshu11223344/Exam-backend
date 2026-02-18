const mongoose = require("mongoose");
require("dotenv").config();

const URI = process.env.MONGO_URI;

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(URI);
    isConnected = db.connections[0].readyState === 1;
    console.log("Connected to DB");
  } catch (error) {
    console.error("DB connection error:", error);
  }
};

module.exports = connectDB;
