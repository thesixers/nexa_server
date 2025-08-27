import {createTransport} from "nodemailer";
import {config } from 'dotenv';
config()

const { EMAIL_USER, EMAIL_PASS } = process.env;

export const sendOtp = ({email,otp}) => {
    const transporter = createTransport({
        service: 'gmail',
        auth:{
            user: EMAIL_USER,
            pass: EMAIL_PASS
        }
    })

    const mail = {
        from: EMAIL_USER,
        to: email,
        subject: 'nexa otp code',
        text: `${otp}`
    }

    transporter.sendMail(mail, (err, info) => {
        if(err) console.log(err.message);

        console.log(info);
    })
}