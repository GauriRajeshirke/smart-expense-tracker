import mongoose from "mongoose";

export default async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    console.error("Check that MongoDB is running and MONGO_URI in server/.env is correct.");
    process.exit(1);
  }
}
