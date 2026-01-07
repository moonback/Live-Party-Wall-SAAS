import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Camera, Sparkles } from 'lucide-react';

interface Hero3DSceneProps {
  className?: string;
}

/**
 * Scène 3D interactive pour le hero de la landing page
 * Effets de particules 3D, rotation interactive et profondeur
 */
export const Hero3DScene: React.FC<Hero3DSceneProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Motion values pour l'interactivité
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Springs pour des animations fluides
  const springConfig = { damping: 25, stiffness: 200 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);

  // Gestion du mouvement de la souris
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);
      
      mouseX.set(x);
      mouseY.set(y);
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Particules 3D
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    z: Math.random() * 200 - 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 2,
    duration: Math.random() * 3 + 2,
  }));

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Container 3D */}
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Orbe central avec effet 3D (remplace le logo pour éviter duplication) */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            transform: 'translateZ(50px)',
          }}
          animate={{
            scale: isHovered ? 1.2 : 1,
            rotateZ: isHovered ? 10 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80">
            {/* Glow effect central */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-pink-500/40 to-purple-500/40 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-2xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
          </div>
        </motion.div>

        {/* Particules 3D flottantes */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-br from-pink-400/40 to-purple-400/40 backdrop-blur-sm"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              transform: `translateZ(${particle.z}px)`,
              boxShadow: '0 0 20px rgba(236, 72, 153, 0.5)',
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.sin(particle.id) * 20, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Orbes de lumière 3D */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-pink-500/20 blur-3xl"
          style={{
            transform: 'translateZ(-100px)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl"
          style={{
            transform: 'translateZ(-150px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        {/* Éléments décoratifs 3D */}
        <motion.div
          className="absolute top-1/3 right-1/3"
          style={{
            transform: 'translateZ(30px)',
          }}
          animate={{
            rotateZ: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <Camera className="w-12 h-12 text-pink-400/30" />
        </motion.div>

        <motion.div
          className="absolute bottom-1/3 left-1/3"
          style={{
            transform: 'translateZ(40px)',
          }}
          animate={{
            rotateZ: [360, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <Sparkles className="w-10 h-10 text-purple-400/30" />
        </motion.div>

        {/* Grille 3D de fond */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            transform: 'translateZ(-200px)',
            backgroundImage: `
              linear-gradient(rgba(236, 72, 153, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(236, 72, 153, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </motion.div>

      {/* Effet de lumière dynamique */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${50 + mousePosition.x * 20}% ${50 + mousePosition.y * 20}%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)`,
        }}
      />
    </div>
  );
};

