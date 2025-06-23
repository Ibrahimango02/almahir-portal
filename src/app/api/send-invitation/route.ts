import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sendInvitationEmail } from '@/lib/utils/email'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations
)

export async function POST(request: NextRequest) {
    const { fullName, email, role } = await request.json()

    // Validate input
    if (!fullName || !email || !role) {
        return NextResponse.json({ error: 'Full name, email, and role are required' }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['admin', 'teacher', 'parent', 'student']
    if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 })
    }

    try {
        // Check if user is already invited or registered
        const { data: existingInvitation } = await supabase
            .from('invitations')
            .select('*')
            .eq('email', email)
            .eq('status', 'pending')
            .single()

        if (existingInvitation) {
            return NextResponse.json({ error: 'User already has a pending invitation' }, { status: 400 })
        }

        // Generate secure invitation token for URL
        const invitationToken = crypto.randomBytes(32).toString('hex')

        // Set expiration (7 days from now)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        // Insert invitation into database
        const { data, error } = await supabase
            .from('invitations')
            // Split fullName into first and last name
            .insert({
                email: email.toLowerCase(), // Store email in lowercase
                first_name: fullName.trim().split(' ')[0],
                last_name: fullName.trim().split(' ').slice(1).join(' '),
                role: role,
                invitation_token: invitationToken,
                expires_at: expiresAt.toISOString(),
                // invited_by: can be added later when you have user authentication
            })
            .select()
            .single()

        if (error) {
            console.error('Database error:', error)
            throw new Error('Failed to create invitation')
        }

        // Send email with unique signup URL
        await sendInvitationEmail(email, fullName, invitationToken, role)

        console.log(`Invitation sent successfully to ${email} with token ${invitationToken}`)

        return NextResponse.json({
            success: true,
            message: 'Invitation sent successfully',
            invitationId: data.id
        })
    } catch (error) {
        console.error('Error sending invitation:', error)

        // Return appropriate error message
        if (error instanceof Error && error.message.includes('email')) {
            return NextResponse.json({ error: 'Failed to send email. Please check email configuration.' }, { status: 500 })
        } else {
            return NextResponse.json({ error: 'Failed to send invitation. Please try again.' }, { status: 500 })
        }
    }
}