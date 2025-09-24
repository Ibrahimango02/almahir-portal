import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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