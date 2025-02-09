import { Schema, model } from "mongoose";

const newUser = new Schema({
    name: {type: String, required: [true, 'please enter a your name']},
    phoneNo: {type: String, required:[true, 'you need a phone number to signup on nexa']},
    status: {type: String, enum:['online', 'offline']},
    bio: {type: String},
    lastActive: {type: String},
    contact: {type: Array},
    callHistory: {type: Array},
    blockedUsers:{type: Array}
})

const Users = model('nexaUser', newUser);
export default Users;