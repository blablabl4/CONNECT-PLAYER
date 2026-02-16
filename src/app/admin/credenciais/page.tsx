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
    const [products, setProducts] = useState<Product[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);

    // Single add state
    const [credType, setCredType] = useState<'email' | 'link'>('email');
    const [newCred, setNewCred] = useState({ product_id: '', variation_id: '', email: '', password: '', link: '', max_uses: 1 });

    // Bulk add state
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedVariation, setSelectedVariation] = useState('');
    const [bulkText, setBulkText] = useState('');
    const [bulkMaxUses, setBulkMaxUses] = useState(1);

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
            const [prodsRes, credsRes] = await Promise.all([
                fetch('/api/admin/products'),
                fetch('/api/admin/credentials'),
            ]);

            if (prodsRes.ok) setProducts(await prodsRes.json());

            if (credsRes.ok) {
                const creds = await credsRes.json();
                setCredentials(creds.map((c: any) => ({
                    ...c,
                    product_name: (c.product?.name || 'Não vinculado') + (c.variation?.name ? ` → ${c.variation.name}` : ''),
                })));
                return;
            }
        } catch {
            // fallback
        }
        setProducts([]);
        setCredentials([]);
    }

    const filteredCreds = filter === 'all' ? credentials
        : filter === 'available' ? credentials.filter(c => !c.is_used)
            : credentials.filter(c => c.is_used);

    // Get variations for selected product
    const currentProductInModal = products.find(p => p.id === newCred.product_id);
    const currentProductInBulk = products.find(p => p.id === selectedProduct);

    const handleAddSingle = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newCred.product_id || !newCred.variation_id) {
            alert('Selecione o produto e a variação.');
            return;
        }

        try {
            const payload: any = {
                product_id: newCred.product_id,
                variation_id: newCred.variation_id,
                max_uses: newCred.max_uses || 1,
            };

            if (credType === 'email') {
                payload.email = newCred.email;
                payload.password = newCred.password;
            } else {
                payload.link = newCred.link;
            }

            await fetch('/api/admin/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch { /* ignore */ }
        setShowModal(false);
        setCredType('email');
        setNewCred({ product_id: '', variation_id: '', email: '', password: '', link: '', max_uses: 1 });
        fetchData();
    };

    const handleBulkAdd = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProduct || !selectedVariation) {
            alert('Selecione o produto e a variação.');
            return;
        }

        const lines = bulkText.split('\n').filter(l => l.trim());
        const creds = lines.map(line => {
            const [email, password] = line.split(/[;:,|]/).map(s => s.trim());
            return {
                product_id: selectedProduct,
                variation_id: selectedVariation,
                email,
                password,
                max_uses: bulkMaxUses || 1,
            };
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
        setSelectedProduct('');
        setSelectedVariation('');
        setBulkMaxUses(1);
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
                            Pool de contas para entrega automática — o estoque do produto é baseado nas credenciais.
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
                        <div className="stat-card-label">Esgotadas</div>
                        <div className="stat-card-value" style={{ color: 'var(--text-muted)' }}>{usedCount}</div>
                    </div>
                </div>

                {/* Filter */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    {[
                        { value: 'all', label: 'Todas' },
                        { value: 'available', label: 'Disponíveis' },
                        { value: 'used', label: 'Esgotadas' },
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
                                <th>Produto → Variação</th>
                                <th>E-mail</th>
                                <th>Senha</th>
                                <th>Link</th>
                                <th>Usos</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCreds.map(cred => (
                                <tr key={cred.id}>
                                    <td>{cred.product_name}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{cred.email || '-'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{cred.password || '-'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {cred.link ? (
                                            <a href={cred.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                                                {cred.link}
                                            </a>
                                        ) : '-'}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{cred.current_uses || 0}/{cred.max_uses || 1}</td>
                                    <td>
                                        <span className={`badge ${cred.is_used ? 'badge-danger' : (cred.current_uses || 0) > 0 ? 'badge-gold' : 'badge-success'}`}>
                                            {cred.is_used ? 'Esgotada' : (cred.current_uses || 0) > 0 ? 'Em uso' : 'Disponível'}
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
                                {/* Product + Variation Selection — REQUIRED */}
                                <div className="form-group">
                                    <label className="form-label">Produto *</label>
                                    <select className="form-input" required value={newCred.product_id} onChange={e => setNewCred(prev => ({ ...prev, product_id: e.target.value, variation_id: '' }))}>
                                        <option value="">Selecione o produto</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                {currentProductInModal && currentProductInModal.variations && currentProductInModal.variations.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label">Variação *</label>
                                        <select className="form-input" required value={newCred.variation_id} onChange={e => setNewCred(prev => ({ ...prev, variation_id: e.target.value }))}>
                                            <option value="">Selecione a variação</option>
                                            {currentProductInModal.variations.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name} — R$ {v.price.toFixed(2)} (estoque: {v.stock || 0})
                                                </option>
                                            ))}
                                        </select>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            A credencial será vinculada a essa variação. O estoque da variação atualiza automaticamente.
                                        </p>
                                    </div>
                                )}

                                {/* Credential Type */}
                                <div className="form-group">
                                    <label className="form-label">Tipo de Credencial</label>
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <input type="radio" name="credType" value="email" checked={credType === 'email'} onChange={() => setCredType('email')} />
                                            <span>Email + Senha</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <input type="radio" name="credType" value="link" checked={credType === 'link'} onChange={() => setCredType('link')} />
                                            <span>Link</span>
                                        </label>
                                    </div>
                                </div>

                                {credType === 'email' ? (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">E-mail / Login *</label>
                                            <input type="text" className="form-input" required placeholder="usuario@exemplo.com" value={newCred.email} onChange={e => setNewCred(prev => ({ ...prev, email: e.target.value }))} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Senha *</label>
                                            <input type="text" className="form-input" required placeholder="senha123" value={newCred.password} onChange={e => setNewCred(prev => ({ ...prev, password: e.target.value }))} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="form-group">
                                        <label className="form-label">Link da Credencial *</label>
                                        <input type="text" className="form-input" required placeholder="https://..." value={newCred.link} onChange={e => setNewCred(prev => ({ ...prev, link: e.target.value }))} />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Máx. Usos</label>
                                    <input type="number" className="form-input" min={1} value={newCred.max_uses} onChange={e => setNewCred(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 1 }))} />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        1 = uso individual (1 venda). N = compartilhado (N vendas com a mesma credencial).
                                    </p>
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
                                {/* Product + Variation Selection — REQUIRED */}
                                <div className="form-group">
                                    <label className="form-label">Produto *</label>
                                    <select className="form-input" required value={selectedProduct} onChange={e => { setSelectedProduct(e.target.value); setSelectedVariation(''); }}>
                                        <option value="">Selecione o produto</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                {currentProductInBulk && currentProductInBulk.variations && currentProductInBulk.variations.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label">Variação *</label>
                                        <select className="form-input" required value={selectedVariation} onChange={e => setSelectedVariation(e.target.value)}>
                                            <option value="">Selecione a variação</option>
                                            {currentProductInBulk.variations.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name} — R$ {v.price.toFixed(2)} (estoque: {v.stock || 0})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Credenciais (uma por linha, formato: email;senha) *</label>
                                    <textarea
                                        className="form-input" rows={8} required
                                        placeholder={"user1@email.com;senha123\nuser2@email.com;senha456\nuser3@email.com;senha789"}
                                        value={bulkText}
                                        onChange={e => setBulkText(e.target.value)}
                                        style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Máx. Usos (por credencial)</label>
                                    <input type="number" className="form-input" min={1} value={bulkMaxUses} onChange={e => setBulkMaxUses(parseInt(e.target.value) || 1)} />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        1 = cada credencial é individual. N = cada credencial pode ser vendida N vezes.
                                    </p>
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
