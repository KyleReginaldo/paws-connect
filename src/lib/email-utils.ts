import { StatusChangeEmailDto } from '@/common/common.dto';
import { getStatusChangeEmailTemplate } from '@/common/email-templates';
import nodemailer from 'nodemailer';

export async function sendStatusChangeEmail(
  userEmail: string,
  username: string,
  newStatus: string,
  adminName?: string
): Promise<boolean> {
  try {
    const emailDto: StatusChangeEmailDto = {
      username,
      newStatus,
      adminName
    };

    const { subject, html } = getStatusChangeEmailTemplate(emailDto);

    // Create transporter directly instead of making HTTP request
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || "pawsconnecttof@gmail.com",
        pass: process.env.EMAIL_PASS || "nmeq gfvs igju jnio",
      },
      tls: {
        rejectUnauthorized: false,
      }
    });

    // Send mail directly using nodemailer
    const info = await transporter.sendMail({
      from: `"PawsConnect Support" <pawsconnecttof@gmail.com>`,
      to: userEmail,
      subject,
      html,
    });

    console.log(`Status change email sent successfully to ${userEmail} for status: ${newStatus}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending status change email:', error);
    return false;
  }
}