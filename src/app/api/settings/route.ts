import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Public settings API - returns only non-sensitive settings
export async function GET() {
    try {
        const settings = await prisma.setting.findMany();
        const all: Record<string, string> = {};
        settings.forEach((s: { key: string; value: string }) => { all[s.key] = s.value; });

        // Only expose public (non-sensitive) settings
        return NextResponse.json({
            store_name: all.store_name || 'Connect Player',
            store_email: all.store_email || '',
            whatsapp: all.whatsapp || '',
            instagram: all.instagram || '',
        });
    } catch {
        return NextResponse.json({
            store_name: 'Connect Player',
            store_email: '',
            whatsapp: '',
            instagram: '',
        });
    }
}
