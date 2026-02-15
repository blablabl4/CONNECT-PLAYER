import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: List all products (admin view — includes inactive)
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: { variations: true },
            orderBy: { created_at: 'desc' },
        });

        // Get credential counts for dynamic stock
        const credentialCounts = await prisma.credential.groupBy({
            by: ['product_id', 'variation_id'],
            where: { is_used: false },
            _count: { id: true },
        });

        const stockMap = new Map<string, number>();
        for (const c of credentialCounts) {
            // Skip credentials without product_id (unlinked credentials)
            if (!c.product_id) continue;

            if (c.variation_id) {
                stockMap.set(`${c.product_id}:${c.variation_id}`, c._count.id);
            }
            const current = stockMap.get(c.product_id) || 0;
            stockMap.set(c.product_id, current + c._count.id);
        }

        return NextResponse.json(products.map((p: any) => ({
            ...p,
            price: Number(p.price),
            stock: stockMap.has(p.id) ? stockMap.get(p.id)! : p.stock,
            variations: p.variations.map((v: any) => ({
                ...v,
                price: Number(v.price),
                original_price: v.original_price ? Number(v.original_price) : null,
                stock: stockMap.has(`${p.id}:${v.id}`) ? stockMap.get(`${p.id}:${v.id}`)! : v.stock,
            })),
        })));
    } catch (error) {
        console.error('Admin products GET error:', error);
        return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
    }
}

// POST: Create product (with optional variations)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, price, image_url, category, duration, is_active, stock, features, variations } = body;

        const product = await prisma.product.create({
            data: {
                name,
                description: description || '',
                price: price || 0,
                image_url: image_url || '',
                category: category || '',
                duration: duration || '30 dias',
                is_active: is_active !== false,
                stock: stock || 0,
                features: features || [],
                variations: variations?.length ? {
                    create: variations.map((v: { name: string; description?: string; price: number; original_price?: number; duration?: string; stock?: number; credential_id?: string }) => ({
                        name: v.name,
                        description: v.description || null,
                        price: v.price,
                        original_price: v.original_price || null,
                        duration: v.duration || null,
                        stock: v.stock || 0,
                    })),
                } : undefined,
            },
            include: { variations: true },
        });

        // Link credentials to variations if provided
        if (variations?.length) {
            for (let i = 0; i < variations.length; i++) {
                const v = variations[i];
                if (v.credential_id && product.variations[i]) {
                    await prisma.credential.update({
                        where: { id: v.credential_id },
                        data: {
                            product_id: product.id,
                            variation_id: product.variations[i].id,
                        },
                    });
                }
            }
        }

        return NextResponse.json({
            ...product,
            price: Number(product.price),
            variations: product.variations.map((v: any) => ({
                ...v,
                price: Number(v.price),
                original_price: v.original_price ? Number(v.original_price) : null,
            })),
        });
    } catch (error) {
        console.error('Admin products POST error:', error);
        return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
    }
}

// PUT: Update product
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, variations, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }

        // Update product fields
        const product = await prisma.product.update({
            where: { id },
            data: {
                ...data,
                price: data.price !== undefined ? data.price : undefined,
            },
            include: { variations: true },
        });

        // Handle variations update if provided
        if (variations !== undefined) {
            const existingVariations = product.variations;
            const incomingIds = variations.filter((v: any) => v.id).map((v: any) => v.id);

            // Delete variations that are no longer in the list
            const toDelete = existingVariations.filter((ev: any) => !incomingIds.includes(ev.id));
            for (const del of toDelete) {
                await prisma.productVariation.delete({ where: { id: del.id } });
            }

            // Upsert each variation
            for (const v of variations) {
                if (v.id && existingVariations.some((ev: any) => ev.id === v.id)) {
                    // Update existing — preserves credential FK
                    await prisma.productVariation.update({
                        where: { id: v.id },
                        data: {
                            name: v.name,
                            description: v.description || null,
                            price: v.price,
                            original_price: v.original_price || null,
                            duration: v.duration || null,
                            stock: v.stock || 0,
                        },
                    });

                    // Link credential if provided
                    if (v.credential_id) {
                        await prisma.credential.update({
                            where: { id: v.credential_id },
                            data: {
                                product_id: id,
                                variation_id: v.id,
                            },
                        });
                    }
                } else {
                    // Create new variation
                    const newVariation = await prisma.productVariation.create({
                        data: {
                            product_id: id,
                            name: v.name,
                            description: v.description || null,
                            price: v.price,
                            original_price: v.original_price || null,
                            duration: v.duration || null,
                            stock: v.stock || 0,
                        },
                    });

                    // Link credential if provided
                    if (v.credential_id) {
                        await prisma.credential.update({
                            where: { id: v.credential_id },
                            data: {
                                product_id: id,
                                variation_id: newVariation.id,
                            },
                        });
                    }
                }
            }
        }

        // Re-fetch with variations
        const updated = await prisma.product.findUnique({
            where: { id },
            include: { variations: true },
        });

        return NextResponse.json({
            ...updated,
            price: Number(updated!.price),
            variations: updated!.variations.map((v: any) => ({
                ...v,
                price: Number(v.price),
                original_price: v.original_price ? Number(v.original_price) : null,
            })),
        });
    } catch (error) {
        console.error('Admin products PUT error:', error);
        return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
    }
}

// DELETE: Delete product
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }

        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin products DELETE error:', error);
        return NextResponse.json({ error: 'Erro ao deletar produto' }, { status: 500 });
    }
}
