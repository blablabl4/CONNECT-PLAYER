'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function OrderStatusPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const isDemo = orderId.startsWith('demo-');

    const [status, setStatus] = useState<'pending' | 'paid' | 'delivered'>('pending');

    useEffect(() => {
        if (isDemo) {
            // Simulate payment confirmation after 5 seconds
            const timer = setTimeout(() => setStatus('paid'), 5000);
            return () => clearTimeout(timer);
        }

        // Poll for payment status
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'paid' || data.status === 'delivered') {
                        setStatus(data.status);
                        clearInterval(interval);
                    }
                }
            } catch {
                // keep polling
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [orderId, isDemo]);

    return (
        <>
            <Header />
            <section className="status-page">
                <div className="container">
                    {status === 'pending' ? (
                        <div className="status-card">
                            <div className="status-icon pending">⏳</div>
                            <h2 className="status-title">Aguardando Pagamento</h2>
                            <p className="status-text">
                                Realize o pagamento via Pix para confirmar seu pedido.
                                Após a confirmação, as credenciais serão enviadas automaticamente para o seu e-mail.
                            </p>

                            <div style={{
                                padding: '24px',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '24px',
                            }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                    Escaneie o QR Code ou copie o código Pix
                                </div>
                                <div style={{
                                    width: '180px', height: '180px',
                                    background: '#fff', borderRadius: 'var(--radius-md)',
                                    margin: '0 auto 16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#666', fontSize: '0.75rem', textAlign: 'center', padding: '16px',
                                }}>
                                    QR Code Pix<br />(será gerado via API)
                                </div>
                                <div style={{ display: 'flex', gap: '8px', maxWidth: '360px', margin: '0 auto' }}>
                                    <input
                                        className="form-input"
                                        value="pix-code-placeholder"
                                        readOnly
                                        style={{ flex: 1, fontSize: '0.8rem', textAlign: 'center' }}
                                    />
                                    <button
                                        className="btn btn-outline-gold btn-sm"
                                        onClick={() => navigator.clipboard.writeText('pix-code-placeholder')}
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                                Verificando pagamento automaticamente...
                            </div>

                            <div style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Pedido: <span style={{ color: 'var(--text-secondary)' }}>{orderId.substring(0, 16)}...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="status-card animate-fade-in-up">
                            <div className="status-icon success">✅</div>
                            <h2 className="status-title" style={{ color: 'var(--success)' }}>Pagamento Confirmado!</h2>
                            <p className="status-text">
                                Seu pagamento foi confirmado com sucesso! As credenciais de acesso
                                foram enviadas para o <strong style={{ color: 'var(--text-primary)' }}>e-mail cadastrado</strong>.
                            </p>

                            <div style={{
                                padding: '20px',
                                background: 'rgba(34, 197, 94, 0.08)',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '24px',
                                fontSize: '0.9rem',
                                lineHeight: '1.7',
                            }}>
                                📧 Verifique sua caixa de entrada e também a pasta de spam.
                                <br />Se não receber em até 5 minutos, entre em contato pelo WhatsApp.
                            </div>

                            <button className="btn btn-primary btn-lg" onClick={() => router.push('/')}>
                                Voltar à Loja
                            </button>
                        </div>
                    )}
                </div>
            </section>
            <Footer />
        </>
    );
}
