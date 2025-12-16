import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    
  } catch (error) {
    console.error('MongoDB connection failed:', error);
  }
};

export default connectDB;


// need to do better error handling and reconnection logic here
