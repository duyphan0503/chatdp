import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import nodemailer from 'nodemailer';

async function main() {
  try {
    const envPath = join(process.cwd(), '.env');
    console.log('Loading env from:', envPath);
    const envFile = await readFile(envPath, 'utf-8');

    const env: Record<String, string> = {};
    for (const line of envFile.split('\n')) {
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.substring(0, idx).trim();
      let val = line.substring(idx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }

    /*
    console.log('Configuration:');
    console.log('Host:', env['SMTP_HOST']);
    console.log('Port:', env['SMTP_PORT']);
    console.log('User:', env['SMTP_USER']);
    console.log('Secure:', env['SMTP_SECURE']);
    console.log('From:', env['SMTP_FROM']);
    */

    const transporter = nodemailer.createTransport({
      host: env['SMTP_HOST'],
      port: Number(env['SMTP_PORT']),
      secure: env['SMTP_SECURE'] === 'true',
      auth: {
        user: env['SMTP_USER'],
        pass: env['SMTP_PASS'],
      },
    });

    console.log('Sending test email to onboarding@resend.dev...');
    const info = await transporter.sendMail({
      from: env['SMTP_FROM'],
      to: 'longthan347@gmail.com',
      subject: 'ChatDP Test Email',
      text: 'If you receive this, email configuration is correct.',
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error: any) {
    console.error('❌ Failed to send email.');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Server Response:', error.response);
    }
  }
}

main();
