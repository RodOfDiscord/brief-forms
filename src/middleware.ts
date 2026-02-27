import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/jwt';

export const config = {
    matcher: ['/dashboard/:path*', '/auth/login'],
};

export async function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const token = request.cookies.get('admin_token')?.value;

    // Redirect authenticated admins away from login page
    if (pathname === '/auth/login') {
        if (token) {
            const payload = await verifyAdminToken(token);
            if (payload) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
        }
        return NextResponse.next();
    }

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
        if (!token) {
            const loginUrl = new URL('/auth/login', request.url);
            // Append current path and query string as callbackUrl
            loginUrl.searchParams.set('callbackUrl', pathname + search);
            return NextResponse.redirect(loginUrl);
        }

        const payload = await verifyAdminToken(token);
        if (!payload) {
            // Clear invalid token
            const loginUrl = new URL('/auth/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname + search);
            const response = NextResponse.redirect(loginUrl);
            response.cookies.set('admin_token', '', { maxAge: 0, path: '/' });
            return response;
        }
    }

    return NextResponse.next();
}
