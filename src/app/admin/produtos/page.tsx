'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { Product, ProductVariation, Credential } from '@/lib/types';


const EMPTY_PRODUCT: Partial<Product> = {
    name: '', description: '', price: 0, image_url: '',
    category: '', duration: '30 dias', is_active: true, stock: 0,
    features: [],
};

interface VarForm {
    id?: string;
    name: string;
    description?: string;
    price: number;
    duration?: string;
    original_price?: number | null;
    credential_id?: string;
    stock?: number;
}

export default function AdminProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>(EMPTY_PRODUCT);
    const [variations, setVariations] = useState<VarForm[]>([]);
    const [featuresText, setFeaturesText] = useState('');
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ icon: string; name: string; color: string }[]>([]);
    const [allCredentials, setAllCredentials] = useState<Credential[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('admin_auth')) {
            router.push('/admin/login'); return;
        }
        fetchProducts();
        fetch('/api/admin/categories').then(r => r.json()).then(setCategories).catch(() => { });
        fetch('/api/admin/credentials').then(r => r.json()).then(setAllCredentials).catch(() => { });
    }, [router]);

    async function fetchProducts() {
        try {
            const res = await fetch('/api/admin/products');
            if (res.ok) { setProducts(await res.json()); return; }
        } catch { }
        setProducts([]);
    }

    // Available credentials (not fully used)
    const availableCredentials = allCredentials.filter(c => !c.is_used);

    const openNewProduct = () => {
        setEditingProduct(null);
        setFormData(EMPTY_PRODUCT);
        setVariations([{ name: '', price: 0, duration: '30 dias', credential_id: '' }]);
        setFeaturesText('');
        setShowModal(true);
    };

    const openEditProduct = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name, description: product.description,
            price: product.price, image_url: product.image_url,
            category: product.category, duration: product.duration,
            is_active: product.is_active, stock: product.stock, features: product.features || [],
        });
        const existingVars = (product.variations || []).map((v: any) => ({
            id: v.id, name: v.name, description: v.description, price: v.price,
            duration: v.duration, original_price: v.original_price, stock: v.stock,
            credential_id: v.credential_id || '',
        }));
        setVariations(existingVars.length > 0 ? existingVars : [{ name: product.name, price: product.price, duration: product.duration, credential_id: '' }]);
        setFeaturesText((product.features || []).join('\n'));
        setShowModal(true);
    };

    const handleAddVariation = () => {
        setVariations([...variations, { name: '', price: 0, duration: formData.duration || '30 dias', credential_id: '' }]);
    };

    const handleVarChange = (i: number, field: string, value: any) => {
        const newVars = [...variations];
        newVars[i] = { ...newVars[i], [field]: value };
        setVariations(newVars);
    };

    const removeVariation = (i: number) => {
        if (variations.length <= 1) { alert('O produto deve ter pelo menos 1 variação.'); return; }
        setVariations(variations.filter((_, idx) => idx !== i));
    };

    const handleImageUpload = async (file: File) => {
        if (file.size > 2 * 1024 * 1024) { alert('Arquivo muito grande! Máximo: 2MB'); return; }
        const fd = new FormData(); fd.append('file', file);
        try {
            const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok && data.url) setFormData(p => ({ ...p, image_url: data.url }));
            else alert(data.error || 'Erro ao fazer upload');
        } catch { alert('Erro ao fazer upload'); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const validVars = variations.filter(v => v.name && v.price !== undefined && v.price !== null);
        if (validVars.length === 0) { alert('Adicione pelo menos 1 variação com nome e preço.'); setLoading(false); return; }

        const finalPrice = Math.min(...validVars.map(v => v.price || 0));

        try {
            const payload = {
                ...formData, price: finalPrice, stock: 0,
                features: featuresText.split('\n').filter(f => f.trim()),
                ...(editingProduct ? { id: editingProduct.id } : {}),
                variations: validVars,
            };
            const res = await fetch('/api/admin/products', {
                method: editingProduct ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
            });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Erro ao salvar'); }
            alert('Produto salvo com sucesso!');
        } catch (err: any) { alert(err.message || 'Erro ao salvar produto.'); }

        setShowModal(false); setLoading(false); fetchProducts();
    };

    const deleteProduct = async (id: string) => {
        if (!confirm('Excluir este produto?')) return;
        try { await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' }); } catch { }
        fetchProducts();
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <div className="admin-header">
                    <div>
                        <h1 className="admin-title">Produtos</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                            Gerencie produtos, variações e vínculo com credenciais
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={openNewProduct}>+ Novo Produto</button>
                </div>

                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Categoria</th>
                                <th>Preço</th>
                                <th>Estoque</th>
                                <th>Variações</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {product.image_url ? (
                                                <img src={product.image_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏷️</div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{product.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{product.description?.substring(0, 40)}{product.description && product.description.length > 40 ? '...' : ''}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{product.category}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>
                                        <span style={{ fontSize: '0.85rem' }}>A partir de R$ {Number(product.price).toFixed(2)}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {(product.variations || []).map((v: any) => (
                                                <span key={v.id} style={{ fontSize: '0.8rem' }}>
                                                    {v.name}: <strong style={{ color: (v.stock || 0) > 0 ? 'var(--success)' : 'var(--danger)' }}>{v.stock || 0}</strong>
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td><span className="badge badge-gold">{(product.variations || []).length} opções</span></td>
                                    <td>
                                        <span className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}>
                                            {product.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEditProduct(product)}>Editar</button>
                                            <button className="btn btn-sm" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => deleteProduct(product.id)}>Excluir</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Product Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="modal-header">
                                <h3 className="modal-title">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleSave}>
                                {/* Row 1: Name + Category */}
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Nome do Produto *</label>
                                        <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Ex: ChatGPT, Netflix, Spotify" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Categoria *</label>
                                        <select className="form-input" required value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                                            <option value="">Selecione</option>
                                            {categories.map(c => (<option key={c.name} value={c.name}>{c.icon} {c.name}</option>))}
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label className="form-label">Descrição</label>
                                    <textarea className="form-input" rows={2} placeholder="Descrição do produto..." value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
                                </div>

                                {/* Image */}
                                <div className="form-group">
                                    <label className="form-label">Imagem (máx. 2MB)</label>
                                    <div style={{
                                        border: '2px dashed var(--border)', borderRadius: '12px', padding: '16px',
                                        textAlign: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer',
                                    }}
                                        onClick={() => document.getElementById('img-upload')?.click()}
                                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-gold)'; }}
                                        onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                                        onDrop={async e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border)'; const f = e.dataTransfer.files?.[0]; if (f) await handleImageUpload(f); }}
                                    >
                                        {formData.image_url ? (
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <img src={formData.image_url} alt="" style={{ maxWidth: '180px', maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                                                <button type="button" onClick={e => { e.stopPropagation(); setFormData(p => ({ ...p, image_url: '' })); }} style={{
                                                    position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)',
                                                    color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px',
                                                    cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>✕</button>
                                            </div>
                                        ) : (
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                📷 Clique ou arraste uma imagem
                                            </div>
                                        )}
                                        <input id="img-upload" type="file" accept="image/*" style={{ display: 'none' }}
                                            onChange={async e => { const f = e.target.files?.[0]; if (f) await handleImageUpload(f); e.target.value = ''; }} />
                                    </div>
                                </div>

                                {/* === VARIATIONS === */}
                                <div style={{ marginTop: '8px', padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Variações do Produto *</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                Cada variação = uma opção de compra. Selecione a credencial que será entregue.
                                            </p>
                                        </div>
                                        <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddVariation}>+ Adicionar</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {variations.map((v, i) => (
                                            <div key={i} style={{
                                                padding: '20px', background: 'var(--bg-secondary)', borderRadius: '10px',
                                                border: '1px solid var(--border)',
                                            }}>
                                                {/* Variation header */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                                                        Variação {i + 1}
                                                    </span>
                                                    <button type="button" onClick={() => removeVariation(i)} className="btn btn-sm" style={{
                                                        color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', borderRadius: '6px',
                                                    }} title="Remover">🗑️</button>
                                                </div>

                                                {/* Row: Name + Price + Duration */}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                                    <div>
                                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Nome *</label>
                                                        <input type="text" className="form-input" required placeholder="Ex: Privado, Compartilhado" value={v.name} onChange={e => handleVarChange(i, 'name', e.target.value)} />
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Preço (R$) *</label>
                                                            <input type="number" step="0.01" className="form-input" required placeholder="0.00" value={v.price} onChange={e => handleVarChange(i, 'price', parseFloat(e.target.value) || 0)} />
                                                        </div>
                                                        <div>
                                                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Duração</label>
                                                            <select className="form-input" value={v.duration || '30 dias'} onChange={e => handleVarChange(i, 'duration', e.target.value)}>
                                                                <option value="30 dias">30 dias</option>
                                                                <option value="60 dias">60 dias</option>
                                                                <option value="90 dias">90 dias</option>
                                                                <option value="Vitalício">Vitalício</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Row: Credential Selector */}
                                                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                                    <label className="form-label" style={{ fontSize: '0.8rem' }}>🔗 Credencial vinculada</label>
                                                    <select className="form-input" value={v.credential_id || ''} onChange={e => handleVarChange(i, 'credential_id', e.target.value)}>
                                                        <option value="">Selecione uma credencial...</option>
                                                        {availableCredentials.map(c => (
                                                            <option key={c.id} value={c.id}>
                                                                {c.email || c.link || '(sem dados)'} — {c.group}{c.subgroup ? `/${c.subgroup}` : ''} (usos: {c.current_uses}/{c.max_uses})
                                                            </option>
                                                        ))}
                                                        {/* Also show the currently selected credential if it's fully used (so editing works) */}
                                                        {v.credential_id && !availableCredentials.find(c => c.id === v.credential_id) && (() => {
                                                            const selected = allCredentials.find(c => c.id === v.credential_id);
                                                            return selected ? <option value={selected.id}>{selected.email || selected.link || '(sem dados)'} — {selected.group}{selected.subgroup ? `/${selected.subgroup}` : ''} (usos: {selected.current_uses}/{selected.max_uses}) ⚠️ esgotada</option> : null;
                                                        })()}
                                                    </select>
                                                    {v.credential_id && (() => {
                                                        const cred = allCredentials.find(c => c.id === v.credential_id);
                                                        if (!cred) return null;
                                                        const remaining = cred.max_uses - cred.current_uses;
                                                        return (
                                                            <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.8rem' }}>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                                                                    <span style={{ color: 'var(--text-muted)' }}>📧 {cred.email || '—'}</span>
                                                                    <span style={{ color: 'var(--text-muted)' }}>🔑 {cred.password ? '••••••' : '—'}</span>
                                                                    <span style={{ color: 'var(--text-muted)' }}>🔗 {cred.link ? 'Sim' : '—'}</span>
                                                                    <span style={{ color: remaining > 0 ? 'var(--success)' : 'var(--danger)' }}>📦 {remaining}/{cred.max_uses} usos</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Stock indicator */}
                                                {v.id && (
                                                    <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        📦 Estoque: <strong style={{ color: (v.stock || 0) > 0 ? 'var(--success)' : 'var(--danger)' }}>{v.stock || 0}</strong> unidades disponíveis
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Salvando...' : 'Salvar Produto'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
