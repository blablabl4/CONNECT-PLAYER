'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PublicSettings {
    store_name: string;
    store_email: string;
    whatsapp: string;
    instagram: string;
}

export default function Footer() {
    const [settings, setSettings] = useState<PublicSettings | null>(null);

    useEffect(() => {
        fetch('/api/settings')
            .then(r => r.json())
            .then(setSettings)
            .catch(() => { });
    }, []);

    const whatsappUrl = settings?.whatsapp
        ? `https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`
        : '#';

    const instagramUrl = settings?.instagram
        ? `https://instagram.com/${settings.instagram.replace('@', '')}`
        : '#';

    const emailUrl = settings?.store_email
        ? `mailto:${settings.store_email}`
        : '#';

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="header-logo">
                            <span className="white">CONNECT</span>
                            <span className="gold">PLAYER</span>
                        </div>
                        <p>
                            Sua conta premium começa aqui. Contas de streaming com entrega
                            instantânea e os melhores preços do mercado.
                        </p>
                    </div>

                    <div>
                        <h4 className="footer-title">Navegação</h4>
                        <div className="footer-links">
                            <Link href="/">Início</Link>
                            <Link href="/#produtos">Produtos</Link>
                            <Link href="/#categorias">Categorias</Link>
                            <Link href="/#como-funciona">Como Funciona</Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="footer-title">Categorias</h4>
                        <div className="footer-links">
                            <Link href="/#categorias">Streaming</Link>
                            <Link href="/#categorias">Música</Link>
                            <Link href="/#categorias">IPTV</Link>
                            <Link href="/#categorias">Games</Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="footer-title">Contato</h4>
                        <div className="footer-links">
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                WhatsApp
                            </a>
                            <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                                Instagram
                            </a>
                            <a href={emailUrl}>
                                E-mail
                            </a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <span>© {new Date().getFullYear()} {settings?.store_name || 'Connect Player'}. Todos os direitos reservados.</span>
                    <span>Feito com ⚡ no Brasil</span>
                </div>
            </div>
        </footer>
    );
}
