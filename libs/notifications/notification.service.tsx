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

    async sendWelcomeEmail(email: string, fullName: string, roleName: string, password?: string) {
        await this.email.sendHtml(
            email,
            "Welcome to Ignite - Account Created",
            `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #4A90E2; text-align: center;">Welcome to Ignite, ${fullName}!</h2>
                <p>Hello ${fullName},</p>
                <p>Your account has been created successfully by an Administrator.</p>
                <p><strong>Account Details:</strong></p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Role:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${roleName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
                    </tr>
                    ${password ? `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Password:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;"><code>${password}</code></td>
                    </tr>
                    ` : ""}
                </table>
                <p>You can now log in using your email address and the password set for you.</p>
                <p style="font-size: 0.9em; color: #777; text-align: center; margin-top: 25px;">
                    This is an automated message, please do not reply directly to this email.
                </p>
            </div>`
        );
    }

    async sendAccountUpdatedEmail(
        email: string,
        fullName: string,
        updates: { roleName?: string; email?: string; password?: string; status?: string }
    ) {
        let updatesHtml = "";
        if (updates.roleName) {
            updatesHtml += `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">New Role:</td><td style="padding: 8px; border: 1px solid #ddd;">${updates.roleName}</td></tr>`;
        }
        if (updates.email) {
            updatesHtml += `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">New Email:</td><td style="padding: 8px; border: 1px solid #ddd;">${updates.email}</td></tr>`;
        }
        if (updates.password) {
            updatesHtml += `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">New Password:</td><td style="padding: 8px; border: 1px solid #ddd;"><code>${updates.password}</code></td></tr>`;
        }
        if (updates.status) {
            updatesHtml += `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">New Status:</td><td style="padding: 8px; border: 1px solid #ddd;">${updates.status}</td></tr>`;
        }

        await this.email.sendHtml(
            email,
            "Your Account Has Been Updated",
            `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #4A90E2; text-align: center;">Account Details Updated!</h2>
                <p>Hello ${fullName},</p>
                <p>An Administrator has updated your account details. Below are the updated details:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    ${updatesHtml}
                </table>
                <p>If you did not request these changes or believe this is an error, please contact support immediately.</p>
                <p style="font-size: 0.9em; color: #777; text-align: center; margin-top: 25px;">
                    This is an automated message, please do not reply directly to this email.
                </p>
            </div>`
        );
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