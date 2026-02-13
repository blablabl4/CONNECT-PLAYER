'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { href: '/admin', icon: '📊', label: 'Dashboard' },
    { href: '/admin/produtos', icon: '📦', label: 'Produtos' },
    { href: '/admin/pedidos', icon: '🛒', label: 'Pedidos' },
    { href: '/admin/credenciais', icon: '🔑', label: 'Credenciais' },
    { href: '/admin/configuracoes', icon: '⚙️', label: 'Configurações' },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Hamburger Toggle Button (mobile) */}
            <button
                className="admin-sidebar-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Menu"
            >
                <span className={`hamburger ${isOpen ? 'open' : ''}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-logo">
                    <Link href="/admin" className="header-logo" style={{ fontSize: '1.2rem' }}>
                        <span className="white">CONNECT</span>
                        <span className="gold">PLAYER</span>
                    </Link>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Painel Administrativo
                    </div>
                </div>
                <nav className="admin-sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`admin-sidebar-link ${pathname === item.href ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="admin-sidebar-link-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div style={{
                    position: 'absolute', bottom: '24px', left: '12px', right: '12px',
                }}>
                    <Link href="/" className="admin-sidebar-link" style={{ color: 'var(--text-muted)' }}>
                        <span className="admin-sidebar-link-icon">🌐</span>
                        Ver Loja
                    </Link>
                    <button
                        className="admin-sidebar-link"
                        style={{ width: '100%', background: 'none', color: 'var(--danger)' }}
                        onClick={() => {
                            localStorage.removeItem('admin_auth');
                            window.location.href = '/admin/login';
                        }}
                    >
                        <span className="admin-sidebar-link-icon">🚪</span>
                        Sair
                    </button>
                </div>
            </aside>
        </>
    );
}
