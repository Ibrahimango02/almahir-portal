import nodemailer from 'nodemailer'

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD, // 16-character app password
  },
})

export async function sendInvitationEmail(
  email: string,
  full_name: string,
  invitationToken: string,
  role?: string
) {
  const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup/${invitationToken}`
  const roleDisplay = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'

  const mailOptions = {
    from: `"Al-Mahir Academy" <${process.env.GMAIL_EMAIL}>`,
    to: email,
    subject: 'Invitation to Al-Mahir Academy Portal',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3d8f5b; margin: 0;">Al-Mahir Academy</h1>
          <p style="color: #666; margin: 5px 0;">Educational Portal</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #3d8f5b; margin-top: 0;">You've been invited!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${full_name}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">
            You've been invited to join the Al-Mahir Academy Portal as a <strong>${roleDisplay}</strong>. 
            Click the button below to create your account and get started.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signupUrl}" 
               style="background-color: #3d8f5b; 
                      color: white; 
                      padding: 14px 28px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      display: inline-block; 
                      font-weight: bold;
                      font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin: 20px 0 0 0;">
            Or copy and paste this link into your browser:<br>
            <a href="${signupUrl}" style="color: #3d8f5b; word-break: break-all;">${signupUrl}</a>
          </p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            <strong>Important:</strong> This invitation will expire in 7 days.
          </p>
          <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
            If you have any questions, please reply to this email or contact us at 
            <a href="mailto:${process.env.GMAIL_EMAIL}" style="color: #3d8f5b;">${process.env.GMAIL_EMAIL}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2025 Al-Mahir Academy. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error('Failed to send invitation email')
  }
}

// Test email connection
export async function testEmailConnection() {
  try {
    await transporter.verify()
    console.log('Email server connection verified')
    return true
  } catch (error) {
    console.error('Email server connection failed:', error)
    return false
  }
}