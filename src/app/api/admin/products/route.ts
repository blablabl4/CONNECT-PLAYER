import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: List all products (admin view — includes inactive)
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: { variations: { include: { credentials: true } } },
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json(products.map((p: any) => {
            let totalStock = 0;
            const vars = p.variations.map((v: any) => {
                // Stock = sum of remaining uses across ALL linked credentials
                let varStock = 0;
                const credIds: string[] = [];
                for (const c of (v.credentials || [])) {
                    if (c.current_uses < c.max_uses) {
                        varStock += c.max_uses - c.current_uses;
                    }
                    credIds.push(c.id);
                }
                totalStock += varStock;
                return {
                    ...v,
                    price: Number(v.price),
                    original_price: v.original_price ? Number(v.original_price) : null,
                    stock: varStock,
                    credential_ids: credIds,
                    credentials: undefined,
                };
            });
            return {
                ...p,
                price: Number(p.price),
                stock: totalStock,
                variations: vars,
            };
        }));
    } catch (error) {
        console.error('Admin products GET error:', error);
        return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
    }
}

// POST: Create product (requires at least 1 variation)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, price, image_url, category, duration, is_active, features, variations } = body;

        if (!variations || !Array.isArray(variations) || variations.length === 0) {
            return NextResponse.json({ error: 'O produto precisa ter pelo menos 1 variação' }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description: description || '',
                price: price || 0,
                image_url: image_url || '',
                category: category || '',
                duration: duration || '30 dias',
                is_active: is_active !== false,
                stock: 0,
                features: features || [],
                variations: {
                    create: variations.map((v: any) => ({
                        name: v.name,
                        description: v.description || null,
                        price: v.price,
                        original_price: v.original_price || null,
                        duration: v.duration || null,
                        stock: 0,
                    })),
                },
            },
            include: { variations: true },
        });

        // Link credentials to variations (supports multiple per variation)
        for (let i = 0; i < variations.length; i++) {
            const credIds = variations[i].credential_ids || (variations[i].credential_id ? [variations[i].credential_id] : []);
            if (credIds.length > 0 && product.variations[i]) {
                for (const credId of credIds) {
                    await prisma.credential.update({
                        where: { id: credId },
                        data: {
                            variation_id: product.variations[i].id,
                            product_id: product.id,
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

        const product = await prisma.product.update({
            where: { id },
            data: { ...data, price: data.price !== undefined ? data.price : undefined },
            include: { variations: true },
        });

        if (variations !== undefined) {
            const existingVariations = product.variations;
            const incomingIds = variations.filter((v: any) => v.id).map((v: any) => v.id);

            // Delete removed variations
            const toDelete = existingVariations.filter((ev: any) => !incomingIds.includes(ev.id));
            for (const del of toDelete) {
                // Unlink credentials from deleted variations
                await prisma.credential.updateMany({
                    where: { variation_id: del.id },
                    data: { variation_id: null, product_id: null },
                });
                await prisma.productVariation.delete({ where: { id: del.id } });
            }

            // Upsert each variation
            for (const v of variations) {
                const varData = {
                    name: v.name,
                    description: v.description || null,
                    price: v.price,
                    original_price: v.original_price || null,
                    duration: v.duration || null,
                    stock: 0,
                };

                let varId: string;

                if (v.id && existingVariations.some((ev: any) => ev.id === v.id)) {
                    await prisma.productVariation.update({ where: { id: v.id }, data: varData });
                    varId = v.id;
                } else {
                    const created = await prisma.productVariation.create({ data: { product_id: id, ...varData } });
                    varId = created.id;
                }

                // Unlink old credentials from this variation
                await prisma.credential.updateMany({
                    where: { variation_id: varId },
                    data: { variation_id: null, product_id: null },
                });

                // Link new credentials (supports multiple)
                const credIds = v.credential_ids || (v.credential_id ? [v.credential_id] : []);
                for (const credId of credIds) {
                    await prisma.credential.update({
                        where: { id: credId },
                        data: {
                            variation_id: varId,
                            product_id: id,
                        },
                    });
                }
            }
        }

        const updated = await prisma.product.findUnique({
            where: { id },
            include: { variations: { include: { credentials: true } } },
        });

        return NextResponse.json({
            ...updated, price: Number(updated!.price),
            variations: updated!.variations.map((v: any) => {
                const credIds = (v.credentials || []).map((c: any) => c.id);
                return {
                    ...v, price: Number(v.price),
                    original_price: v.original_price ? Number(v.original_price) : null,
                    credential_ids: credIds,
                    credentials: undefined,
                };
            }),
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
        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

        // Unlink all credentials from this product's variations
        await prisma.credential.updateMany({
            where: { product_id: id },
            data: { variation_id: null, product_id: null },
        });

        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin products DELETE error:', error);
        return NextResponse.json({ error: 'Erro ao deletar produto' }, { status: 500 });
    }
}
