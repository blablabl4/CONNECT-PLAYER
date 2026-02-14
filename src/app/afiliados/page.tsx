'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ParticleBackground from '@/components/ParticleBackground';

export default function AfiliadosPage() {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
    const [result, setResult] = useState<{ link: string; already_exists: boolean; code: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/affiliates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao cadastrar');
            }

            setResult({
                link: data.link,
                already_exists: data.already_exists,
                code: data.affiliate.code,
            });
        } catch (err: any) {
            setError(err.message || 'Erro ao cadastrar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const copyLink = async () => {
        if (result?.link) {
            await navigator.clipboard.writeText(result.link);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const formatPhone = (value: string) => {
        const nums = value.replace(/\D/g, '').substring(0, 11);
        if (nums.length <= 2) return `(${nums}`;
        if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
        return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
    };

    return (
        <>
            <Header />
            <ParticleBackground />

            <section style={{
                minHeight: '100vh',
                paddingTop: '120px',
                paddingBottom: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div className="container" style={{ maxWidth: '520px' }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '16px',
                        }}>🤝</div>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: '12px',
                        }}>
                            Programa de <span className="gold-text">Afiliados</span>
                        </h1>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '1rem',
                            lineHeight: 1.6,
                        }}>
                            Divulgue seu link exclusivo e acompanhe quantas pessoas visitam a loja através de você!
                        </p>
                    </div>

                    {!result ? (
                        /* Registration Form */
                        <form onSubmit={handleSubmit} style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '32px',
                        }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    marginBottom: '8px',
                                    fontWeight: 500,
                                }}>Nome completo</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Seu nome"
                                    value={formData.name}
                                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '10px',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    marginBottom: '8px',
                                    fontWeight: 500,
                                }}>Telefone (WhatsApp)</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="(99) 99999-9999"
                                    value={formData.phone}
                                    onChange={e => setFormData(f => ({ ...f, phone: formatPhone(e.target.value) }))}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '10px',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    marginBottom: '8px',
                                    fontWeight: 500,
                                }}>Email</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="seu@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '10px',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            {error && (
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    borderRadius: '10px',
                                    color: '#ef4444',
                                    fontSize: '0.9rem',
                                    marginBottom: '16px',
                                }}>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    opacity: loading ? 0.7 : 1,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {loading ? 'Cadastrando...' : 'Gerar Meu Link de Afiliado 🚀'}
                            </button>
                        </form>
                    ) : (
                        /* Result */
                        <div style={{
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            padding: '32px',
                            textAlign: 'center',
                        }}>
                            {result.already_exists ? (
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'rgba(245,158,11,0.1)',
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    borderRadius: '10px',
                                    color: '#f59e0b',
                                    fontSize: '0.9rem',
                                    marginBottom: '24px',
                                }}>
                                    ⚠️ Você já possui um link de afiliado! Aqui está ele:
                                </div>
                            ) : (
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'rgba(34,197,94,0.1)',
                                    border: '1px solid rgba(34,197,94,0.3)',
                                    borderRadius: '10px',
                                    color: '#22c55e',
                                    fontSize: '0.9rem',
                                    marginBottom: '24px',
                                }}>
                                    ✅ Cadastro realizado com sucesso!
                                </div>
                            )}

                            <p style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem',
                                marginBottom: '16px',
                            }}>
                                Seu link exclusivo de afiliado:
                            </p>

                            <div style={{
                                padding: '16px',
                                background: 'var(--surface)',
                                border: '1px solid var(--gold)',
                                borderRadius: '12px',
                                marginBottom: '20px',
                                wordBreak: 'break-all',
                            }}>
                                <code style={{
                                    color: 'var(--gold)',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                }}>
                                    {result.link}
                                </code>
                            </div>

                            <button
                                onClick={copyLink}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    marginBottom: '16px',
                                }}
                            >
                                {copied ? '✅ Link Copiado!' : '📋 Copiar Link'}
                            </button>

                            <div style={{
                                padding: '16px',
                                background: 'rgba(212,160,74,0.05)',
                                borderRadius: '10px',
                                border: '1px solid rgba(212,160,74,0.15)',
                            }}>
                                <p style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.8rem',
                                    lineHeight: 1.6,
                                    margin: 0,
                                }}>
                                    💡 Compartilhe esse link nas redes sociais, grupos e com amigos.
                                    Cada pessoa que acessar a loja pelo seu link será contabilizada!
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </>
    );
}
