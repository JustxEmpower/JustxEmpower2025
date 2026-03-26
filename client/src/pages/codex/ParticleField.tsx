import React, { useRef, useEffect } from 'react';

interface ParticleFieldProps {
  color?: string;
  particleCount?: number;
  speed?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  opacityDir: number;
  drift: number;
}

const ParticleField: React.FC<ParticleFieldProps> = ({
  color = '#C9A96E',
  particleCount = 1200,
  speed = 0.3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Parse hex color to RGB
    const hexToRgb = (hex: string) => {
      const c = hex.replace('#', '');
      return {
        r: parseInt(c.substring(0, 2), 16),
        g: parseInt(c.substring(2, 4), 16),
        b: parseInt(c.substring(4, 6), 16),
      };
    };
    const rgb = hexToRgb(color);

    // Init particles
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.8 + 0.3,
        speedX: (Math.random() - 0.5) * speed * 0.4,
        speedY: (Math.random() - 0.5) * speed * 0.3 - speed * 0.1,
        opacity: Math.random() * 0.5 + 0.05,
        opacityDir: (Math.random() - 0.5) * 0.008,
        drift: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        // Gentle floating motion
        p.x += p.speedX + Math.sin(p.drift) * 0.08;
        p.y += p.speedY + Math.cos(p.drift) * 0.06;
        p.drift += 0.003;

        // Pulse opacity
        p.opacity += p.opacityDir;
        if (p.opacity > 0.55 || p.opacity < 0.03) p.opacityDir *= -1;

        // Wrap around edges
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        if (p.y < -5) p.y = h + 5;
        if (p.y > h + 5) p.y = -5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.opacity})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [color, particleCount, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default ParticleField;
