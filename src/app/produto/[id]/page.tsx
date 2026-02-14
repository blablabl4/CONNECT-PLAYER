'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ParticleBackground from '@/components/ParticleBackground';
import { Product, ProductVariation } from '@/lib/types';

// Demo products with variations
const DEMO_PRODUCTS: Record<string, Product> = {
    '1': {
        id: '1', name: 'Netflix', image_url: '', category: 'Streaming', duration: '30 dias', is_active: true, stock: 50,
        original_price: 0, price: 7.99,
        description: '🟢 Netflix Tela compartilhada!\n🟢 Plano 4K FHD\n🟢 Garantimos 25 dias da conta!\n🟢 ENTREGA AUTOMÁTICA\n⚠️ Não muda email e senha\n⚠️ Por ser uma conta compartilhada, pode ter interrupções, compre ciente!\n⚠️ O perfil enviado pode ter de 1 a 3 pessoas!',
        features: ['Plano 4K FHD', 'Garantia 25 dias', 'Entrega automática', 'Catálogo completo', 'Perfil individual'],
        variations: [
            { id: 'v1', product_id: '1', name: 'Netflix Compartilhada', description: 'Disponível (8)', price: 7.99, original_price: 11.99, discount: 33, duration: '30 dias', stock: 8, badge: 'Mais Vendido' },
            { id: 'v2', product_id: '1', name: 'Netflix Compartilhada', description: 'Disponível (5)', price: 7.99, original_price: 10.99, discount: 23, duration: '30 dias', stock: 5 },
            { id: 'v3', product_id: '1', name: 'Netflix Privada', description: 'Completo', price: 17.99, original_price: 24.99, discount: 28, duration: '30 dias', stock: 3 },
        ],
        created_at: '', updated_at: '',
    },
    '2': {
        id: '2', name: 'Spotify', image_url: '', category: 'Música', duration: '30 dias', is_active: true, stock: 100,
        original_price: 0, price: 5.99,
        description: '🟢 Spotify Premium Individual\n🟢 Sem anúncios, qualidade máxima\n🟢 Downloads ilimitados para ouvir offline\n🟢 ENTREGA AUTOMÁTICA\n⚠️ Conta compartilhada com acesso individual',
        features: ['Sem anúncios', 'Qualidade máxima (320kbps)', 'Download offline', 'Playlists ilimitadas', 'Pular faixas ilimitado'],
        variations: [
            { id: 'v1', product_id: '2', name: 'Spotify Individual', description: 'Disponível (12)', price: 5.99, original_price: 9.99, discount: 40, duration: '30 dias', stock: 12, badge: 'Mais Vendido' },
            { id: 'v2', product_id: '2', name: 'Spotify Família', description: 'Disponível (4)', price: 8.99, original_price: 14.99, discount: 40, duration: '30 dias', stock: 4 },
            { id: 'v3', product_id: '2', name: 'Spotify Premium Privado', description: 'Conta própria', price: 14.99, original_price: 21.90, discount: 32, duration: '30 dias', stock: 6 },
        ],
        created_at: '', updated_at: '',
    },
    '3': {
        id: '3', name: 'Disney+', image_url: '', category: 'Streaming', duration: '30 dias', is_active: true, stock: 30,
        original_price: 0, price: 6.99,
        description: '🟢 Disney+ Premium\n🟢 Marvel, Star Wars, Pixar e National Geographic\n🟢 Qualidade 4K HDR\n🟢 ENTREGA AUTOMÁTICA\n⚠️ Conta compartilhada, perfil individual',
        features: ['4K HDR Dolby Vision', 'Marvel exclusivo', 'Star Wars séries', 'Pixar completo', 'Downloads ilimitados'],
        variations: [
            { id: 'v1', product_id: '3', name: 'Disney+ Compartilhada', description: 'Disponível (6)', price: 6.99, original_price: 10.99, discount: 36, duration: '30 dias', stock: 6, badge: 'Popular' },
            { id: 'v2', product_id: '3', name: 'Disney+ Privada', description: 'Conta própria', price: 15.99, original_price: 22.99, discount: 30, duration: '30 dias', stock: 3 },
        ],
        created_at: '', updated_at: '',
    },
    '4': {
        id: '4', name: 'IPTV', image_url: '', category: 'IPTV', duration: '30 dias', is_active: true, stock: 200,
        original_price: 0, price: 19.99,
        description: '🟢 IPTV Full HD Premium\n🟢 +5000 canais ao vivo\n🟢 Esportes, filmes, séries e muito mais\n🟢 VOD com milhares de títulos\n🟢 Suporte técnico 24h\n🟢 Compatível com Smart TV, celular, PC e TV Box',
        features: ['+5000 canais ao vivo', 'VOD filmes e séries', 'Esportes ao vivo', 'Suporte 24h', 'Multi-dispositivo', 'EPG completo'],
        variations: [
            { id: 'v1', product_id: '4', name: 'IPTV Mensal', description: 'Disponível', price: 19.99, original_price: 29.99, discount: 33, duration: '30 dias', stock: 50, badge: 'Mais Vendido' },
            { id: 'v2', product_id: '4', name: 'IPTV Trimestral', description: '3 meses', price: 49.99, original_price: 89.99, discount: 44, duration: '90 dias', stock: 30 },
            { id: 'v3', product_id: '4', name: 'IPTV Semestral', description: '6 meses', price: 89.99, original_price: 179.99, discount: 50, duration: '6 meses', stock: 20, badge: 'Melhor Custo' },
            { id: 'v4', product_id: '4', name: 'IPTV Anual', description: '12 meses', price: 149.99, original_price: 359.99, discount: 58, duration: '1 ano', stock: 10 },
        ],
        created_at: '', updated_at: '',
    },
    '5': {
        id: '5', name: 'HBO Max', image_url: '', category: 'Streaming', duration: '30 dias', is_active: true, stock: 40,
        original_price: 0, price: 7.99,
        description: '🟢 HBO Max Premium\n🟢 Filmes recém-lançados do cinema\n🟢 Séries HBO originais premiadas\n🟢 ENTREGA AUTOMÁTICA\n⚠️ Conta compartilhada com perfil individual',
        features: ['Lançamentos do cinema', '4K Dolby Vision', 'Séries HBO originais', 'DC Universe', 'Conteúdo Warner Bros.'],
        variations: [
            { id: 'v1', product_id: '5', name: 'HBO Compartilhada', description: 'Disponível (7)', price: 7.99, original_price: 11.99, discount: 33, duration: '30 dias', stock: 7, badge: 'Popular' },
            { id: 'v2', product_id: '5', name: 'HBO Privada', description: 'Conta própria', price: 16.99, original_price: 24.99, discount: 32, duration: '30 dias', stock: 4 },
        ],
        created_at: '', updated_at: '',
    },
    '6': {
        id: '6', name: 'Crunchyroll', image_url: '', category: 'Streaming', duration: '30 dias', is_active: true, stock: 60,
        original_price: 0, price: 5.99,
        description: '🟢 Crunchyroll Premium\n🟢 Animes sem anúncios\n🟢 Biblioteca completa\n🟢 Simulcast do Japão\n🟢 ENTREGA AUTOMÁTICA',
        features: ['Sem anúncios', 'Simulcast do Japão', 'Biblioteca completa', 'Mangás digitais', 'Qualidade até 1080p'],
        variations: [
            { id: 'v1', product_id: '6', name: 'Crunchyroll Fan', description: 'Disponível (10)', price: 5.99, original_price: 9.99, discount: 40, duration: '30 dias', stock: 10, badge: 'Popular' },
            { id: 'v2', product_id: '6', name: 'Crunchyroll Mega Fan', description: 'Disponível (5)', price: 8.99, original_price: 14.99, discount: 40, duration: '30 dias', stock: 5 },
        ],
        created_at: '', updated_at: '',
    },
};

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProduct() {
            const id = params.id as string;
            try {
                const res = await fetch(`/api/products/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProduct(data);
                    if (data.variations?.length > 0) setSelectedVariation(data.variations[0]);
                    setLoading(false);
                    return;
                }
            } catch { /* demo */ }

            if (DEMO_PRODUCTS[id]) {
                const p = DEMO_PRODUCTS[id];
                setProduct(p);
                if (p.variations && p.variations.length > 0) setSelectedVariation(p.variations[0]);
            }
            setLoading(false);
        }
        fetchProduct();
    }, [params.id]);

    if (loading) {
        return (
            <>
                <Header />
                <ParticleBackground />
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--header-height)' }}>
                    <div className="spinner" />
                </div>
            </>
        );
    }

    if (!product) {
        return (
            <>
                <Header />
                <ParticleBackground />
                <div className="status-page">
                    <div className="container">
                        <div className="status-card">
                            <div className="status-icon" style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid var(--danger)' }}>❌</div>
                            <h2 className="status-title">Produto não encontrado</h2>
                            <p className="status-text">O produto que você procura não existe ou foi removido.</p>
                            <button className="btn btn-primary" onClick={() => router.push('/')}>Voltar à Home</button>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const currentPrice = selectedVariation ? selectedVariation.price : product.price;
    const originalPrice = selectedVariation ? selectedVariation.original_price : product.original_price;
    const discount = selectedVariation ? selectedVariation.discount : 0;
    const currentStock = selectedVariation ? selectedVariation.stock : product.stock;

    const getCategoryEmoji = (cat: string) => {
        switch (cat) {
            case 'Música': return '🎵';
            case 'IPTV': return '📺';
            case 'Games': return '🎮';
            default: return '🎬';
        }
    };

    const handleBuy = () => {
        const variationParam = selectedVariation ? `&variacao=${selectedVariation.id}&variacao_nome=${encodeURIComponent(selectedVariation.name)}` : '';
        router.push(`/checkout?produto=${product.id}&preco=${currentPrice}&qty=${quantity}${variationParam}`);
    };

    return (
        <>
            <Header />
            <ParticleBackground />

            <div className="pd-page">
                <div className="container">
                    {/* Breadcrumb */}
                    <div className="pd-breadcrumb">
                        <a href="/">Início</a>
                        <span>›</span>
                        <a href="/#produtos">Produtos</a>
                        <span>›</span>
                        <span className="pd-breadcrumb-active">{product.name}</span>
                    </div>

                    {/* 2x2 Grid */}
                    <div className="pd-grid">
                        {/* Card 1 — Top-left: Product Image (large) */}
                        <div className="pd-cell pd-cell-image">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="pd-img" />
                            ) : (
                                <div className="pd-placeholder">
                                    <span className="pd-placeholder-emoji">{getCategoryEmoji(product.category)}</span>
                                    <div className="pd-placeholder-brand">
                                        <span>CONTA</span>
                                        <span className="gold-text">{product.name.toUpperCase()}</span>
                                    </div>
                                </div>
                            )}
                            <div className="pd-sold-badge">🔥 +900 Vendidos</div>
                        </div>

                        {/* Card 2 — Top-right: Variations (narrow) */}
                        <div className="pd-cell pd-cell-vars">
                            <h3 className="pd-cell-title">Variações</h3>
                            <p className="pd-cell-sub">Selecione o plano desejado:</p>
                            <div className="pd-vars-list">
                                {product.variations?.map((v) => {
                                    const isActive = selectedVariation?.id === v.id && selectedVariation?.price === v.price;
                                    return (
                                        <div
                                            key={v.id + v.name + v.price}
                                            className={`pd-var ${isActive ? 'active' : ''}`}
                                            onClick={() => setSelectedVariation(v)}
                                        >
                                            {isActive && <span className="pd-var-sel">Selecionado</span>}
                                            <div className="pd-var-info">
                                                <span className="pd-var-name">{v.name}</span>
                                                <span className="pd-var-desc">
                                                    {v.badge && <span className="pd-var-badge">{v.badge}</span>}
                                                    {v.description}
                                                </span>
                                            </div>
                                            <div className="pd-var-pricing">
                                                {(v.discount || 0) > 0 && <span className="pd-var-old">R$ {(v.original_price || 0).toFixed(2)}</span>}
                                                <span className="pd-var-price">R$ {v.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Card 3 — Bottom-left: Info + Description (large) */}
                        <div className="pd-cell pd-cell-info">
                            <div className="pd-info-header">
                                <h1 className="pd-info-name">{selectedVariation?.name || product.name}</h1>
                                <div className="pd-info-price-row">
                                    {(discount || 0) > 0 && <span className="pd-info-old">R$ {(originalPrice || 0).toFixed(2)}</span>}
                                    {(discount || 0) > 0 && <span className="pd-info-discount">-{(discount || 0)}%</span>}
                                    <span className="pd-info-price">R$ {currentPrice.toFixed(2)}</span>
                                </div>
                                <span className="pd-info-delivery">⚡ Entrega Automática</span>
                            </div>
                            <div className="pd-info-divider" />
                            <h4 className="pd-info-desc-title">Descrição</h4>
                            <div className="pd-info-desc">
                                {product.description.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        </div>

                        {/* Card 4 — Bottom-right: Buy (narrow) */}
                        <div className="pd-cell pd-cell-buy">
                            <div className="pd-buy-price">R$ <strong>{currentPrice.toFixed(2)}</strong></div>
                            <div className="pd-buy-stock">
                                <span className="pd-buy-dot" />
                                {currentStock} Disponível
                            </div>

                            <div className="pd-buy-qty">
                                <button className="pd-buy-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                                <span className="pd-buy-qty-val">{quantity}</span>
                                <button className="pd-buy-qty-btn" onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}>+</button>
                            </div>

                            <button className="btn btn-primary btn-lg btn-block" onClick={handleBuy}>
                                Comprar agora
                            </button>

                            <div className="pd-buy-pay">
                                <span>Pix · à vista</span>
                                <span style={{ fontSize: '1.3rem' }}>💠</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}
