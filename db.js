import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose
  .connect(process.env.MONGO_URL, {
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error", err));


const db = mongoose.connection;

export default db;