import React, { useEffect, useRef } from 'react';

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

interface Firework {
  x: number;
  y: number;
  vy: number;
  exploded: boolean;
  particles: FireworkParticle[];
  color: string;
}

interface FireworksEffectProps {
  /** Intensité de l'effet (0-1) */
  intensity?: number;
  /** Durée de l'effet en ms */
  duration?: number;
  /** Nombre de feux d'artifice */
  count?: number;
  /** Callback appelé à la fin de l'effet */
  onComplete?: () => void;
}

/**
 * Composant d'effet de feux d'artifice
 */
export const FireworksEffect: React.FC<FireworksEffectProps> = ({
  intensity = 1,
  duration = 4000,
  count = 3,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireworksRef = useRef<Firework[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const colorsRef = useRef<string[]>(['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#F7DC6F', '#BB8FCE', '#85C1E2']);

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

    // Créer les feux d'artifice initiaux
    const fireworkCount = Math.floor(count * intensity);
    fireworksRef.current = Array.from({ length: fireworkCount }, () => {
      const color = colorsRef.current[Math.floor(Math.random() * colorsRef.current.length)];
      return {
        x: Math.random() * canvas.width,
        y: canvas.height,
        vy: -Math.random() * 8 - 5,
        exploded: false,
        particles: [],
        color
      };
    });

    // Fonction pour créer les particules d'explosion
    const explode = (firework: Firework) => {
      const particleCount = 30;
      firework.particles = Array.from({ length: particleCount }, () => {
        const angle = (Math.PI * 2 * Math.random());
        const speed = Math.random() * 5 + 2;
        return {
          x: firework.x,
          y: firework.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: firework.color,
          life: 1,
          maxLife: 1,
          size: Math.random() * 3 + 2
        };
      });
      firework.exploded = true;
    };

    // Animation
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > duration) {
        if (onComplete) onComplete();
        return;
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      fireworksRef.current.forEach((firework) => {
        if (!firework.exploded) {
          // Mouvement du feu d'artifice vers le haut
          firework.y += firework.vy;
          firework.vy += 0.2; // Gravité

          // Dessiner le feu d'artifice
          ctx.fillStyle = firework.color;
          ctx.beginPath();
          ctx.arc(firework.x, firework.y, 3, 0, Math.PI * 2);
          ctx.fill();

          // Exploser quand il atteint une certaine hauteur ou ralentit
          if (firework.y < canvas.height * 0.3 || firework.vy > 0) {
            explode(firework);
          }
        } else {
          // Animer les particules
          firework.particles = firework.particles.filter((particle) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravité
            particle.life -= 0.02;

            // Dessiner la particule
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            return particle.life > 0;
          });
          ctx.globalAlpha = 1;
        }
      });

      // Créer de nouveaux feux d'artifice occasionnellement
      if (elapsed < duration * 0.8 && Math.random() < 0.02) {
        const color = colorsRef.current[Math.floor(Math.random() * colorsRef.current.length)];
        fireworksRef.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height,
          vy: -Math.random() * 8 - 5,
          exploded: false,
          particles: [],
          color
        });
      }

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

