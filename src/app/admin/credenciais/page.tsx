'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { supabase, Credential, Product } from '@/lib/supabase';

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
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedVariation, setSelectedVariation] = useState('');
    const [bulkText, setBulkText] = useState('');
    const [newCred, setNewCred] = useState({ product_id: '', variation_id: '', email: '', password: '' });
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
            // Fetch products AND variations to populate dropdowns
            const { data: prods } = await supabase
                .from('products')
                .select('*, variations:product_variations(*)')
                .order('name');

            if (prods) setProducts(prods);

            // Fetch credentials with product and variation names
            const { data: creds } = await supabase
                .from('credentials')
                .select('*, product:products(name), variation:product_variations(name)')
                .order('created_at', { ascending: false });

            if (creds) {
                setCredentials(creds.map(c => ({
                    ...c,
                    product_name: (c.product as any)?.name + ((c.variation as any)?.name ? ` (${(c.variation as any).name})` : ''),
                })));
                return;
            }
        } catch {
            // Demo
        }
        // Fallback demo
        setProducts([
            {
                id: '1', name: 'Netflix Premium', description: '', price: 19.90, image_url: '', category: 'Streaming', duration: '30 dias', is_active: true, stock: 50, features: [], created_at: '', updated_at: '', variations: [
                    { id: 'v1', product_id: '1', name: '1 Tela', description: '', price: 19.90, stock: 20, duration: '30 dias', created_at: '' }
                ]
            },
        ]);
        setCredentials([
            { id: '1', product_id: '1', variation_id: 'v1', email: 'user1@netflix.com', password: '****', is_used: false, assigned_to: '', created_at: new Date().toISOString(), product_name: 'Netflix Premium (1 Tela)' },
        ]);
    }

    const filteredCreds = filter === 'all' ? credentials
        : filter === 'available' ? credentials.filter(c => !c.is_used)
            : credentials.filter(c => c.is_used);

    // Get current product variations
    const currentProductIndModal = products.find(p => p.id === newCred.product_id);
    const currentProductInBulk = products.find(p => p.id === selectedProduct);

    const handleAddSingle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await supabase.from('credentials').insert({
                product_id: newCred.product_id,
                variation_id: newCred.variation_id || null,
                email: newCred.email,
                password: newCred.password
            });
        } catch { /* demo */ }
        setShowModal(false);
        setNewCred({ product_id: '', variation_id: '', email: '', password: '' });
        fetchData();
    };

    const handleBulkAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const lines = bulkText.split('\n').filter(l => l.trim());
        const creds = lines.map(line => {
            const [email, password] = line.split(/[;:,|]/).map(s => s.trim());
            return {
                product_id: selectedProduct,
                variation_id: selectedVariation || null,
                email,
                password
            };
        }).filter(c => c.email && c.password);

        try {
            await supabase.from('credentials').insert(creds);
        } catch { /* demo */ }
        setShowBulkModal(false);
        setBulkText('');
        setSelectedProduct('');
        setSelectedVariation('');
        fetchData();
    };

    const deleteCred = async (id: string) => {
        if (!confirm('Excluir esta credencial?')) return;
        try { await supabase.from('credentials').delete().eq('id', id); } catch { /* demo */ }
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
                                    <label className="form-label">Produto *</label>
                                    <select className="form-input" required value={newCred.product_id} onChange={e => setNewCred(prev => ({ ...prev, product_id: e.target.value, variation_id: '' }))}>
                                        <option value="">Selecione</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                {currentProductIndModal && currentProductIndModal.variations && currentProductIndModal.variations.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label">Variação *</label>
                                        <select className="form-input" required value={newCred.variation_id} onChange={e => setNewCred(prev => ({ ...prev, variation_id: e.target.value }))}>
                                            <option value="">Selecione</option>
                                            {currentProductIndModal.variations.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                )}
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
                                    <label className="form-label">Produto *</label>
                                    <select className="form-input" required value={selectedProduct} onChange={e => { setSelectedProduct(e.target.value); setSelectedVariation(''); }}>
                                        <option value="">Selecione</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                {currentProductInBulk && currentProductInBulk.variations && currentProductInBulk.variations.length > 0 && (
                                    <div className="form-group">
                                        <label className="form-label">Variação *</label>
                                        <select className="form-input" required value={selectedVariation} onChange={e => setSelectedVariation(e.target.value)}>
                                            <option value="">Selecione</option>
                                            {currentProductInBulk.variations.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                )}
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
