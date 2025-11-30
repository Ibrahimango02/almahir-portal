import { NextRequest, NextResponse } from 'next/server'
import { sendRegistrationEmail, sendRegistrationConfirmationEmail } from '@/lib/utils/email'

export async function POST(request: NextRequest) {
    try {
        const {
            name,
            email,
            country,
            whatsapp,
            phone,
            gender,
            ageCategory,
            age,
            parentGuardianName,
            relationToApplicant,
            firstLanguage,
            program,
            classDuration,
            availability,
            hearAboutUs,
            friendName,
            comments
        } = await request.json()

        // Validate required fields
        if (!name || !email || !country || !whatsapp || !phone || !gender || !ageCategory || !age || !firstLanguage || !program || !classDuration || !hearAboutUs) {
            return NextResponse.json(
                { error: 'All required fields must be filled' },
                { status: 400 }
            )
        }

        // Validate age category specific fields
        if (ageCategory === 'less-than-18' && (!parentGuardianName || !relationToApplicant)) {
            return NextResponse.json(
                { error: 'Parent/guardian information is required for applicants under 18' },
                { status: 400 }
            )
        }

        // Validate availability
        if (!availability || !Array.isArray(availability) || availability.length === 0) {
            return NextResponse.json(
                { error: 'Please select at least one day of availability' },
                { status: 400 }
            )
        }

        // Validate recommendation friend name
        if (hearAboutUs === 'recommendation' && !friendName) {
            return NextResponse.json(
                { error: 'Friend\'s name is required when recommendation is selected' },
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
        if (phone.length > 50) {
            return NextResponse.json({ error: 'Phone number is too long' }, { status: 400 })
        }
        if (comments && comments.length > 2000) {
            return NextResponse.json({ error: 'Comments are too long' }, { status: 400 })
        }

        // Send confirmation email to user
        await sendRegistrationConfirmationEmail(
            name.trim(),
            email.trim().toLowerCase()
        )

        // Send registration notification email to admin (with all form data)
        await sendRegistrationEmail(
            name.trim(),
            email.trim().toLowerCase(),
            country.trim(),
            whatsapp.trim(),
            phone.trim(),
            gender,
            ageCategory,
            age,
            parentGuardianName?.trim() || '',
            relationToApplicant?.trim() || '',
            firstLanguage,
            program,
            classDuration,
            availability,
            hearAboutUs,
            friendName?.trim() || '',
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

