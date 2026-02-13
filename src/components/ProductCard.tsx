'use client';

import Link from 'next/link';

interface ProductCardProps {
    id: string;
    name: string;
    description?: string;
    price: number;
    original_price?: number;
    discount?: number;
    image_url: string;
    category: string;
    duration: string;
    tag?: string;
}

export default function ProductCard({
    id, name, price, original_price, discount, image_url, category, duration, tag,
}: ProductCardProps) {
    const getCategoryEmoji = (cat: string) => {
        switch (cat) {
            case 'Música': return '🎵';
            case 'IPTV': return '📺';
            case 'Games': return '🎮';
            case 'Cloud': return '☁️';
            case 'VPN': return '🔒';
            default: return '🎬';
        }
    };

    return (
        <Link href={`/produto/${id}`} className="product-card">
            {/* Image area */}
            <div className="product-card-image">
                {image_url ? (
                    <img src={image_url} alt={name} />
                ) : (
                    <div className="product-card-placeholder">
                        <span className="product-card-emoji">{getCategoryEmoji(category)}</span>
                    </div>
                )}
                {tag && (
                    <div className="product-card-tag">
                        <span className="badge badge-gold">{tag}</span>
                    </div>
                )}
                {discount && discount > 0 && (
                    <div className="product-card-discount-tag">
                        -{discount}%
                    </div>
                )}
            </div>
            {/* Info area */}
            <div className="product-card-body">
                <h3 className="product-card-title">{name}</h3>
                <div className="product-card-pricing">
                    <div className="product-card-price-row">
                        <span className="product-card-price">R$ {price.toFixed(2)}</span>
                        {original_price && original_price > price && (
                            <span className="product-card-original-price">R$ {original_price.toFixed(2)}</span>
                        )}
                    </div>
                    <span className="product-card-duration">À vista no PIX</span>
                </div>
                <button className="product-card-cta">Ver Detalhes</button>
            </div>
        </Link>
    );
}
