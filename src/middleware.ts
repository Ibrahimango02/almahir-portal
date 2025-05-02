
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'


export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const path = request.nextUrl.pathname;

    // Skip authentication check for the root path and public paths
    if (path === '/') {
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
        '/admin/teachers': ['admin'],       // Add student routes later
        '/admin/parents': ['admin'],
        '/admin/students': ['admin'],
        '/admin/invoices': ['admin'],
        '/admin/settings': ['admin'],
        '/teacher/dashboard': ['teacher'],
        '/teacher/schedule': ['teacher'],
        '/teacher/students': ['teacher'],
        '/teacher/settings': ['teacher'],
        '/parent/dashboard': ['parent'],
        '/parent/students': ['parent'],
        '/parent/invoices': ['parent'],
        '/parent/settings': ['parent'],
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