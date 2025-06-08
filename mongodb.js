import mongoose from 'mongoose';
import { config } from 'dotenv'

config()

let { MONGO_URI, EMAIL_USER, EMAIL_PASS } = process.env

export function dbConnect(){
  try {
    let isConnected = mongoose.connect(MONGO_URI);
    if(isConnected) console.log('connected to db');
  } catch (error) {
    console.log(error.message);  
  }
}