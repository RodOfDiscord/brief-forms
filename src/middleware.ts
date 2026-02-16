import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth/jwt';

export const config = {
    matcher: ['/dashboard/:path*'],
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('admin_token')?.value;

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
