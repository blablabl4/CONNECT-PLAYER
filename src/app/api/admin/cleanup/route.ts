import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        // 1. Delete Orders
        await prisma.order.deleteMany({});

        // 2. Delete Credentials
        await prisma.credential.deleteMany({});

        // 3. Delete Variations
        await prisma.productVariation.deleteMany({});

        // 4. Delete Products
        await prisma.product.deleteMany({});

        return NextResponse.json({ message: 'Database cleaned successfully' });
    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ error: 'Failed to clean DB', details: String(error) }, { status: 500 });
    }
}
