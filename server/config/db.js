import mongoose from "mongoose";

const URI =
  "mongodb+srv://bidMaster:bidMaster123@cluster0.idygwu6.mongodb.net/Bid_Master?retryWrites=false&w=majority";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error.message);
    console.log("Mongo Db connection failed");
    process.exit(1);
  }
};



export default connectDB;
