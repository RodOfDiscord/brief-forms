import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/jwt';

export const config = {
    matcher: ['/dashboard/:path*', '/auth/login'],
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
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
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        const payload = await verifyAdminToken(token);
        if (!payload) {
            // Clear invalid token
            const response = NextResponse.redirect(
                new URL('/auth/login', request.url)
            );
            response.cookies.set('admin_token', '', { maxAge: 0, path: '/' });
            return response;
        }
    }

    return NextResponse.next();
}
