import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected Successfully!");
  } catch (error) {
    console.error("Database connection failed or not found!", error);
    process.exit(1); //1 means exit from failiure
  }
};
