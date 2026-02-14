'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

interface Banner {
    url: string;
    alt: string;
}

export default function AdminBannersPage() {
    const router = useRouter();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('admin_auth')) {
            router.push('/admin/login');
            return;
        }
        fetch('/api/admin/banners').then(r => r.json()).then(setBanners).catch(() => { });
    }, [router]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/admin/banners', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                setBanners(data.banners);
            } else {
                alert(data.error || 'Erro ao upload');
            }
        } catch {
            alert('Erro ao fazer upload');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const removeBanner = async (index: number) => {
        const updated = banners.filter((_, i) => i !== index);
        setBanners(updated);
        try {
            await fetch('/api/admin/banners', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            alert('Erro ao remover banner');
        }
    };

    const updateAlt = (index: number, alt: string) => {
        setBanners(prev => prev.map((b, i) => i === index ? { ...b, alt } : b));
    };

    const saveAlts = async () => {
        try {
            await fetch('/api/admin/banners', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(banners),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            alert('Erro ao salvar');
        }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <div className="admin-header">
                    <div>
                        <h1 className="admin-title">Banners</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                            Gerencie os banners do carrossel da página inicial
                        </p>
                    </div>
                    <div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? '⏳ Enviando...' : '+ Novo Banner'}
                        </button>
                    </div>
                </div>

                <div className="admin-table-wrapper" style={{ padding: '24px' }}>
                    {banners.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                            Nenhum banner cadastrado. Clique em &quot;+ Novo Banner&quot; para adicionar.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {banners.map((banner, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    gap: '16px',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.02)',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    {/* Preview */}
                                    <div style={{
                                        width: '200px',
                                        height: '80px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        background: 'rgba(0,0,0,0.3)',
                                    }}>
                                        <img
                                            src={banner.url}
                                            alt={banner.alt}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            Banner {i + 1}
                                        </div>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Descrição do banner"
                                            value={banner.alt}
                                            onChange={e => updateAlt(i, e.target.value)}
                                            style={{ fontSize: '0.85rem' }}
                                        />
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => removeBanner(i)}
                                        style={{
                                            background: 'rgba(239,68,68,0.1)',
                                            border: '1px solid rgba(239,68,68,0.2)',
                                            color: 'var(--danger)',
                                            borderRadius: '8px',
                                            width: '40px',
                                            height: '40px',
                                            cursor: 'pointer',
                                            fontSize: '1.1rem',
                                            flexShrink: 0,
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
                        <button className="btn btn-primary btn-lg" onClick={saveAlts}>
                            Salvar Alterações
                        </button>
                        {saved && (
                            <span className="animate-fade-in" style={{ color: 'var(--success)', fontSize: '0.9rem' }}>
                                ✅ Salvo!
                            </span>
                        )}
                    </div>

                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.15)' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            💡 <strong>Dica:</strong> Use imagens com boa resolução (recomendado: 1920x600px ou similar widescreen). Não há limite de tamanho para banners.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
