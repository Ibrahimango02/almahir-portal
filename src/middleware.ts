import { updateSession } from '@/utils/supabase/middleware'
import { createMiddlewareClient } from '@/utils/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'


export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
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
    //const path = request.nextUrl.pathname;

    // Define route permissions
    const protectedRoutes = {
        '/admin/dashboard': ['admin'],
        '/admin/schedule': ['admin'],
        '/admin/classes': ['admin'],
        '/admin/admins': ['admin'],
        '/admin/teachers': ['admin'],
        '/admin/students': ['admin'],
        '/admin/parents': ['admin'],
        '/admin/invoices': ['admin'],
        '/admin/resources': ['admin'],
        '/admin/settings': ['admin'],
        '/teacher/dashboard': ['teacher'],
        '/teacher/schedule': ['teacher'],
        '/teacher/classes': ['teacher'],
        '/teacher/students': ['teacher'],
        '/teacher/parents': ['teacher'],
        '/teacher/resources': ['teacher'],
        '/teacher/settings': ['teacher'],
        '/student/dashboard': ['student'],
        '/student/schedule': ['student'],
        '/student/classes': ['student'],
        '/student/resources': ['student'],
        '/student/invoices': ['student'],
        '/student/settings': ['student'],
        '/parent/dashboard': ['parent'],
        '/parent/schedule': ['parent'],
        '/parent/classes': ['parent'],
        '/parent/students': ['parent'],
        '/parent/resources': ['parent'],
        '/parent/invoices': ['parent'],
        '/parent/settings': ['parent']
    };

    // Check access for exact path matches
    for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
        if (path === route && !allowedRoles.includes(role)) {
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
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}