import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    // Strip wrapping quotes that .env parsers sometimes preserve
    const rawPass = this.configService.get<string>('SMTP_PASS') || '';
    const smtpPass = rawPass.replace(/^['"]|['"]$/g, '');
    const smtpSecure = this.configService.get<string>('SMTP_SECURE') === 'true';
    this.logger.log(
      `SMTP config: host=${smtpHost}, port=${smtpPort}, secure=${smtpSecure}, user=${smtpUser}`,
    );

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth:
        smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    });

    if (smtpHost) {
      this.transporter.verify().then(
        () => this.logger.log('SMTP connection verified'),
        (err) => this.logger.warn(`SMTP verification failed: ${err.message}`),
      );
    } else {
      this.logger.warn(
        'SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in env.',
      );
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') || 'support@gocv.live';
    const appName = 'GoCV';
    

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${fromAddress}>`,
        to: email,
        subject: `${code} is your ${appName} verification code`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #1a1a2e; margin-bottom: 8px;">Verify your email</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.5;">
              Enter the following code to verify your email address and complete your registration:
            </p>
            <div style="background: #f4f4f8; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e;">${code}</span>
            </div>
            <p style="color: #888; font-size: 13px; line-height: 1.5;">
              This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #aaa; font-size: 12px;">&copy; ${new Date().getFullYear()} ${appName}</p>
          </div>
        `,
        text: `Your ${appName} verification code is: ${code}\n\nThis code expires in 10 minutes.`,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}: ${error.message}`,
      );
      throw error;
    }
  }
}
