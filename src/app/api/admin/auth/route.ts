import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@connectplayer.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        if (email === adminEmail && password === adminPassword) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
