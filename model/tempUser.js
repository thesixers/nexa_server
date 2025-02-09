import { Schema, model } from "mongoose";

const newTemp = new Schema({
    phoneNo: {type: String, required:[true, 'you need a phone number to signup on nexa']},
    otp: {type: String}
})

const temp = model('temp', newTemp);
export default User;