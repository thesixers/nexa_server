import { Schema, model } from "mongoose";

const newUser = new Schema({
    name: {type: String},
    nexaId: {type: String},
    username: {type: String},
    phones: {type: Array, default: []},
    status: {type: String, enum:['online', 'offline']},
    bio: {type: String, default: "Hey am using nexa for calls"},
    lastActive: {type: String},
    avatar: {type: String, default: null},
}) 

const Users = model('nexaUser', newUser);
export default Users;