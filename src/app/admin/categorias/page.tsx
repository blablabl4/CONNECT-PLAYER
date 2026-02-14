'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

interface Category {
    icon: string;
    name: string;
    color: string;
}

export default function AdminCategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('admin_auth')) {
            router.push('/admin/login');
            return;
        }
        fetch('/api/admin/categories').then(r => r.json()).then(setCategories).catch(() => { });
    }, [router]);

    const addCategory = () => {
        setCategories(prev => [...prev, { icon: '📁', name: '', color: '#6366f1' }]);
    };

    const removeCategory = (index: number) => {
        setCategories(prev => prev.filter((_, i) => i !== index));
    };

    const updateCategory = (index: number, field: keyof Category, value: string) => {
        setCategories(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/admin/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categories.filter(c => c.name.trim())),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            alert('Erro ao salvar categorias');
        } finally {
            setSaving(false);
        }
    };

    const EMOJI_SUGGESTIONS = ['🎬', '🎵', '📺', '🎮', '☁️', '🔒', '📱', '💻', '🎧', '🏠', '📚', '🎯', '⚡', '🌐', '🔧', '📁'];

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <div className="admin-header">
                    <div>
                        <h1 className="admin-title">Categorias</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                            Gerencie as categorias de produtos da loja
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={addCategory}>
                        + Nova Categoria
                    </button>
                </div>

                <div className="admin-table-wrapper" style={{ padding: '24px' }}>
                    {categories.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                            Nenhuma categoria cadastrada. Clique em &quot;+ Nova Categoria&quot; para começar.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {categories.map((cat, i) => (
                                <div key={i} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '80px 1fr 140px 40px',
                                    gap: '12px',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.02)',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    {/* Icon selector */}
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            className="form-input"
                                            value={cat.icon}
                                            onChange={e => updateCategory(i, 'icon', e.target.value)}
                                            style={{ fontSize: '1.5rem', textAlign: 'center', padding: '8px' }}
                                        >
                                            {EMOJI_SUGGESTIONS.map(e => (
                                                <option key={e} value={e}>{e}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Name */}
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Nome da categoria"
                                        value={cat.name}
                                        onChange={e => updateCategory(i, 'name', e.target.value)}
                                    />

                                    {/* Color */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="color"
                                            value={cat.color}
                                            onChange={e => updateCategory(i, 'color', e.target.value)}
                                            style={{ width: '40px', height: '40px', cursor: 'pointer', border: 'none', borderRadius: '8px' }}
                                        />
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={cat.color}
                                            onChange={e => updateCategory(i, 'color', e.target.value)}
                                            style={{ width: '90px', fontSize: '0.8rem' }}
                                        />
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => removeCategory(i)}
                                        style={{
                                            background: 'rgba(239,68,68,0.1)',
                                            border: '1px solid rgba(239,68,68,0.2)',
                                            color: 'var(--danger)',
                                            borderRadius: '8px',
                                            width: '40px',
                                            height: '40px',
                                            cursor: 'pointer',
                                            fontSize: '1.1rem',
                                        }}
                                        title="Remover"
                                    >
                                        🗑
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '24px' }}>
                        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
                            {saving ? '⏳ Salvando...' : 'Salvar Categorias'}
                        </button>
                        {saved && (
                            <span className="animate-fade-in" style={{ color: 'var(--success)', fontSize: '0.9rem' }}>
                                ✅ Categorias salvas!
                            </span>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
