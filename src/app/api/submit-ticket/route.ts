import { NextRequest, NextResponse } from 'next/server'
import { sendTicketEmail } from '@/lib/utils/email'

export async function POST(request: NextRequest) {
    try {
        const { name, email, subject, message } = await request.json()

        // Validate input
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: 'Name, email, subject, and message are required' },
                { status: 400 }
            )
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }

        // Validate field lengths
        if (name.length > 200) {
            return NextResponse.json({ error: 'Name is too long' }, { status: 400 })
        }
        if (subject.length > 200) {
            return NextResponse.json({ error: 'Subject is too long' }, { status: 400 })
        }
        if (message.length > 5000) {
            return NextResponse.json({ error: 'Message is too long' }, { status: 400 })
        }

        // Send ticket email
        await sendTicketEmail(name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim())

        return NextResponse.json({
            success: true,
            message: 'Ticket submitted successfully',
        })
    } catch (error) {
        console.error('Error submitting ticket:', error)

        // Return appropriate error message
        if (error instanceof Error && error.message.includes('email')) {
            return NextResponse.json(
                { error: 'Failed to send email. Please check email configuration.' },
                { status: 500 }
            )
        } else {
            return NextResponse.json(
                { error: 'Failed to submit ticket. Please try again.' },
                { status: 500 }
            )
        }
    }
}

