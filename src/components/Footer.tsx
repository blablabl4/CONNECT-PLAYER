import Link from 'next/link';

export default function Footer() {
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
                            <a href="#">WhatsApp</a>
                            <a href="#">Instagram</a>
                            <a href="#">E-mail</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <span>© {new Date().getFullYear()} Connect Player. Todos os direitos reservados.</span>
                    <span>Feito com ⚡ no Brasil</span>
                </div>
            </div>
        </footer>
    );
}
