'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem('admin_auth', 'true');
                    router.push('/admin');
                } else {
                    setError('E-mail ou senha incorretos');
                }
            } else {
                setError('E-mail ou senha incorretos');
            }
        } catch {
            setError('Erro ao fazer login. Tente novamente.');
        }

        setLoading(false);
    };

    return (
        <div className="admin-login">
            <div className="admin-login-card">
                <div className="header-logo" style={{ justifyContent: 'center', fontSize: '1.6rem', marginBottom: '8px' }}>
                    <span className="white">CONNECT</span>
                    <span className="gold">PLAYER</span>
                </div>
                <p className="admin-login-subtitle">Painel Administrativo</p>

                {error && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--danger)',
                        fontSize: '0.85rem',
                        marginBottom: '20px',
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
                    <div className="form-group">
                        <label className="form-label">E-mail</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="admin@connectplayer.com"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Senha</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg btn-block"
                        disabled={loading}
                        style={{ marginTop: '8px' }}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
