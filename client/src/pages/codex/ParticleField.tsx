import React, { useRef, useEffect } from 'react';

interface ParticleFieldProps {
  particleCount?: number;
}

interface Particle {
  x: number;
  y: number;
  baseSize: number;
  speedX: number;
  speedY: number;
  opacity: number;
  maxOpacity: number;
  opacitySpeed: number;
  phase: number;
  phaseSpeed: number;
  glowSize: number;
  warmth: number; // 0 = pure gold, 1 = warm amber
}

const ParticleField: React.FC<ParticleFieldProps> = ({
  particleCount = 800,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Golden color palette
    const GOLD_COLORS = [
      { r: 212, g: 175, b: 55 },   // classic gold
      { r: 255, g: 215, b: 0 },    // pure gold
      { r: 218, g: 165, b: 32 },   // goldenrod
      { r: 255, g: 193, b: 37 },   // warm gold
      { r: 184, g: 134, b: 11 },   // dark goldenrod
      { r: 255, g: 223, b: 120 },  // light gold
    ];

    // Create particles with varied properties
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const isBig = Math.random() < 0.08; // 8% are larger accent particles
      const isTiny = Math.random() < 0.5; // 50% are dust-like
      particles.push({
        x: Math.random() * (w || 800),
        y: Math.random() * (h || 600),
        baseSize: isBig ? Math.random() * 3 + 2 : isTiny ? Math.random() * 0.8 + 0.3 : Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: -Math.random() * 0.12 - 0.02, // gentle upward drift
        opacity: 0,
        maxOpacity: isBig ? Math.random() * 0.6 + 0.3 : isTiny ? Math.random() * 0.3 + 0.05 : Math.random() * 0.5 + 0.1,
        opacitySpeed: Math.random() * 0.006 + 0.002,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.008 + 0.002,
        glowSize: isBig ? Math.random() * 12 + 6 : Math.random() * 4 + 1,
        warmth: Math.random(),
      });
    }

    let time = 0;

    const animate = () => {
      if (!w || !h) { resize(); }
      ctx.clearRect(0, 0, w, h);
      time++;

      for (const p of particles) {
        // Gentle sine-wave floating
        p.phase += p.phaseSpeed;
        p.x += p.speedX + Math.sin(p.phase) * 0.15;
        p.y += p.speedY + Math.cos(p.phase * 0.7) * 0.08;

        // Breathing opacity
        const breathe = Math.sin(p.phase * 1.2) * 0.5 + 0.5;
        p.opacity = p.maxOpacity * (0.4 + breathe * 0.6);

        // Wrap edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Pick gold shade
        const ci = Math.floor(p.warmth * (GOLD_COLORS.length - 1));
        const gc = GOLD_COLORS[ci];

        // Outer glow
        if (p.glowSize > 2) {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.glowSize);
          grd.addColorStop(0, `rgba(${gc.r},${gc.g},${gc.b},${p.opacity * 0.4})`);
          grd.addColorStop(0.4, `rgba(${gc.r},${gc.g},${gc.b},${p.opacity * 0.12})`);
          grd.addColorStop(1, `rgba(${gc.r},${gc.g},${gc.b},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.glowSize, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.baseSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${gc.r},${gc.g},${gc.b},${p.opacity})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
};

export default ParticleField;
