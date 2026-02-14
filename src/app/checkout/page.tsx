'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Product } from '@/lib/types';

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const productId = searchParams.get('produto') || '';
    const variationId = searchParams.get('variacao');
    const variationName = searchParams.get('variacao_nome');
    const priceParam = searchParams.get('preco');
    const qtyParam = searchParams.get('qty');

    const quantity = Math.max(1, parseInt(qtyParam || '1', 10));

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
            if (!productId) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`/api/products/${productId}`);
                if (res.ok) {
                    const data = await res.json();
                    setProduct(data);
                }
            } catch {
                // ignore
            }
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
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: product?.id,
                    variation_id: variationId,
                    variation_name: variationName ? decodeURIComponent(variationName) : undefined,
                    quantity,
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_whatsapp: formData.whatsapp,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                // Store Pix data in sessionStorage so the order page can display it
                if (data.qr_code_base64 || data.qr_code) {
                    sessionStorage.setItem(`pix_${data.order_id}`, JSON.stringify({
                        qr_code_base64: data.qr_code_base64,
                        qr_code: data.qr_code,
                        total: data.total,
                    }));
                }
                router.push(`/pedido/${data.order_id}`);
                return;
            } else {
                const err = await res.json();
                alert(`Erro: ${err.error || 'Erro ao processar pedido'}`);
                setSubmitting(false);
                return;
            }
        } catch (error: any) {
            alert(`Erro: ${error.message || 'Erro ao processar pedido'}`);
            setSubmitting(false);
        }
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

    const unitPrice = priceParam ? parseFloat(priceParam) : product.price;
    const totalPrice = unitPrice * quantity;

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
                                {submitting ? 'Processando...' : `Pagar R$ ${totalPrice.toFixed(2)} via Pix`}
                            </button>
                        </form>
                    </div>

                    {/* Summary */}
                    <div className="checkout-summary">
                        <div className="checkout-summary-title">Resumo do Pedido</div>

                        <div className="checkout-item">
                            <div className="checkout-item-image">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                ) : (
                                    <div style={{
                                        width: '100%', height: '100%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'var(--bg-secondary)',
                                        fontSize: '1.5rem',
                                    }}>
                                        {product.category === 'Música' ? '🎵' : product.category === 'IPTV' ? '📺' : '🎬'}
                                    </div>
                                )}
                            </div>
                            <div className="checkout-item-info">
                                <div className="checkout-item-name">{product.name}</div>
                                {variationName && <div style={{ fontSize: '0.9rem', color: 'var(--accent-gold)' }}>{decodeURIComponent(variationName)}</div>}
                                <div className="checkout-item-plan">{product.duration}</div>
                                {quantity > 1 && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {quantity}x R$ {unitPrice.toFixed(2)}
                                    </div>
                                )}
                            </div>
                            <div className="checkout-item-price">R$ {totalPrice.toFixed(2)}</div>
                        </div>

                        <div className="checkout-total">
                            <span>Total</span>
                            <span className="checkout-total-value">R$ {totalPrice.toFixed(2)}</span>
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
