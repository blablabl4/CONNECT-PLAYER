'use client';

import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    color: string;
    life: number;
    maxLife: number;
}

export default function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let particles: Particle[] = [];
        let mouseX = -1000;
        let mouseY = -1000;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const COLORS = [
            'rgba(229, 168, 53, ',  // gold
            'rgba(240, 192, 80, ',  // light gold
            'rgba(255, 255, 255, ', // white
            'rgba(229, 168, 53, ',  // gold again (more gold)
        ];

        const createParticle = (): Particle => {
            const maxLife = 200 + Math.random() * 300;
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: -Math.random() * 0.3 - 0.1,
                opacity: 0,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                life: 0,
                maxLife,
            };
        };

        // Initialize particles
        const PARTICLE_COUNT = Math.min(80, Math.floor(window.innerWidth / 20));
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = createParticle();
            p.life = Math.random() * p.maxLife; // stagger
            particles.push(p);
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, i) => {
                p.life++;

                // Fade in / out
                if (p.life < 40) {
                    p.opacity = p.life / 40;
                } else if (p.life > p.maxLife - 40) {
                    p.opacity = (p.maxLife - p.life) / 40;
                } else {
                    p.opacity = 0.6 + Math.sin(p.life * 0.02) * 0.2;
                }

                // Mouse interaction — particles drift away gently
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150;
                    p.speedX += (dx / dist) * force * 0.15;
                    p.speedY += (dy / dist) * force * 0.15;
                }

                // Dampen speed
                p.speedX *= 0.99;
                p.speedY *= 0.99;

                p.x += p.speedX;
                p.y += p.speedY;

                // Respawn if off-screen or life ended
                if (p.life >= p.maxLife || p.x < -10 || p.x > canvas.width + 10 || p.y < -10 || p.y > canvas.height + 10) {
                    particles[i] = createParticle();
                    return;
                }

                // Draw
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color + (p.opacity * 0.7) + ')';
                ctx.fill();

                // Glow effect
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = p.color + (p.opacity * 0.08) + ')';
                ctx.fill();
            });

            // Draw connections between close particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        const opacity = (1 - dist / 120) * 0.08 * Math.min(particles[i].opacity, particles[j].opacity);
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(229, 168, 53, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            animationId = requestAnimationFrame(animate);
        };

        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    );
}
