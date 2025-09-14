import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    const body = await request.json();
    const {to, subject,text} = body;

    if (!to || !subject ||!text) {
        return NextResponse.json({error: 'Missing required fields'}, {status: 400});
    }

    // Create a transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
        // host: process.env.SMTP_HOST,
        service: 'gmail',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_FROM,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        }
    });

    try {
        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: `"Paws Connect" <${process.env.EMAIL_FROM}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            html: text, // plain text body
            // html: "<b>Hello world?</b>", // html body
        });

        console.log('Message sent: %s', info.messageId);

        return NextResponse.json({message: 'Email sent successfully'}, {status: 200});
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({error: 'Failed to send email'}, {status: 500});
    }
}