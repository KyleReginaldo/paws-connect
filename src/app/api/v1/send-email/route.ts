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
        port:  587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: "pawsconnecttof@gmail.com",
            pass: "nmeq gfvs igju jnio",
        },
        tls: {
            rejectUnauthorized: false,
        }
    });

    try {
        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: `"Paws Connect Support" <pawsconnecttof@gmail.com>`, // sender address
            to,
            subject, 
            html: text, 
        });

        console.log('Message sent: %s', info.messageId);

        return NextResponse.json({message: 'Email sent successfully'}, {status: 200});
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({error: 'Failed to send email'}, {status: 500});
    }
}