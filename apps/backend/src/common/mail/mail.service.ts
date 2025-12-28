import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    if (process.env.NODE_ENV === 'test') {
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST'),
        port: this.config.get<number>('SMTP_PORT'),
        secure: this.config.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async onModuleInit(): Promise<void> {
    // This method is intentionally left empty as per the provided instruction's context.
    // The instruction snippet was malformed, combining the method signature with parts of another method.
    // Assuming the intent was to add an onModuleInit method with a Promise<void> return type.
  }

  async sendOtp(to: string, otp: string, subject: string = 'Your OTP Code'): Promise<void> {
    if (!to) return;
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM', '"ChatDP" <no-reply@example.com>'),
        to,
        subject,
        text: `Your OTP is: ${otp}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; padding: 40px 0; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e1e4e8;">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #6200EE 0%, #3700B3 100%); padding: 30px; text-align: center;">
                 <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">ChatDP</h1>
              </div>

              <!-- Body -->
              <div style="padding: 40px 30px;">
                <h2 style="margin-top: 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Account Verification</h2>
                <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                  Please use the verification code below to complete your action. This code is valid for <strong>5 minutes</strong>.
                </p>

                <!-- OTP Box -->
                <div style="background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; padding: 20px; text-align: center; margin: 30px 0;">
                  <span style="font-family: monospace; font-size: 32px; font-weight: 700; color: #3700B3; letter-spacing: 8px;">${otp}</span>
                </div>

                <p style="color: #777777; font-size: 14px; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 20px;">
                  If you did not request this email, you can safely ignore it. Your account is secure.
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="color: #999999; font-size: 12px; margin: 0;">
                  &copy; ${new Date().getFullYear()} ChatDP. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        `,
      });
      this.logger.log(`Sent OTP to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }
}
