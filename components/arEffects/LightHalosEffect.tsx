import React, { useEffect, useRef } from 'react';

interface Halo {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  opacity: number;
  pulseSpeed: number;
}

interface LightHalosEffectProps {
  /** Intensité de l'effet (0-1) */
  intensity?: number;
  /** Durée de l'effet en ms */
  duration?: number;
  /** Nombre de halos */
  count?: number;
  /** Callback appelé à la fin de l'effet */
  onComplete?: () => void;
}

/**
 * Composant d'effet de halos lumineux pulsants
 */
export const LightHalosEffect: React.FC<LightHalosEffectProps> = ({
  intensity = 1,
  duration = 4000,
  count = 5,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const halosRef = useRef<Halo[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#F7DC6F', '#BB8FCE', '#85C1E2', '#FFD93D'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajuster la taille du canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Créer les halos initiaux
    const haloCount = Math.floor(count * intensity);
    halosRef.current = Array.from({ length: haloCount }, () => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 0,
        maxRadius: Math.random() * 150 + 100,
        color,
        opacity: Math.random() * 0.5 + 0.3,
        pulseSpeed: Math.random() * 0.05 + 0.02
      };
    });

    // Animation
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > duration) {
        if (onComplete) onComplete();
        return;
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      halosRef.current.forEach((halo) => {
        // Pulsation du halo
        halo.radius += halo.pulseSpeed * halo.maxRadius;
        if (halo.radius > halo.maxRadius) {
          halo.radius = 0;
          // Repositionner occasionnellement
          if (Math.random() < 0.1) {
            halo.x = Math.random() * canvas.width;
            halo.y = Math.random() * canvas.height;
          }
        }

        // Dessiner le halo avec gradient radial
        const gradient = ctx.createRadialGradient(
          halo.x,
          halo.y,
          0,
          halo.x,
          halo.y,
          halo.radius
        );
        gradient.addColorStop(0, `${halo.color}${Math.floor(halo.opacity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.5, `${halo.color}${Math.floor(halo.opacity * 0.5 * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${halo.color}00`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(halo.x, halo.y, halo.radius, 0, Math.PI * 2);
        ctx.fill();

        // Dessiner un point lumineux au centre
        ctx.fillStyle = halo.color;
        ctx.globalAlpha = halo.opacity;
        ctx.beginPath();
        ctx.arc(halo.x, halo.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity, duration, count, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen', isolation: 'isolate' }}
    />
  );
};

