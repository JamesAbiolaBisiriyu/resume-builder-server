// File Purpose: MongoDB connection helper used during server startup.
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongodbURI = process.env.CONN_STR;
    
    if (!mongodbURI) {
      throw new Error("CONN_STR environment variable is not defined");
    }

    await mongoose.connect(mongodbURI);
    console.log("MongoDB connected successfully");
    
    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error);
    });
    
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export default connectDB;