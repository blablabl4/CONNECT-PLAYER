'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { Credential, Product } from '@/lib/types';

// Helper type for view
type CredentialWithProduct = Credential & {
    product_name?: string;
    product?: { name: string };
    variation?: { name: string };
};

export default function AdminCredentialsPage() {
    const router = useRouter();
    const [credentials, setCredentials] = useState<CredentialWithProduct[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [newCred, setNewCred] = useState({ email: '', password: '' });
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('admin_auth')) {
            router.push('/admin/login');
            return;
        }
        fetchData();
    }, [router]);

    async function fetchData() {
        try {
            const credsRes = await fetch('/api/admin/credentials');

            if (credsRes.ok) {
                const creds = await credsRes.json();
                setCredentials(creds.map((c: any) => ({
                    ...c,
                    product_name: (c.product?.name || 'Não vinculado') + (c.variation?.name ? ` (${c.variation.name})` : ''),
                })));
                return;
            }
        } catch {
            // fallback
        }
        setCredentials([]);
    }

    const filteredCreds = filter === 'all' ? credentials
        : filter === 'available' ? credentials.filter(c => !c.is_used)
            : credentials.filter(c => c.is_used);

    const handleAddSingle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/admin/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newCred.email,
                    password: newCred.password,
                }),
            });
        } catch { /* ignore */ }
        setShowModal(false);
        setNewCred({ email: '', password: '' });
        fetchData();
    };

    const handleBulkAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const lines = bulkText.split('\n').filter(l => l.trim());
        const creds = lines.map(line => {
            const [email, password] = line.split(/[;:,|]/).map(s => s.trim());
            return { email, password };
        }).filter(c => c.email && c.password);

        try {
            for (const c of creds) {
                await fetch('/api/admin/credentials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(c),
                });
            }
        } catch { /* demo */ }
        setShowBulkModal(false);
        setBulkText('');
        fetchData();
    };

    const deleteCred = async (id: string) => {
        if (!confirm('Excluir esta credencial?')) return;
        try { await fetch(`/api/admin/credentials?id=${id}`, { method: 'DELETE' }); } catch { /* ignore */ }
        fetchData();
    };

    const availableCount = credentials.filter(c => !c.is_used).length;
    const usedCount = credentials.filter(c => c.is_used).length;

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <div className="admin-header">
                    <div>
                        <h1 className="admin-title">Credenciais</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                            Pool de contas para entrega automática
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>
                            📋 Importar em Lote
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            + Adicionar
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="stat-card">
                        <div className="stat-card-label">Total</div>
                        <div className="stat-card-value">{credentials.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Disponíveis</div>
                        <div className="stat-card-value" style={{ color: 'var(--success)' }}>{availableCount}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Usadas</div>
                        <div className="stat-card-value" style={{ color: 'var(--text-muted)' }}>{usedCount}</div>
                    </div>
                </div>

                {/* Filter */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    {[
                        { value: 'all', label: 'Todas' },
                        { value: 'available', label: 'Disponíveis' },
                        { value: 'used', label: 'Usadas' },
                    ].map(tab => (
                        <button
                            key={tab.value}
                            className={`btn btn-sm ${filter === tab.value ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Produto (Variação)</th>
                                <th>E-mail</th>
                                <th>Senha</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCreds.map(cred => (
                                <tr key={cred.id}>
                                    <td>{cred.product_name}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{cred.email}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{cred.password}</td>
                                    <td>
                                        <span className={`badge ${cred.is_used ? 'badge-danger' : 'badge-success'}`}>
                                            {cred.is_used ? 'Usada' : 'Disponível'}
                                        </span>
                                    </td>
                                    <td>
                                        {!cred.is_used && (
                                            <button className="btn btn-sm" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => deleteCred(cred.id)}>
                                                Excluir
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Single Add Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Adicionar Credencial</h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleAddSingle}>
                                <div className="form-group">
                                    <label className="form-label">E-mail / Login *</label>
                                    <input type="text" className="form-input" required placeholder="usuario@exemplo.com" value={newCred.email} onChange={e => setNewCred(prev => ({ ...prev, email: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Senha *</label>
                                    <input type="text" className="form-input" required placeholder="senha123" value={newCred.password} onChange={e => setNewCred(prev => ({ ...prev, password: e.target.value }))} />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Adicionar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Bulk Add Modal */}
                {showBulkModal && (
                    <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Importar em Lote</h3>
                                <button className="modal-close" onClick={() => setShowBulkModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleBulkAdd}>
                                <div className="form-group">
                                    <label className="form-label">Credenciais (uma por linha, formato: email;senha)</label>
                                    <textarea
                                        className="form-input" rows={8} required
                                        placeholder={"user1@email.com;senha123\nuser2@email.com;senha456\nuser3@email.com;senha789"}
                                        value={bulkText}
                                        onChange={e => setBulkText(e.target.value)}
                                        style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                                    Separadores aceitos: ; : , |
                                </p>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Importar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
