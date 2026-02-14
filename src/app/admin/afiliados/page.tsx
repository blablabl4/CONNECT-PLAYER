'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

interface AffiliateData {
    id: string;
    name: string;
    phone: string;
    email: string;
    code: string;
    created_at: string;
    total_visits: number;
    last_visit: string | null;
}

export default function AdminAfiliadosPage() {
    const router = useRouter();
    const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAffiliates = async () => {
        try {
            const res = await fetch('/api/admin/affiliates');
            if (res.ok) {
                const data = await res.json();
                setAffiliates(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('admin_auth')) {
            router.push('/admin/login');
            return;
        }
        fetchAffiliates();
    }, [router]);

    const totalVisits = affiliates.reduce((sum, a) => sum + a.total_visits, 0);

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <div className="admin-header">
                    <h1 className="admin-title">
                        🤝 <span className="gold-text">Afiliados</span>
                    </h1>
                </div>

                {/* Stats Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px',
                }}>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'rgba(212,160,74,0.15)', color: '#d4a04a' }}>🤝</div>
                        <div>
                            <div className="stat-card-value">{affiliates.length}</div>
                            <div className="stat-card-label">Afiliados</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>👁️</div>
                        <div>
                            <div className="stat-card-value">{totalVisits}</div>
                            <div className="stat-card-label">Total de Visitas</div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Carregando...
                        </div>
                    ) : affiliates.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🤝</div>
                            Nenhum afiliado cadastrado ainda.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.9rem',
                            }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        {['Nome', 'Email', 'Telefone', 'Código', 'Visitas', 'Última Visita', 'Cadastro'].map(h => (
                                            <th key={h} style={{
                                                padding: '14px 16px',
                                                textAlign: 'left',
                                                color: 'var(--text-muted)',
                                                fontWeight: 500,
                                                fontSize: '0.8rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {affiliates.map(a => (
                                        <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {a.name}
                                            </td>
                                            <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                                                {a.email}
                                            </td>
                                            <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                                                {a.phone}
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <code style={{
                                                    padding: '4px 8px',
                                                    background: 'rgba(212,160,74,0.1)',
                                                    borderRadius: '6px',
                                                    color: '#d4a04a',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                }}>
                                                    {a.code}
                                                </code>
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '4px 10px',
                                                    background: a.total_visits > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
                                                    borderRadius: '20px',
                                                    color: a.total_visits > 0 ? '#22c55e' : '#6b7280',
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem',
                                                }}>
                                                    👁️ {a.total_visits}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                {formatDate(a.last_visit)}
                                            </td>
                                            <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                {formatDate(a.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
