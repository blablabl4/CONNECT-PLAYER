'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Product } from '@/lib/types';

const DEMO_PRODUCTS: Record<string, Product> = {
    '1': { id: '1', name: 'Netflix Premium', description: '', price: 19.90, image_url: '', category: 'Streaming', duration: '30 dias', is_active: true, stock: 50, features: [], created_at: '', updated_at: '' },
    '2': { id: '2', name: 'Spotify Premium', description: '', price: 9.90, image_url: '', category: 'Música', duration: '30 dias', is_active: true, stock: 100, features: [], created_at: '', updated_at: '' },
    '3': { id: '3', name: 'Disney+ Premium', description: '', price: 14.90, image_url: '', category: 'Streaming', duration: '30 dias', is_active: true, stock: 30, features: [], created_at: '', updated_at: '' },
    '4': { id: '4', name: 'IPTV Full HD', description: '', price: 29.90, image_url: '', category: 'IPTV', duration: '30 dias', is_active: true, stock: 200, features: [], created_at: '', updated_at: '' },
    '5': { id: '5', name: 'HBO Max', description: '', price: 14.90, image_url: '', category: 'Streaming', duration: '30 dias', is_active: true, stock: 40, features: [], created_at: '', updated_at: '' },
    '6': { id: '6', name: 'Crunchyroll Premium', description: '', price: 9.90, image_url: '', category: 'Streaming', duration: '30 dias', is_active: true, stock: 60, features: [], created_at: '', updated_at: '' },
};

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const productId = searchParams.get('produto') || '1';
    const variationId = searchParams.get('variacao');
    const variationName = searchParams.get('variacao_nome');
    const priceParam = searchParams.get('preco');

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        emailConfirm: '',
        whatsapp: '',
    });

    useEffect(() => {
        async function fetchProduct() {
            try {
                const res = await fetch(`/api/products/${productId}`);
                if (res.ok) {
                    const data = await res.json();
                    setProduct(data);
                    setLoading(false);
                    return;
                }
            } catch {
                // fallback
            }
            setProduct(DEMO_PRODUCTS[productId] || null);
            setLoading(false);
        }
        fetchProduct();
    }, [productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.email !== formData.emailConfirm) {
            alert('Os e-mails não coincidem!');
            return;
        }

        setSubmitting(true);

        try {
            // Try API first
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: product?.id,
                    variation_id: variationId,
                    variation_name: variationName ? decodeURIComponent(variationName) : undefined,
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_whatsapp: formData.whatsapp,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/pedido/${data.order_id}`);
                return;
            } else {
                const err = await res.json();
                alert(`Erro: ${err.error || 'Erro ao processar pedido'}`);
                setSubmitting(false);
                return;
            }
        } catch {
            // Demo mode fallthrough
        }

        // Demo: simulate order creation
        const demoId = 'demo-' + Date.now();
        router.push(`/pedido/${demoId}`);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--header-height)' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="status-page">
                <div className="container">
                    <div className="status-card">
                        <h2 className="status-title">Produto não encontrado</h2>
                        <button className="btn btn-primary" onClick={() => router.push('/')}>Voltar</button>
                    </div>
                </div>
            </div>
        );
    }

    const displayPrice = priceParam ? parseFloat(priceParam) : product.price;

    return (
        <section className="checkout">
            <div className="container">
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '32px' }}>
                    Finalizar <span className="gold-text">Compra</span>
                </h1>

                <div className="checkout-grid">
                    {/* Form */}
                    <div className="checkout-form-section">
                        <div className="checkout-form-title">
                            📝 Seus dados
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Nome completo *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Seu nome"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">E-mail * (para receber as credenciais)</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="seu@email.com"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirme o e-mail *</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="seu@email.com"
                                    required
                                    value={formData.emailConfirm}
                                    onChange={e => setFormData(prev => ({ ...prev, emailConfirm: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">WhatsApp (opcional)</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="(00) 00000-0000"
                                    value={formData.whatsapp}
                                    onChange={e => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                                />
                            </div>

                            <div style={{
                                padding: '16px',
                                background: 'var(--accent-gold-soft)',
                                border: '1px solid rgba(229, 168, 53, 0.2)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '24px',
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.6',
                            }}>
                                ⚡ <strong style={{ color: 'var(--accent-gold)' }}>Entrega instantânea:</strong> As credenciais serão enviadas automaticamente
                                para o e-mail informado logo após a confirmação do pagamento.
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg btn-block"
                                disabled={submitting}
                            >
                                {submitting ? 'Processando...' : `Pagar R$ ${displayPrice.toFixed(2)} via Pix`}
                            </button>
                        </form>
                    </div>

                    {/* Summary */}
                    <div className="checkout-summary">
                        <div className="checkout-summary-title">Resumo do Pedido</div>

                        <div className="checkout-item">
                            <div className="checkout-item-image">
                                <div style={{
                                    width: '100%', height: '100%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'var(--bg-secondary)',
                                    fontSize: '1.5rem',
                                }}>
                                    {product.category === 'Música' ? '🎵' : product.category === 'IPTV' ? '📺' : '🎬'}
                                </div>
                            </div>
                            <div className="checkout-item-info">
                                <div className="checkout-item-name">{product.name}</div>
                                {variationName && <div style={{ fontSize: '0.9rem', color: 'var(--accent-gold)' }}>{decodeURIComponent(variationName)}</div>}
                                <div className="checkout-item-plan">{product.duration}</div>
                            </div>
                            <div className="checkout-item-price">R$ {displayPrice.toFixed(2)}</div>
                        </div>

                        <div className="checkout-total">
                            <span>Total</span>
                            <span className="checkout-total-value">R$ {displayPrice.toFixed(2)}</span>
                        </div>

                        <div style={{
                            display: 'flex', flexDirection: 'column', gap: '12px',
                            marginTop: '24px', padding: '16px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <span>🔒</span> <span>Pagamento 100% seguro</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <span>⚡</span> <span>Entrega imediata por e-mail</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <span>💬</span> <span>Suporte via WhatsApp</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function CheckoutPage() {
    return (
        <>
            <Header />
            <Suspense fallback={
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--header-height)' }}>
                    <div className="spinner" />
                </div>
            }>
                <CheckoutContent />
            </Suspense>
            <Footer />
        </>
    );
}
