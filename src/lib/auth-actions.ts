'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error, data: authData } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/')
    }

    // Get the user's role from the profiles table
    const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

    revalidatePath('/', 'layout')

    // Redirect based on user role
    const role = profileData?.role
    switch (role) {
        case 'admin':
            redirect('/admin/dashboard')
        case 'teacher':
            redirect('/teacher/dashboard')
        case 'parent':
            redirect('/parent/dashboard')
        case 'student':
            redirect('/student/dashboard')
        default:
            // Fallback to default dashboard if role is undefined or not recognized
            redirect('/')
    }
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/error')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function logout() {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
        redirect('/error')
    }

    redirect('/')
}