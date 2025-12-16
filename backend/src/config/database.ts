import mongoose from 'mongoose';
import { ENV } from './env';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENV.DB.MONGODB_URI as string);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    
  } catch (error) {
    console.error('MongoDB connection failed:', error);
  }
};

export default connectDB;


// need to do better error handling and reconnection logic here
