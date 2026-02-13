'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ParticleBackground from '@/components/ParticleBackground';
import { supabase, Product } from '@/lib/supabase';

// Demo products
const DEMO_PRODUCTS: Product[] = [
  {
    id: '1', name: 'Netflix Compartilhada',
    description: 'Tela Ultra HD 4K, até 4 telas simultâneas. Acesso completo ao catálogo.',
    price: 7.99, original_price: 11.99, image_url: '', category: 'Streaming', duration: '30 dias',
    is_active: true, stock: 50, features: [], variations: [], created_at: '', updated_at: '',
  },
  {
    id: '2', name: 'Spotify Individual',
    description: 'Música sem anúncios, qualidade máxima, downloads offline.',
    price: 5.99, original_price: 9.99, image_url: '', category: 'Música', duration: '30 dias',
    is_active: true, stock: 100, features: [], variations: [], created_at: '', updated_at: '',
  },
  {
    id: '3', name: 'Disney+ Compartilhada',
    description: 'Marvel, Star Wars, Pixar. Conteúdo exclusivo em 4K HDR.',
    price: 6.99, original_price: 10.99, image_url: '', category: 'Streaming', duration: '30 dias',
    is_active: true, stock: 30, features: [], variations: [], created_at: '', updated_at: '',
  },
  {
    id: '4', name: 'IPTV Full HD',
    description: '+5000 canais ao vivo, filmes e séries on demand. Suporte 24h.',
    price: 19.99, original_price: 29.99, image_url: '', category: 'IPTV', duration: '30 dias',
    is_active: true, stock: 200, features: [], variations: [], created_at: '', updated_at: '',
  },
  {
    id: '5', name: 'HBO Compartilhada',
    description: 'Filmes recém-lançados, séries exclusivas. Qualidade até 4K.',
    price: 7.99, original_price: 11.99, image_url: '', category: 'Streaming', duration: '30 dias',
    is_active: true, stock: 40, features: [], variations: [], created_at: '', updated_at: '',
  },
  {
    id: '6', name: 'Crunchyroll Fan',
    description: 'Animes sem anúncios, biblioteca completa, simulcast do Japão.',
    price: 5.99, original_price: 9.99, image_url: '', category: 'Streaming', duration: '30 dias',
    is_active: true, stock: 60, features: [], variations: [], created_at: '', updated_at: '',
  },
];

const CATEGORIES = [
  { icon: '🎬', name: 'Streaming', count: 8, color: '#E50914' },
  { icon: '🎵', name: 'Música', count: 4, color: '#1DB954' },
  { icon: '📺', name: 'IPTV', count: 6, color: '#7C3AED' },
  { icon: '🎮', name: 'Games', count: 3, color: '#2563EB' },
  { icon: '☁️', name: 'Cloud', count: 2, color: '#0EA5E9' },
  { icon: '🔒', name: 'VPN', count: 3, color: '#F59E0B' },
];

const STEPS = [
  { icon: '🔍', title: 'Escolha seu produto', desc: 'Navegue pelo nosso catálogo e encontre o serviço ideal para você.' },
  { icon: '💳', title: 'Faça o pagamento', desc: 'Pague via Pix de forma rápida e segura. Confirmação instantânea.' },
  { icon: '📧', title: 'Receba por e-mail', desc: 'As credenciais são enviadas automaticamente para o seu e-mail.' },
  { icon: '✨', title: 'Aproveite!', desc: 'Acesse sua conta e aproveite todo o conteúdo premium.' },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % 2);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (data && data.length > 0 && !error) {
          setProducts(data);
        }
      } catch {
        // Use demo products if Supabase is not configured
      }
    }
    fetchProducts();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    if (activeCategory === categoryName) {
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryName);
      document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredProducts = activeCategory
    ? products.filter(p => p.category === activeCategory)
    : products;

  return (
    <>
      <Header />
      <ParticleBackground />

      {/* Banner Carousel */}
      <section className="hp-carousel">
        <div className="hp-carousel-track" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
          <div className="hp-slide">
            <img src="/banners/banner1.jpg" alt="Contas Premium" className="hp-slide-img" />
          </div>
          <div className="hp-slide">
            <img src="/banners/banner2.jpg" alt="Contas Premium" className="hp-slide-img" />
          </div>
        </div>
        <div className="hp-carousel-dots">
          {[0, 1].map(i => (
            <button
              key={i}
              className={`hp-carousel-dot ${carouselIndex === i ? 'active' : ''}`}
              onClick={() => setCarouselIndex(i)}
            />
          ))}
        </div>
        <button className="hp-carousel-arrow hp-carousel-prev" onClick={() => setCarouselIndex(p => p === 0 ? 1 : p - 1)}>‹</button>
        <button className="hp-carousel-arrow hp-carousel-next" onClick={() => setCarouselIndex(p => p === 1 ? 0 : p + 1)}>›</button>
      </section>

      {/* Categories — horizontal row */}
      <section className="hp-section" id="categorias">
        <div className="container">
          <div className="hp-section-header">
            <h2 className="hp-section-title">Categorias</h2>
            {activeCategory && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveCategory(null)}
              >
                ✕ Limpar filtro
              </button>
            )}
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className={`category-card ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.name)}
                style={{ '--cat-color': cat.color } as React.CSSProperties}
              >
                <div className="category-card-glow" />
                <div className="category-card-icon">{cat.icon}</div>
                <div className="category-card-name">{cat.name}</div>
                <div className="category-card-count">{cat.count} produtos</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products — HypeClub-style horizontal scroll row */}
      <section className="hp-section" id="produtos">
        <div className="container">
          <div className="hp-section-header">
            <h2 className="hp-section-title">
              {activeCategory
                ? <>{activeCategory} — <span className="gold-text">Produtos</span></>
                : <>Produtos em <span className="gold-text">destaque</span></>
              }
            </h2>
            <span className="hp-section-count">{filteredProducts.length} produto(s)</span>
          </div>

          <div className="hp-products-row">
            {filteredProducts.map((product, i) => {
              const originalPrice = product.original_price || 0;
              const discount = originalPrice > 0
                ? Math.round((1 - product.price / originalPrice) * 100)
                : 0;
              return (
                <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    description={product.description}
                    price={product.price}
                    original_price={product.original_price}
                    discount={discount}
                    image_url={product.image_url}
                    category={product.category}
                    duration={product.duration}
                    tag={!activeCategory && i === 0 ? '🔥 Mais Vendido' : !activeCategory && i === 1 ? '⭐ Popular' : undefined}
                  />
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
              <p>Nenhum produto encontrado nesta categoria</p>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="hp-section" id="como-funciona">
        <div className="container">
          <div className="hp-section-header">
            <h2 className="hp-section-title">
              Como <span className="gold-text">funciona?</span>
            </h2>
          </div>
          <div className="hp-steps">
            {STEPS.map((step, i) => (
              <div key={i} className="hp-step-card">
                <div className="hp-step-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="hp-step-icon">{step.icon}</div>
                <h3 className="hp-step-title">{step.title}</h3>
                <p className="hp-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hp-section" style={{ background: 'linear-gradient(135deg, rgba(229, 168, 53, 0.06), transparent)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="hp-section-title" style={{ justifyContent: 'center' }}>
            Pronto para <span className="gold-text">começar?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Milhares de clientes já confiam na Connect Player
          </p>
          <a href="#produtos" className="btn btn-primary btn-lg" style={{ animation: 'pulse-glow 3s infinite' }}>
            Explorar Produtos
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
