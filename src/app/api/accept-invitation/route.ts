import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    const { invitationToken, full_name, password } = await request.json()

    // Validate input
    if (!invitationToken || !full_name || !password) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Basic password validation
    if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    try {
        // Find and validate invitation
        const { data: invitation, error: invitationError } = await supabase
            .from('invitations')
            .select('*')
            .eq('invitation_token', invitationToken)
            .eq('status', 'pending')
            .single()

        if (invitationError || !invitation) {
            return NextResponse.json({ error: 'Invalid or expired invitation token' }, { status: 400 })
        }

        // Check if invitation has expired
        if (new Date() > new Date(invitation.expires_at)) {
            return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
        }

        // Check if user already exists in auth
        const { data: existingAuthUser } = await supabase.auth.admin.listUsers()
        const existingUser = existingAuthUser.users.find(user => user.email === invitation.email)
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 })
        }

        // Create user in Supabase Auth
        // The trigger will automatically create the profile
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: invitation.email,
            password: password,
            email_confirm: true, // Auto-confirm email since they have an invitation
            user_metadata: {
                first_name: full_name.trim().split(' ')[0],
                last_name: full_name.trim().split(' ').slice(1).join(' '),
                role: invitation.role || 'admin'
            }
        })

        if (authError) {
            console.error('Auth creation error:', authError)
            return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
        }

        // Update invitation status to accepted
        const { error: updateError } = await supabase
            .from('invitations')
            .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
                accepted_by: authData.user.id
            })
            .eq('id', invitation.id)

        if (updateError) {
            console.error('Invitation update error:', updateError)
            // Don't fail the request if invitation update fails
        }

        console.log(`User account created successfully for ${invitation.email}`)

        return NextResponse.json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: authData.user.id,
                email: authData.user.email,
                full_name: full_name.trim(),
                role: invitation.role || 'admin'
            }
        })

    } catch (error) {
        console.error('Error accepting invitation:', error)
        return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
    }
} 
