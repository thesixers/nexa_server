import { Schema, model } from "mongoose";

const newUser = new Schema({
    name: {type: String},
    nexaId: {type: String},
    username: {type: String},
    phones: {type: Array, default: []},
    status: {type: String, enum:['online', 'offline']},
    bio: {type: String, default: "Hey am using nexa for calls"},
    lastActive: {type: String},
    contacts: {type: Array, default: []},
    callHistory: {type: Array, default: []}, 
    blockedUsers:{type: Array},
    avatar: {type: String}
}) 

const Users = model('nexaUser', newUser);
export default Users;