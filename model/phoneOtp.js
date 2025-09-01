import { Schema, model } from "mongoose";

const phoneOTP = new Schema({
    phoneNumber: {type: String},
    otp: {type: String},
    otpexp: {type: String},
    nexaId: {type: String}
})

const PhoneOTP = model('phoneotp', phoneOTP);
export default PhoneOTP;