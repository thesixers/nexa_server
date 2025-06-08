import { Schema, model } from "mongoose";

const newTemp = new Schema({
    email: {type: String, required:[true, 'you need a phone number to signup on nexa']},
    otp: {type: String},
    otpexp: {type: String}
})

const Temp = model('temp', newTemp);
export default Temp;