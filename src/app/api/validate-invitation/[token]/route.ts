import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params

    if (!token) {
        return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 })
    }

    try {
        // Find and validate invitation
        const { data: invitation, error: invitationError } = await supabase
            .from('invitations')
            .select('*')
            .eq('invitation_token', token)
            .eq('status', 'pending')
            .single()

        if (invitationError || !invitation) {
            return NextResponse.json({ error: 'Invalid or expired invitation token' }, { status: 400 })
        }

        // Check if invitation has expired
        if (new Date() > new Date(invitation.expires_at)) {
            return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', invitation.email)
            .single()

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 })
        }

        // Return invitation details (without sensitive information)
        return NextResponse.json({
            success: true,
            invitation: {
                email: invitation.email,
                first_name: invitation.first_name,
                last_name: invitation.last_name,
                role: invitation.role
            }
        })

    } catch (error) {
        console.error('Error validating invitation:', error)
        return NextResponse.json({ error: 'Failed to validate invitation' }, { status: 500 })
    }
} 