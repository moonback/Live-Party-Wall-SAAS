import React, { useEffect, useRef } from 'react';

interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface BubblesEffectProps {
  /** Intensité de l'effet (0-1) */
  intensity?: number;
  /** Durée de l'effet en ms */
  duration?: number;
  /** Callback appelé à la fin de l'effet */
  onComplete?: () => void;
}

/**
 * Composant d'effet de bulles flottantes
 */
export const BubblesEffect: React.FC<BubblesEffectProps> = ({
  intensity = 1,
  duration = 5000,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

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

    // Créer les bulles initiales
    const bubbleCount = Math.floor(30 * intensity);
    bubblesRef.current = Array.from({ length: bubbleCount }, () => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 2 - 1,
        size: Math.random() * 30 + 10,
        opacity: Math.random() * 0.5 + 0.3,
        color
      };
    });

    // Animation
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > duration) {
        if (onComplete) onComplete();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bubblesRef.current.forEach((bubble) => {
        // Mise à jour de la position
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;

        // Effet de flottement
        bubble.x += Math.sin(bubble.y * 0.01) * 0.5;

        // Réapparition en bas si la bulle sort par le haut
        if (bubble.y < -bubble.size) {
          bubble.y = canvas.height + bubble.size;
          bubble.x = Math.random() * canvas.width;
        }

        // Réapparition en haut si la bulle sort par le bas (pour continuité)
        if (bubble.y > canvas.height + bubble.size) {
          bubble.y = -bubble.size;
          bubble.x = Math.random() * canvas.width;
        }

        // Réapparition sur les côtés
        if (bubble.x < -bubble.size) {
          bubble.x = canvas.width + bubble.size;
        }
        if (bubble.x > canvas.width + bubble.size) {
          bubble.x = -bubble.size;
        }

        // Dessiner la bulle avec reflet
        ctx.save();
        ctx.globalAlpha = bubble.opacity;
        
        // Cercle principal
        const gradient = ctx.createRadialGradient(
          bubble.x - bubble.size * 0.3,
          bubble.y - bubble.size * 0.3,
          0,
          bubble.x,
          bubble.y,
          bubble.size
        );
        gradient.addColorStop(0, `${bubble.color}80`);
        gradient.addColorStop(1, `${bubble.color}20`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        ctx.fill();

        // Reflet lumineux
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(
          bubble.x - bubble.size * 0.3,
          bubble.y - bubble.size * 0.3,
          bubble.size * 0.3,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Bordure
        ctx.strokeStyle = `${bubble.color}60`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
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
  }, [intensity, duration, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen', isolation: 'isolate' }}
    />
  );
};

