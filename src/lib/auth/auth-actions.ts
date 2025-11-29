'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function login(formData: FormData) {
    const cookieStore = await cookies()
    const rememberMe = formData.get('rememberMe') === 'true'

    // Create Supabase client with custom cookie handling for "Remember me"
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            // If "Remember me" is checked, set cookies to expire in 30 days
                            if (rememberMe && options) {
                                options.maxAge = 30 * 24 * 60 * 60 // 30 days in seconds
                                options.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            }
                            cookieStore.set(name, value, options)
                        })
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

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
        case 'moderator':
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

export async function fetchUserRole(userId: string) {
    const supabase = await createClient()

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

        return profile?.role || null
    } catch (error) {
        console.error('Error fetching user role:', error)
        return null
    }
}

export async function checkSessionAndGetDashboard() {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { isAuthenticated: false, dashboardUrl: null }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role
        let dashboardUrl = null

        switch (role) {
            case 'admin':
                dashboardUrl = '/admin/dashboard'
                break
            case 'moderator':
                dashboardUrl = '/admin/dashboard'
                break
            case 'teacher':
                dashboardUrl = '/teacher/dashboard'
                break
            case 'parent':
                dashboardUrl = '/parent/dashboard'
                break
            case 'student':
                dashboardUrl = '/student/dashboard'
                break
            default:
                dashboardUrl = null
        }

        return { isAuthenticated: true, dashboardUrl }
    } catch (error) {
        console.error('Error checking session:', error)
        return { isAuthenticated: false, dashboardUrl: null }
    }
}

export async function sendPasswordResetEmail(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    if (!email) {
        return { error: 'Email is required' }
    }

    // Even if user doesn't exist in profiles, try to send reset email
    // Supabase will handle the case where the email doesn't exist
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
        console.error('Error sending password reset email:', error)
        return { error: 'Failed to send password reset email. Please try again.' }
    }

    // Always return success for security (don't reveal if email exists)
    return { success: true }
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || !confirmPassword) {
        return { error: 'Both password fields are required' }
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters long' }
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
    })

    if (error) {
        console.error('Error resetting password:', error)
        return { error: error.message || 'Failed to reset password. The link may have expired.' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function adminUpdateUserPassword(userId: string, newPassword: string) {
    // Check if current user is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized: You must be logged in' }
    }

    // Get current user's role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized: Only admins can reset passwords' }
    }

    // Validate password
    if (!newPassword || newPassword.length < 8) {
        return { error: 'Password must be at least 8 characters long' }
    }

    // Use service role key for admin operations
    const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
    })

    if (error) {
        console.error('Error updating user password:', error)
        return { error: error.message || 'Failed to update password' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}