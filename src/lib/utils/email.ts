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

// Send ticket email
export async function sendTicketEmail(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  const recipientEmail = 'issa.ibrahim1072@gmail.com'

  const mailOptions = {
    from: `"Al-Mahir Academy Portal" <${process.env.GMAIL_EMAIL}>`,
    to: recipientEmail,
    replyTo: email,
    subject: `[Ticket] ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3d8f5b; margin: 0;">Al-Mahir Academy</h1>
          <p style="color: #666; margin: 5px 0;">Support Ticket</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #3d8f5b; margin-top: 0;">New Support Ticket</h2>
          
          <div style="margin-bottom: 20px;">
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>From:</strong> ${name}</p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #3d8f5b;">${email}</a></p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid #3d8f5b;">
            <p style="font-size: 14px; color: #666; margin: 0 0 10px 0;"><strong>Message:</strong></p>
            <p style="font-size: 16px; line-height: 1.6; color: #333; white-space: pre-wrap; margin: 0;">${message}</p>
          </div>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            You can reply directly to this email to respond to ${name}.
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
    console.log('Ticket email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending ticket email:', error)
    throw new Error('Failed to send ticket email')
  }
}

// Send registration email to admin
export async function sendRegistrationEmail(
  name: string,
  email: string,
  country: string,
  whatsapp: string,
  phone: string,
  gender: string,
  ageCategory: string,
  age: string,
  parentGuardianName: string,
  relationToApplicant: string,
  firstLanguage: string,
  program: string,
  classDuration: string,
  availability: string[],
  hearAboutUs: string,
  friendName: string,
  comments: string
) {
  const recipientEmail = 'almahir.info@gmail.com'

  // Format gender display
  const genderDisplay = gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : gender

  // Format age category display
  const ageCategoryDisplay = ageCategory === 'less-than-18' ? 'Less than 18 years' : '18 years and above'

  // Format first language display
  const languageDisplay = firstLanguage === 'english' ? 'English' : firstLanguage === 'arabic' ? 'Arabic' : 'Other'

  // Format program display
  const programDisplay = program === 'quran' ? 'Quran' :
    program === 'arabic' ? 'Arabic' :
      program === 'islamic-studies' ? 'Islamic Studies' :
        'Special Courses'

  // Format class duration display
  const durationDisplay = classDuration === '30-min' ? '30 min' :
    classDuration === '45-min' ? '45 min' :
      classDuration === '1-hr' ? '1 hr' :
        classDuration === '1-hr-30-min' ? '1 hr and a half' :
          '2 hr'

  // Format hear about us display
  const hearAboutUsDisplay = hearAboutUs === 'google' ? 'Google' :
    hearAboutUs === 'facebook' ? 'Facebook' :
      hearAboutUs === 'youtube' ? 'YouTube' :
        hearAboutUs === 'whatsapp' ? 'WhatsApp' :
          hearAboutUs === 'flyers' ? 'Flyers' :
            'Recommendation from a friend'

  const mailOptions = {
    from: `"Al-Mahir Academy Portal" <${process.env.GMAIL_EMAIL}>`,
    to: recipientEmail,
    replyTo: email,
    subject: `[Registration] New Registration from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3d8f5b; margin: 0;">Al-Mahir Academy</h1>
          <p style="color: #666; margin: 5px 0;">New Registration</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #3d8f5b; margin-top: 0;">New Registration Form Submission</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid #3d8f5b; margin-bottom: 20px;">
            <h3 style="color: #3d8f5b; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Personal Information</h3>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Name:</strong> ${name}</p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Gender:</strong> ${genderDisplay}</p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Age Category:</strong> ${ageCategoryDisplay}</p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Age:</strong> ${age}</p>
            ${ageCategory === 'less-than-18' ? `
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Parent/Guardian Name:</strong> ${parentGuardianName}</p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Relation to Applicant:</strong> ${relationToApplicant}</p>
            ` : ''}
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>First Language:</strong> ${languageDisplay}</p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Country:</strong> ${country}</p>
            
            <h3 style="color: #3d8f5b; margin-top: 20px; margin-bottom: 15px; font-size: 18px;">Contact Information</h3>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #3d8f5b;">${email}</a></p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>WhatsApp:</strong> ${whatsapp}</p>
            
            <h3 style="color: #3d8f5b; margin-top: 20px; margin-bottom: 15px; font-size: 18px;">Program Information</h3>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Program:</strong> ${programDisplay}</p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Class Duration:</strong> ${durationDisplay}</p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Availability:</strong> ${availability.join(', ')}</p>
            
            <h3 style="color: #3d8f5b; margin-top: 20px; margin-bottom: 15px; font-size: 18px;">Additional Information</h3>
            <p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>How did you hear about us:</strong> ${hearAboutUsDisplay}</p>
            ${hearAboutUs === 'recommendation' && friendName ? `<p style="font-size: 14px; color: #666; margin: 5px 0;"><strong>Friend's Name:</strong> ${friendName}</p>` : ''}
            ${comments ? `<p style="font-size: 14px; color: #666; margin: 15px 0 5px 0;"><strong>Comments:</strong></p>
            <p style="font-size: 16px; line-height: 1.6; color: #333; white-space: pre-wrap; margin: 10px 0 0 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">${comments}</p>` : ''}
          </div>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            You can reply directly to this email to respond to ${name}.
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
    console.log('Registration email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending registration email:', error)
    throw new Error('Failed to send registration email')
  }
}

// Send registration confirmation email to user
export async function sendRegistrationConfirmationEmail(
  name: string,
  email: string
) {
  // Extract first name from full name
  const firstName = name.split(' ')[0] || name

  const mailOptions = {
    from: `"Almahir Quran Academy" <${process.env.GMAIL_EMAIL}>`,
    to: email,
    subject: 'Student registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3d8f5b; margin: 0;">Almahir Quran Academy</h1>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <p style="font-size: 14px; color: #666; margin: 0 0 20px 0;"><strong>Subject:</strong> Thank you for your registration!</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 15px 0;">
            Dear <strong>${firstName}</strong>,
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 15px 0;">
            Thank you for your interest in Almahir Quran Academy. We have received your registration form and are delighted to welcome you into our learning community!
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 15px 0;">
            Our team is processing your information and will be in touch with you shortly. In the meantime, please do not hesitate to reach out to us if you have any questions or concerns.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0;">
            Our team is eager to help you attain your learning goals with success.
          </p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px;">
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0 0 10px 0;">
            Best regards,<br>
            <strong>Almahir Quran Academy Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            Sent from Almahir Quran Academy (AQA)
          </p>
        </div>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Registration confirmation email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending registration confirmation email:', error)
    throw new Error('Failed to send registration confirmation email')
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