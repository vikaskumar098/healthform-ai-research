import React, { useEffect, useRef } from 'react';

/**
 * ParticleCanvas — ambient floating particles for the hero/background.
 * Pure canvas-based for 60fps performance.
 * Respects prefers-reduced-motion and pauses when not visible.
 */
const ParticleCanvas = ({
  count = 40,
  color1 = '34, 211, 238',    // cyan
  color2 = '99, 102, 241',    // indigo
  color3 = '16, 185, 129',    // emerald
  maxRadius = 2.5,
  speed = 0.3,
  className = '',
}) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  const pausedRef = useRef(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const colors = [color1, color2, color3];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * maxRadius + 0.5,
        dx: (Math.random() - 0.5) * speed,
        dy: (Math.random() - 0.5) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.1,
        opacityDir: Math.random() > 0.5 ? 1 : -1,
        opacitySpeed: Math.random() * 0.005 + 0.002,
      }));
    };
    initParticles();

    // Visibility detection
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => { pausedRef.current = !entry.isIntersecting; },
      { threshold: 0 }
    );
    intersectionObserver.observe(canvas);

    const draw = () => {
      if (pausedRef.current) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        // Update
        p.x += p.dx;
        p.y += p.dy;
        p.opacity += p.opacityDir * p.opacitySpeed;

        if (p.opacity >= 0.6) p.opacityDir = -1;
        if (p.opacity <= 0.05) p.opacityDir = 1;

        // Wrap around
        if (p.x < -p.r) p.x = canvas.width + p.r;
        if (p.x > canvas.width + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = canvas.height + p.r;
        if (p.y > canvas.height + p.r) p.y = -p.r;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [count, color1, color2, color3, maxRadius, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
};

export default ParticleCanvas;
