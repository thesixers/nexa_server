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


export function tokenVeryifyMiddleware(req, res, next){
    let token = req.headers['authorization'];
    if(!token) return res.status(401).json({E: "No token provided"});
    let fToken = token.split(" ")[1];
    let decoded = verifyToken(fToken);
    if(!decoded) return res.status(401).json({E: "Invalid token"});
    req.userId = decoded.id;
    next();
}