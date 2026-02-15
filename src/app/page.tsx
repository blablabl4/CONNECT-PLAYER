'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ParticleBackground from '@/components/ParticleBackground';
import { Product } from '@/lib/types';

interface Category {
  icon: string;
  name: string;
  color: string;
}

interface Banner {
  url: string;
  alt: string;
}

const STEPS = [
  { icon: '🔍', title: 'Escolha seu produto', desc: 'Navegue pelo nosso catálogo e encontre o serviço ideal para você.' },
  { icon: '💳', title: 'Faça o pagamento', desc: 'Pague via Pix de forma rápida e segura. Confirmação instantânea.' },
  { icon: '📧', title: 'Receba por e-mail', desc: 'As credenciais são enviadas automaticamente para o seu e-mail.' },
  { icon: '✨', title: 'Aproveite!', desc: 'Acesse sua conta e aproveite todo o conteúdo premium.' },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Auto-advance carousel
  const bannerCount = banners.length || 1;
  useEffect(() => {
    if (bannerCount <= 1) return;
    const timer = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % bannerCount);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerCount]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes, banRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/admin/categories'),
          fetch('/api/admin/banners'),
        ]);
        if (prodRes.ok) setProducts(await prodRes.json() || []);
        if (catRes.ok) setCategories(await catRes.json() || []);
        if (banRes.ok) setBanners(await banRes.json() || []);
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Track affiliate visit
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        fetch('/api/affiliates/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: ref,
            page: window.location.pathname,
            user_agent: navigator.userAgent,
          }),
        }).catch(() => { });
        // Store ref in localStorage for future reference
        localStorage.setItem('affiliate_ref', ref);
      }
    }
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
      {banners.length > 0 && (
        <section className="hp-carousel">
          <div className="hp-carousel-track" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
            {banners.map((b, i) => (
              <div key={i} className="hp-slide">
                <img src={b.url} alt={b.alt} className="hp-slide-img" />
              </div>
            ))}
          </div>
          {banners.length > 1 && (
            <>
              <div className="hp-carousel-dots">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    className={`hp-carousel-dot ${carouselIndex === i ? 'active' : ''}`}
                    onClick={() => setCarouselIndex(i)}
                  />
                ))}
              </div>
              <button className="hp-carousel-arrow hp-carousel-prev" onClick={() => setCarouselIndex(p => p === 0 ? banners.length - 1 : p - 1)}>‹</button>
              <button className="hp-carousel-arrow hp-carousel-next" onClick={() => setCarouselIndex(p => (p + 1) % banners.length)}>›</button>
            </>
          )}
        </section>
      )}

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
            {categories.filter(cat => products.some(p => p.category === cat.name)).map((cat) => (
              <div
                key={cat.name}
                className={`category-card ${activeCategory === cat.name ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.name)}
                style={{ '--cat-color': cat.color } as React.CSSProperties}
              >
                <div className="category-card-glow" />
                <div className="category-card-icon">{cat.icon}</div>
                <div className="category-card-name">{cat.name}</div>
                <div className="category-card-count">{products.filter(p => p.category === cat.name).length} produtos</div>
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
