import { createMiddlewareClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'


export async function middleware(request: NextRequest) {
    const supabaseResponse = NextResponse.next({
        request,
    })
    const supabase = createMiddlewareClient(request, supabaseResponse)

    const path = request.nextUrl.pathname;

    // Skip authentication check for the root path and public paths
    if (path === '/' || path.startsWith('/signup/') || path.startsWith('/api/validate-invitation/') || path.startsWith('/api/accept-invitation') || path.startsWith('/api/send-invitation')) {
        return supabaseResponse;
    }

    // Get the user's session
    const { data: { user } } = await supabase.auth.getUser();

    // If no session, redirect to login
    if (!user) {
        const redirectUrl = new URL('/', request.url);
        return NextResponse.redirect(redirectUrl);
    }

    // Get user profile with role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = profile?.role;

    // Define route permissions with role-based access control
    const roleBasedRoutes: Record<string, string[]> = {
        'admin': ['/admin'],
        'moderator': ['/admin'],
        'teacher': ['/teacher'],
        'student': ['/student'],
        'parent': ['/parent']
    };

    // Check if the path starts with any role-specific prefix
    const userAllowedPrefixes = roleBasedRoutes[role as keyof typeof roleBasedRoutes] || [];
    const pathStartsWithAllowedPrefix = userAllowedPrefixes.some((prefix: string) => path.startsWith(prefix));

    // If the path starts with a role-specific prefix but not the user's role, deny access
    const allRolePrefixes = Object.values(roleBasedRoutes).flat();
    const pathStartsWithAnyRolePrefix = allRolePrefixes.some((prefix: string) => path.startsWith(prefix));

    if (pathStartsWithAnyRolePrefix && !pathStartsWithAllowedPrefix) {
        return NextResponse.redirect(new URL('/error', request.url));
    }

    // Additional restrictions for moderator role
    if (role === 'moderator') {
        // Moderators cannot access admins and accounting pages
        if (path.startsWith('/admin/admins') || path.startsWith('/admin/accounting') || path.startsWith('/admin/invite')) {
            return NextResponse.redirect(new URL('/error', request.url));
        }
    }

    return supabaseResponse;
}


export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|md)$).*)',
    ],
}