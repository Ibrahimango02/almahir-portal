import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabase = await createClient();

        // Get all profiles with basic information
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`
        id,
        first_name,
        last_name,
        email,
        role,
        avatar_url,
        status
      `)
            .order('first_name', { ascending: true });

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        return NextResponse.json(profiles || []);
    } catch (error) {
        console.error('Error in users API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, first_name, last_name, role } = body;

        // Validate required fields
        if (!email || !password || !first_name || !last_name || !role) {
            return NextResponse.json(
                { error: 'Email, password, first name, last name, and role are required' },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ['admin', 'moderator', 'teacher', 'parent', 'student'];
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be one of: admin, moderator, teacher, parent, student' },
                { status: 400 }
            );
        }

        // Create service client for admin operations
        const supabaseAdmin = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(user => user.email === email.toLowerCase());
        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists with this email' },
                { status: 400 }
            );
        }

        // Create user in Supabase Auth
        // The trigger will automatically create the profile
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email.toLowerCase(),
            password: password,
            email_confirm: true,
            user_metadata: {
                first_name: first_name.trim(),
                last_name: last_name.trim(),
                role: role
            }
        });

        if (authError) {
            console.error('Auth creation error:', authError);
            return NextResponse.json(
                { error: 'Failed to create user account', details: authError.message },
                { status: 500 }
            );
        }

        console.log(`User account created successfully for ${email}`);

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            user: {
                id: authData.user.id,
                email: authData.user.email,
                first_name: first_name.trim(),
                last_name: last_name.trim(),
                role: role
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Failed to create user. Please try again.' },
            { status: 500 }
        );
    }
} 