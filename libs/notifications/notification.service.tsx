import {EmailChannel} from "./channels/email.channel";
import {OtpTemplate} from "./templates/otp.template";
import React from "react";

export class NotificationService{
    private email=new EmailChannel();

    async sendOtp(email:string,otp:string,name?:string){
        await this.email.send(
            email,
            "Your OTP CODE",
            <OtpTemplate otp={otp} name={name} />
        )
    }
}