'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { Product, ProductVariation } from '@/lib/types';

const EMPTY_PRODUCT: Partial<Product> = {
    name: '', description: '', price: 0, image_url: '',
    category: '', duration: '30 dias', is_active: true, stock: 0,
    features: [],
};

export default function AdminProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>(EMPTY_PRODUCT);
    const [variations, setVariations] = useState<Partial<ProductVariation>[]>([]);
    const [featuresText, setFeaturesText] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasVariations, setHasVariations] = useState(false);
    const [categories, setCategories] = useState<{ icon: string; name: string; color: string }[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('admin_auth')) {
            router.push('/admin/login');
            return;
        }
        fetchProducts();
        fetch('/api/admin/categories').then(r => r.json()).then(setCategories).catch(() => { });
    }, [router]);

    async function fetchProducts() {
        try {
            const res = await fetch('/api/admin/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
                return;
            }
        } catch {
            // fallback
        }
        setProducts([]);
    }

    const openNewProduct = () => {
        setEditingProduct(null);
        setFormData(EMPTY_PRODUCT);
        setVariations([]);
        setFeaturesText('');
        setHasVariations(false);
        setShowModal(true);
    };

    const openEditProduct = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            image_url: product.image_url,
            category: product.category,
            duration: product.duration,
            is_active: product.is_active,
            stock: product.stock,
            features: product.features || [],
        });

        const existingVars = product.variations || [];
        setVariations(existingVars);
        setHasVariations(existingVars.length > 0);
        setFeaturesText((product.features || []).join('\n'));
        setShowModal(true);
    };

    const handleAddVariation = () => {
        setVariations([...variations, {
            name: '', price: 0, stock: 0, duration: formData.duration || '30 dias'
        }]);
    };

    const handleVariationChange = (index: number, field: string, value: any) => {
        const newVars = [...variations];
        newVars[index] = { ...newVars[index], [field]: value };
        setVariations(newVars);
    };

    const removeVariation = (index: number) => {
        setVariations(variations.filter((_, i) => i !== index));
    };

    const handleImageUpload = async (file: File) => {
        if (file.size > 2 * 1024 * 1024) {
            alert('Arquivo muito grande! Máximo: 2MB');
            return;
        }
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok && data.url) {
                setFormData(p => ({ ...p, image_url: data.url }));
            } else {
                alert(data.error || 'Erro ao fazer upload');
            }
        } catch {
            alert('Erro ao fazer upload');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // If has variations, base price is min price of variations, stock is sum
        let finalPrice = formData.price;
        let finalStock = formData.stock;

        if (hasVariations && variations.length > 0) {
            finalPrice = Math.min(...variations.map(v => v.price || 0));
            finalStock = variations.reduce((sum, v) => sum + (v.stock || 0), 0);
        }

        const productData = {
            ...formData,
            price: finalPrice,
            stock: finalStock,
            features: featuresText.split('\n').filter(f => f.trim()),
        };

        try {
            const payload = {
                ...productData,
                ...(editingProduct ? { id: editingProduct.id } : {}),
                ...(hasVariations ? { variations } : { variations: [] }),
            };

            const res = await fetch('/api/admin/products', {
                method: editingProduct ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Erro ao salvar produto');
            }
            alert('Produto salvo com sucesso!');
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Erro ao salvar produto. Verifique a conexão com o banco de dados.');
        }

        setShowModal(false);
        setLoading(false);
        fetchProducts();
    };

    const deleteProduct = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        try {
            await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
        } catch { /* ignore */ }
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
                            Gerencie seus produtos e variações
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={openNewProduct}>
                        + Novo Produto
                    </button>
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
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                                                background: 'var(--bg-secondary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                                            }}>
                                                {product.category === 'Música' ? '🎵' : product.category === 'IPTV' ? '📺' : '🎬'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{product.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{product.description?.substring(0, 40)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{product.category}</td>
                                    <td style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>
                                        {product.variations && product.variations.length > 0 ? (
                                            <span style={{ fontSize: '0.85rem' }}>A partir de R$ {product.price.toFixed(2)}</span>
                                        ) : (
                                            `R$ ${product.price.toFixed(2)}`
                                        )}
                                    </td>
                                    <td>
                                        {product.variations && product.variations.length > 0 ? (
                                            // Sum stock
                                            product.variations.reduce((acc, v) => acc + (v.stock || 0), 0)
                                        ) : product.stock}
                                    </td>
                                    <td>
                                        {product.variations && product.variations.length > 0 ? (
                                            <span className="badge badge-gold">{product.variations.length} opções</span>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <span className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}>
                                            {product.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEditProduct(product)}>Editar</button>
                                            <button className="btn btn-sm" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => deleteProduct(product.id)}>
                                                Excluir
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="modal-header">
                                <h3 className="modal-title">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleSave}>
                                {/* Basic Info */}
                                <div className="form-group">
                                    <label className="form-label">Nome do Produto *</label>
                                    <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Netflix Premium" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Categoria *</label>
                                    <select className="form-input" required value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                                        <option value="">Selecione</option>
                                        {categories.map(c => (
                                            <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Descrição do Produto</label>
                                    <textarea className="form-input" rows={3} placeholder="Descreva o produto, seus benefícios, detalhes..." value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical', minHeight: '80px' }} />
                                </div>

                                {/* Variations Toggle */}
                                <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <label style={{ fontWeight: 600 }}>Este produto possui variações?</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input type="checkbox" id="has_vars" checked={hasVariations} onChange={e => setHasVariations(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                                            <label htmlFor="has_vars">Sim, adicionar variações</label>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        Ex: (1 Tela, 4 Telas), (Mensal, Anual), etc.
                                    </p>
                                </div>

                                {!hasVariations ? (
                                    /* SINGLE PRODUCT FIELDS */
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Preço (R$) *</label>
                                            <input type="number" step="0.01" className="form-input" required={!hasVariations} value={formData.price} onChange={e => setFormData(p => ({ ...p, price: parseFloat(e.target.value) }))} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Estoque</label>
                                            <input type="number" className="form-input" value={formData.stock} onChange={e => setFormData(p => ({ ...p, stock: parseInt(e.target.value) }))} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Duração</label>
                                            <select className="form-input" value={formData.duration} onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))}>
                                                <option value="30 dias">30 dias</option>
                                                <option value="60 dias">60 dias</option>
                                                <option value="90 dias">90 dias</option>
                                                <option value="Vitalício">Vitalício</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    /* VARIATIONS MANAGER */
                                    <div className="form-group">
                                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Variações do Produto</span>
                                            <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddVariation}>+ Adicionar Opção</button>
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                                            {variations.map((v, idx) => (
                                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 42px', gap: '12px', alignItems: 'end', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                    <div style={{ gridColumn: '1 / -1' }}>
                                                        <label className="form-label" style={{ fontSize: '0.85rem' }}>Nome da Variação (Ex: 1 Tela, Mensal)</label>
                                                        <input type="text" className="form-input" placeholder="Nome da opção" value={v.name} onChange={e => handleVariationChange(idx, 'name', e.target.value)} required />
                                                    </div>
                                                    <div style={{ gridColumn: '1 / -1' }}>
                                                        <label className="form-label" style={{ fontSize: '0.85rem' }}>Descrição da Variação</label>
                                                        <textarea className="form-input" rows={2} placeholder="Descrição específica desta variação..." value={v.description || ''} onChange={e => handleVariationChange(idx, 'description', e.target.value)} style={{ resize: 'vertical', minHeight: '50px', fontSize: '0.85rem' }} />
                                                    </div>
                                                    <div>
                                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Preço (R$)</label>
                                                        <input type="number" step="0.01" className="form-input" placeholder="0.00" value={v.price} onChange={e => handleVariationChange(idx, 'price', parseFloat(e.target.value))} required />
                                                    </div>
                                                    <div>
                                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Estoque</label>
                                                        <input type="number" className="form-input" placeholder="0" value={v.stock} onChange={e => handleVariationChange(idx, 'stock', parseInt(e.target.value))} />
                                                    </div>
                                                    <div>
                                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Duração</label>
                                                        <select className="form-input" value={v.duration || '30 dias'} onChange={e => handleVariationChange(idx, 'duration', e.target.value)}>
                                                            <option value="30 dias">30 dias</option>
                                                            <option value="60 dias">60 dias</option>
                                                            <option value="90 dias">90 dias</option>
                                                            <option value="Vitalício">Vitalício</option>
                                                        </select>
                                                    </div>
                                                    <button type="button" onClick={() => removeVariation(idx)} className="btn" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remover opção">
                                                        🗑️
                                                    </button>
                                                </div>
                                            ))}
                                            {variations.length === 0 && (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                                                    Nenhuma variação adicionada. Clique em "+ Adicionar Opção".
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="form-group" style={{ marginTop: '16px' }}>
                                    <label className="form-label">Imagem do Produto (máx. 2MB)</label>
                                    <div style={{
                                        border: '2px dashed var(--border)',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        textAlign: 'center',
                                        background: 'rgba(255,255,255,0.02)',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'border-color 0.2s',
                                    }}
                                        onClick={() => document.getElementById('product-image-input')?.click()}
                                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-gold)'; }}
                                        onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                                        onDrop={async e => {
                                            e.preventDefault();
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            const file = e.dataTransfer.files?.[0];
                                            if (file) await handleImageUpload(file);
                                        }}
                                    >
                                        {formData.image_url ? (
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <img src={formData.image_url} alt="Preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                                                <button type="button" onClick={e => { e.stopPropagation(); setFormData(p => ({ ...p, image_url: '' })); }} style={{
                                                    position: 'absolute', top: '-8px', right: '-8px',
                                                    background: 'var(--danger)', color: '#fff', border: 'none',
                                                    borderRadius: '50%', width: '24px', height: '24px',
                                                    cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>✕</button>
                                            </div>
                                        ) : (
                                            <div style={{ color: 'var(--text-muted)' }}>
                                                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📷</div>
                                                <div style={{ fontSize: '0.9rem' }}>Clique ou arraste uma imagem aqui</div>
                                                <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-muted)' }}>JPG, PNG, WebP ou GIF • Máximo 2MB</div>
                                            </div>
                                        )}
                                        <input id="product-image-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                                            style={{ display: 'none' }}
                                            onChange={async e => {
                                                const file = e.target.files?.[0];
                                                if (file) await handleImageUpload(file);
                                                e.target.value = '';
                                            }}
                                        />
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
