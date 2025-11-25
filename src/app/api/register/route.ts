import { NextRequest, NextResponse } from 'next/server'
import { sendRegistrationEmail } from '@/lib/utils/email'

export async function POST(request: NextRequest) {
    try {
        const { name, email, country, whatsapp, comments } = await request.json()

        // Validate required fields
        if (!name || !email || !country || !whatsapp) {
            return NextResponse.json(
                { error: 'Name, email, country, and WhatsApp are required' },
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
        if (country.length > 100) {
            return NextResponse.json({ error: 'Country name is too long' }, { status: 400 })
        }
        if (whatsapp.length > 50) {
            return NextResponse.json({ error: 'WhatsApp number is too long' }, { status: 400 })
        }
        if (comments && comments.length > 2000) {
            return NextResponse.json({ error: 'Comments are too long' }, { status: 400 })
        }

        // Send registration email
        await sendRegistrationEmail(
            name.trim(),
            email.trim().toLowerCase(),
            country.trim(),
            whatsapp.trim(),
            comments?.trim() || ''
        )

        return NextResponse.json({
            success: true,
            message: 'Registration submitted successfully',
        })
    } catch (error) {
        console.error('Error submitting registration:', error)

        // Return appropriate error message
        if (error instanceof Error && error.message.includes('email')) {
            return NextResponse.json(
                { error: 'Failed to send email. Please check email configuration.' },
                { status: 500 }
            )
        } else {
            return NextResponse.json(
                { error: 'Failed to submit registration. Please try again.' },
                { status: 500 }
            )
        }
    }
}

