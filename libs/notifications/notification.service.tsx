import {EmailChannel} from "./channels/email.channel";
import {OtpTemplate} from "./templates/otp.template";
import { EmailTemplateRepository } from "@libs/repositories";
import { TEMPLATE_AUDIENCE, TEMPLATE_EVENT_TYPE } from "@libs/entities";
import React from "react";


export class NotificationService{
    private email=new EmailChannel();
    private emailTemplateRepo = new EmailTemplateRepository();

    async sendOtp(email:string,otp:string,name?:string){
        await this.email.send(
            email,
            "Your OTP CODE",
            <OtpTemplate otp={otp} name={name} />
        )
    }

    /**
     * Send an email notification using a DB-stored email template.
     * Replaces {{variable}} placeholders in both subject and body.
     * Fails silently (logs error) so it doesn't break the main flow.
     */
    async sendTemplateNotification(
        to: string,
        contestId: string,
        audience: TEMPLATE_AUDIENCE,
        eventType: TEMPLATE_EVENT_TYPE,
        variables: Record<string, string> = {}
    ) {
        try {
            const template = await this.emailTemplateRepo.findByContestAndAudienceAndEvent(
                contestId,
                audience,
                eventType
            );

            if (!template || !template.is_active) {
                console.log(
                    `No active email template found for contest=${contestId}, audience=${audience}, event=${eventType}`
                );
                return;
            }

            // Replace {{variable}} placeholders
            let subject = template.subject;
            let body = template.body;

            for (const [key, value] of Object.entries(variables)) {
                const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
                subject = subject.replace(placeholder, value);
                body = body.replace(placeholder, value);
            }

            await this.email.sendHtml(to, subject, body);
            console.log(`Template email sent: ${eventType} → ${to}`);
        } catch (error) {
            console.error(`Failed to send template email (${eventType} → ${to}):`, error);
        }
    }
}