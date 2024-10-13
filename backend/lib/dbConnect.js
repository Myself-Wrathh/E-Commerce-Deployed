import mongoose from "mongoose";

export const makeConnection = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Error connecting to mongoDB", error.message);
    process.exit(1);
  }
};
