import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-change-me-in-env'
);

export interface AdminTokenPayload extends JWTPayload {
    email: string;
    role: 'admin';
}

export async function signAdminToken(email: string): Promise<string> {
    return new SignJWT({ email, role: 'admin' } as AdminTokenPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);
}

export async function verifyAdminToken(
    token: string
): Promise<AdminTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as AdminTokenPayload;
    } catch {
        return null;
    }
}
