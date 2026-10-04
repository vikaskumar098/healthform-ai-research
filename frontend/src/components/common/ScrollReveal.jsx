import React, { useRef, useEffect, useState } from 'react';

/**
 * ScrollReveal — a wrapper that applies reveal animations when the element enters the viewport.
 * 
 * @param {string} variant   — 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade' (default: 'up')
 * @param {number} delay     — animation delay in ms (default: 0)
 * @param {number} duration  — animation duration in ms (default: 700)
 * @param {number} threshold — intersection ratio 0..1 (default: 0.12)
 * @param {boolean} once     — reveal once only (default: true)
 * @param {string} className — extra classes on the wrapper div
 * @param {string} as        — HTML element type (default: 'div')
 */
const ScrollReveal = ({
  children,
  variant = 'up',
  delay = 0,
  duration = 700,
  threshold = 0.12,
  once = true,
  className = '',
  as: Tag = 'div',
}) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setVisible(true); return; }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: '-20px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const variantStyles = {
    up:    { initial: 'translateY(28px)',   final: 'translateY(0)' },
    down:  { initial: 'translateY(-28px)',  final: 'translateY(0)' },
    left:  { initial: 'translateX(-32px)',  final: 'translateX(0)' },
    right: { initial: 'translateX(32px)',   final: 'translateX(0)' },
    scale: { initial: 'scale(0.90)',        final: 'scale(1)' },
    fade:  { initial: 'scale(1)',           final: 'scale(1)' },
  };

  const v = variantStyles[variant] || variantStyles.up;

  const style = {
    opacity: visible ? 1 : 0,
    transform: visible ? v.final : v.initial,
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: visible ? 'auto' : 'opacity, transform',
  };

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
};

export default ScrollReveal;
