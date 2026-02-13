'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState({
        store_name: 'Connect Player',
        store_email: 'contato@connectplayer.com',
        whatsapp: '',
        instagram: '',
        pix_key: '',
        mp_access_token: '',
        email_from: 'noreply@connectplayer.com',
        resend_api_key: '',
    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && !localStorage.getItem('admin_auth')) {
            router.push('/admin/login');
            return;
        }
        // Load settings from localStorage or Supabase
        const savedSettings = localStorage.getItem('cp_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, [router]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('cp_settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <div className="admin-header">
                    <div>
                        <h1 className="admin-title">Configurações</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                            Configurações gerais da loja
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSave}>
                    {/* Store Settings */}
                    <div className="admin-table-wrapper" style={{ padding: '32px', marginBottom: '24px' }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            🏪 Dados da Loja
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Nome da Loja</label>
                                <input type="text" className="form-input" value={settings.store_name}
                                    onChange={e => setSettings(prev => ({ ...prev, store_name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">E-mail da Loja</label>
                                <input type="email" className="form-input" value={settings.store_email}
                                    onChange={e => setSettings(prev => ({ ...prev, store_email: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">WhatsApp</label>
                                <input type="text" className="form-input" placeholder="5511999999999" value={settings.whatsapp}
                                    onChange={e => setSettings(prev => ({ ...prev, whatsapp: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Instagram</label>
                                <input type="text" className="form-input" placeholder="@connectplayer" value={settings.instagram}
                                    onChange={e => setSettings(prev => ({ ...prev, instagram: e.target.value }))} />
                            </div>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="admin-table-wrapper" style={{ padding: '32px', marginBottom: '24px' }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            💳 Pagamento
                        </h3>
                        <div className="form-group">
                            <label className="form-label">Chave Pix</label>
                            <input type="text" className="form-input" placeholder="CPF, e-mail ou chave aleatória" value={settings.pix_key}
                                onChange={e => setSettings(prev => ({ ...prev, pix_key: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mercado Pago Access Token</label>
                            <input type="password" className="form-input" placeholder="APP_USR-..." value={settings.mp_access_token}
                                onChange={e => setSettings(prev => ({ ...prev, mp_access_token: e.target.value }))} />
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                Obtenha em: https://www.mercadopago.com.br/developers
                            </small>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="admin-table-wrapper" style={{ padding: '32px', marginBottom: '24px' }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            📧 E-mail
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">E-mail remetente</label>
                                <input type="email" className="form-input" value={settings.email_from}
                                    onChange={e => setSettings(prev => ({ ...prev, email_from: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Resend API Key</label>
                                <input type="password" className="form-input" placeholder="re_..." value={settings.resend_api_key}
                                    onChange={e => setSettings(prev => ({ ...prev, resend_api_key: e.target.value }))} />
                            </div>
                        </div>
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            Crie uma conta em https://resend.com para obter a API Key
                        </small>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button type="submit" className="btn btn-primary btn-lg">
                            Salvar Configurações
                        </button>
                        {saved && (
                            <span className="animate-fade-in" style={{ color: 'var(--success)', fontSize: '0.9rem' }}>
                                ✅ Configurações salvas!
                            </span>
                        )}
                    </div>
                </form>
            </main>
        </div>
    );
}
