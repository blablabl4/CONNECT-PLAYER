'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-inner">
                <Link href="/" className="header-logo">
                    <span className="white">CONNECT</span>
                    <span className="gold">PLAYER</span>
                </Link>

                <nav className={`header-nav ${menuOpen ? 'active' : ''}`}>
                    <Link href="/" onClick={() => setMenuOpen(false)}>Início</Link>
                    <Link href="/#produtos" onClick={() => setMenuOpen(false)}>Produtos</Link>
                    <Link href="/#categorias" onClick={() => setMenuOpen(false)}>Categorias</Link>
                    <Link href="/#como-funciona" onClick={() => setMenuOpen(false)}>Como Funciona</Link>
                    <Link href="/afiliados" onClick={() => setMenuOpen(false)}>Afiliados</Link>
                </nav>

                <button
                    className="header-mobile-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Menu"
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>
        </header>
    );
}
