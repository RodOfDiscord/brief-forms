import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { signAdminToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email та пароль обов\'язкові' },
                { status: 400 }
            );
        }

        const supabase = createAdminSupabaseClient();

        // Authenticate via Supabase Auth
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return NextResponse.json(
                { error: 'Невірний email або пароль' },
                { status: 401 }
            );
        }

        // Issue our own JWT
        const token = await signAdminToken(email);

        const response = NextResponse.json({ success: true });

        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return response;
    } catch {
        return NextResponse.json(
            { error: 'Помилка сервера' },
            { status: 500 }
        );
    }
}
