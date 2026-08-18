import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: 'All fields are required.' }, { status: 400 });
    }

    // Nodemailer transporter setup (Gmail use karte hue)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 1. Email jo AAPKE paas ayegi (Contact form se)
    const mailOptionsToYou = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Yeh email aapke paas hi ayegi
      subject: `New Contact Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #333;">New Message Received</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #fff; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">${message}</p>
        </div>
      `,
    };

    // 2. Thank You Email jo SENDER ke paas jayegi
   // 2. VIP Thank You & Confirmation Email jo SENDER ke paas jayegi
    const mailOptionsToSender = {
      from: `"Nimra & Owais" <${process.env.EMAIL_USER}>`,
      to: email, // Sender ka email
      subject: '✨ We have received your message | Nimra & Owais Wedding',
      html: `
        <div style="background-color: #f7f3ef; padding: 40px 0; font-family: 'Cormorant Garamond', 'Georgia', serif; color: #3e2c31;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid rgba(185,145,89,0.3);">
            
            <!-- Header Banner -->
            <tr>
              <td align="center" style="background: linear-gradient(135deg, #3c262d, #21161b); padding: 35px 20px;">
                <h1 style="color: #edc99a; font-size: 28px; font-weight: 400; letter-spacing: 4px; margin: 0;">NIMRA & OWAIS</h1>
                <p style="color: #f2d6dc; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 8px 0 0 0;">The Wedding Celebration</p>
              </td>
            </tr>

            <!-- Main Content Area -->
            <tr>
              <td style="padding: 40px 35px;">
                <h2 style="font-size: 24px; color: #b99159; margin-top: 0; font-weight: 500;">Thank you, ${name}! ✨</h2>
                
                <p style="font-size: 15px; line-height: 1.8; color: #5a4a4f; font-family: Arial, sans-serif;">
                  We have successfully received your message and truly appreciate you taking the time to connect with us. Whether you are sharing your warm wishes or confirming your presence, your support means the world to us.
                </p>

                <!-- Highlight Box: Event Details -->
                <div style="background-color: #faf6f0; border-left: 3px solid #b99159; padding: 20px; margin: 25px 0; border-radius: 4px;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #b99159; font-family: Arial, sans-serif;"><strong>Save the Date Details:</strong></p>
                  <p style="margin: 4px 0; font-size: 14px; color: #3e2c31; font-family: Arial, sans-serif;">📅 <strong>Date:</strong> Wednesday, 23 December 2026</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #3e2c31; font-family: Arial, sans-serif;">⏰ <strong>Time:</strong> 09:00 AM onwards</p>
                  <p style="margin: 4px 0; font-size: 14px; color: #3e2c31; font-family: Arial, sans-serif;">📍 <strong>Venue:</strong> C-184, Block J, North Nazimabad, Karachi</p>
                </div>

                <p style="font-size: 15px; line-height: 1.8; color: #5a4a4f; font-family: Arial, sans-serif;">
                  We will get back to you shortly if your message requires a personal response. We look forward to celebrating this beautiful milestone with you.
                </p>

                <p style="margin-top: 35px; font-size: 15px; color: #3e2c31; font-family: Arial, sans-serif;">
                  Warm regards,<br/>
                  <strong style="font-family: 'Georgia', serif; font-size: 18px; color: #b99159;">Nimra & Owais</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="background-color: #f4ece4; padding: 20px; font-size: 12px; color: #8c787d; font-family: Arial, sans-serif;">
                <p style="margin: 0;">Made with love for a lifetime of memories.</p>
                <p style="margin: 5px 0 0 0; font-size: 10px; color: #ab959a;">© 2026 Nimra & Owais Wedding. All rights reserved.</p>
              </td>
            </tr>

          </table>
        </div>
      `,
    };

    // Dono emails send karein
    await transporter.sendMail(mailOptionsToYou);
    await transporter.sendMail(mailOptionsToSender);

    return NextResponse.json({ success: true, message: 'Emails sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email.' }, { status: 500 });
  }
}