import jwt from "jsonwebtoken";
import { config } from "dotenv";
config()

const { JWT_SECRET } = process.env

export function getFutureTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    let date = now.toISOString().split("T")[0]
    let time = now.toTimeString().split(" ")[0]
  
    return `${date}T${time}`
}


export function isCurrentTimeGreater(targetDateTime) {
    const now = new Date();
    const targetTime = new Date(targetDateTime);
    return now > targetTime;
}

export function createToken(id){
    return jwt.sign({id}, JWT_SECRET)
}

export function verifyToken(token){
    return jwt.verify(token, JWT_SECRET)
}   