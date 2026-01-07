import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, RefreshCcw, Heart, Share2, Smartphone, ShieldCheck, Play, Star, Monitor } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Photos optimisées et fiables pour éviter les erreurs de chargement
const EVENT_PHOTOS = [
  { 
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800", 
    caption: "L'équipe de choc ⚡️", 
    user: "Sarah" 
  },
  { 
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800", 
    caption: "Vibe incroyable ✨", 
    user: "Tom" 
  },
  { 
    url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800", 
    caption: "Best smile award 🏆", 
    user: "Juliette" 
  },
  { 
    url: "https://images.unsplash.com/photo-1496024840928-4c417daf2d1d?auto=format&fit=crop&q=80&w=800", 
    caption: "Party mode: ON 🚀", 
    user: "Max" 
  },
  { 
    url: "https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=800", 
    caption: "Santé ! 🥂", 
    user: "Chloé" 
  },
  { 
    url: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=800", 
    caption: "Quelle soirée... 🔥", 
    user: "Alex" 
  },
  { 
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800", 
    caption: "Moment magique ✨", 
    user: "Emma" 
  },
  { 
    url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800", 
    caption: "On s'éclate ! 🎉", 
    user: "Lucas" 
  },
  { 
    url: "https://images.unsplash.com/photo-1514525253440-b393452e3383?auto=format&fit=crop&q=80&w=800", 
    caption: "Souvenirs inoubliables 💫", 
    user: "Sophie" 
  },
  { 
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800", 
    caption: "La meilleure équipe 🏆", 
    user: "Thomas" 
  },
  { 
    url: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800", 
    caption: "Trop de fun ! 😄", 
    user: "Léa" 
  },
  { 
    url: "https://images.unsplash.com/photo-1519671482538-eb62680a812c?auto=format&fit=crop&q=80&w=800", 
    caption: "On kiffe ! 🔥", 
    user: "Nathan" 
  },
  { 
    url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800", 
    caption: "Ambiance de folie 🎊", 
    user: "Marie" 
  },
  { 
    url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800", 
    caption: "Meilleure soirée ever 🌟", 
    user: "Paul" 
  },
  { 
    url: "https://images.unsplash.com/photo-1496024840928-4c417daf2d1d?auto=format&fit=crop&q=80&w=800", 
    caption: "On se marre bien 😂", 
    user: "Julie" 
  },
  { 
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800", 
    caption: "Vibes positives ✨", 
    user: "Antoine" 
  },
  { 
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800", 
    caption: "Soirée légendaire 🚀", 
    user: "Camille" 
  },
];

// Photo principale (Selfie de groupe)
const HERO_PHOTO = "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=800";

interface HeroProps {
  onAdminClick: () => void;
}

// ============================================================================
// CONSTANTS - Motion Design System
// ============================================================================

// Cycle principal pour synchroniser toutes les animations
const CYCLE = 4.5; // Durée du cycle complet (en secondes)

// Easings harmonisés (2-3 max pour cohérence premium)
const EASE_OUT = [0.215, 0.61, 0.355, 1] as [number, number, number, number];
const EASE_SOFT = [0.25, 0.1, 0.25, 1] as [number, number, number, number];
const EASE_BACK_OUT = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

// Timing du storytelling (synchronisé avec CYCLE)
const TIMING = {
  PHOTO_CAPTURE: 0.1,      // Flash + prise de photo
  PHOTO_EXIT: 0.3,         // Photo quitte le téléphone
  BEAM_START: 0.3,         // Début du transfert
  PHOTO_ARRIVAL: 2.5,      // Photo arrive sur le mur
  REACTIONS: 3.0,           // Réactions sociales
} as const;

// ============================================================================
// INTERFACE
// ============================================================================

interface SceneAnimationProps {
  mode?: 'demo' | 'landing' | 'event-live';
}

interface PhotoGridItemProps {
  photo: typeof EVENT_PHOTOS[0];
  index: number;
}

// ============================================================================
// COMPOSANT PhotoGridItem
// ============================================================================

const PhotoGridItem: React.FC<PhotoGridItemProps> = ({ photo, index }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [likeCount, setLikeCount] = useState(12 + index * 4);

  // Animation de like - Intermittente (réduire charge GPU)
  useEffect(() => {
    if (!isLoaded) return;
    
    const interval = setInterval(() => {
      setLikeCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000 + index * 800); // Plus espacé pour réduire charge

    return () => clearInterval(interval);
  }, [isLoaded, index]);

  return (
    <div className="relative w-[calc(33.33%-0.15rem)] sm:w-[calc(33.33%-0.2rem)] md:w-[calc(33.33%-0.25rem)] aspect-[4/5] bg-gray-900 rounded-md md:rounded-lg overflow-hidden group border border-white/5">
       
       {/* Skeleton Loader - Visible until loaded */}
       {!isLoaded && (
          <div className="absolute inset-0 z-10 bg-gray-800 animate-pulse">
             <div className="absolute top-2 right-2 w-4 h-4 md:w-5 md:h-5 bg-gray-700 rounded-full opacity-50"></div>
             <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-gray-700/20 to-transparent"></div>
             <div className="absolute bottom-2 left-2 w-2/3 h-1.5 md:h-2 bg-gray-700 rounded opacity-50"></div>
          </div>
       )}

       <img 
         src={photo.url} 
         className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
         alt={`Souvenir ${index}`} 
         loading="lazy"
         onLoad={() => setIsLoaded(true)}
       />
       
       {/* Overlays (Hidden until loaded) */}
       <div className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
         {/* AI Caption Overlay */}
         <div className="absolute bottom-0 left-0 right-0 p-1 md:p-2 bg-gradient-to-t from-black/90 to-transparent">
             <div className="flex items-center gap-1 mb-0.5">
                 <Sparkles size={6} className="text-pink-400" />
                 <span className="text-[6px] md:text-[8px] text-gray-300 font-medium">AI generated</span>
             </div>
             <p className="text-[7px] md:text-[9px] font-medium text-white leading-tight hidden sm:block">{photo.caption}</p>
         </div>
         
         {/* Likes bubble - Intermittente */}
         <motion.div 
           className="absolute top-1 right-1 bg-black/60 backdrop-blur-md rounded-full px-1.5 py-0.5 flex items-center gap-0.5 z-20"
           animate={{ scale: [1, 1.2, 1] }}
           transition={{ 
             duration: 0.3, 
             repeat: Infinity, 
             repeatDelay: 6 + Math.random() * 6, // Intermittent
             ease: EASE_OUT
           }}
         >
            <Heart size={6} className="text-red-500 fill-red-500" />
            <motion.span 
              key={likeCount}
              initial={{ scale: 1.5, color: "#ef4444" }}
              animate={{ scale: 1, color: "#ffffff" }}
              transition={{ duration: 0.3 }}
              className="text-[6px] md:text-[8px] text-white font-bold"
            >
              {likeCount}
            </motion.span>
         </motion.div>

         {/* Animations de cœurs - Intermittentes (réduire GPU) */}
         {[...Array(1)].map((_, i) => (
           <motion.div
             key={`heart-${i}`}
             initial={{ 
               opacity: 0, 
               scale: 0, 
               x: `${50 + (i * 20)}%`, 
               y: "100%" 
             }}
             animate={{
               opacity: [0, 1, 1, 0],
               scale: [0, 1.2, 1, 0.8],
               y: ["100%", "50%", "0%", "-20%"],
               x: [`${50 + (i * 20)}%`, `${50 + (i * 20) + (Math.random() - 0.5) * 10}%`, `${50 + (i * 20) + (Math.random() - 0.5) * 15}%`, `${50 + (i * 20) + (Math.random() - 0.5) * 20}%`],
             }}
             transition={{
               duration: 2,
               repeat: Infinity,
               repeatDelay: 6 + Math.random() * 6, // Intermittent
               delay: index * 0.2,
               ease: EASE_OUT,
             }}
             className="absolute bottom-2 z-30 pointer-events-none"
           >
             <Heart 
               size={10} 
               className="text-red-500 fill-red-500 drop-shadow-lg" 
             />
           </motion.div>
         ))}

         {/* Étoiles de réaction - Intermittentes */}
         {[...Array(1)].map((_, i) => (
           <motion.div
             key={`star-${i}`}
             initial={{ 
               opacity: 0, 
               scale: 0, 
               x: `${30 + (i * 40)}%`, 
               y: "80%" 
             }}
             animate={{
               opacity: [0, 1, 1, 0],
               scale: [0, 1.3, 1, 0.7],
               y: ["80%", "40%", "10%", "-10%"],
               rotate: [0, 180, 360],
             }}
             transition={{
               duration: 2.5,
               repeat: Infinity,
               repeatDelay: 8 + Math.random() * 6, // Plus espacé
               delay: index * 0.3,
               ease: EASE_OUT,
             }}
             className="absolute bottom-4 z-30 pointer-events-none"
           >
             <Star 
               size={8} 
               className="text-yellow-400 fill-yellow-400 drop-shadow-lg" 
             />
           </motion.div>
         ))}
       </div>
    </div>
  );
};

// ============================================================================
// COMPOSANT SceneAnimation
// ============================================================================

const SceneAnimation: React.FC<SceneAnimationProps> = ({ mode = 'demo' }) => {
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Gestion du mouvement de la souris pour l'effet de parallaxe
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) - 0.5);
      mouseY.set((e.clientY / window.innerHeight) - 0.5);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY, prefersReducedMotion]);

  // Transformations fluides basées sur la souris (désactivées si reduced motion)
  const springConfig = { stiffness: 150, damping: 20 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [10, -5]), 
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [-15, 15]), 
    springConfig
  );
  const phoneX = useSpring(
    useTransform(mouseX, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [-20, 20]), 
    springConfig
  );

  // Helper pour désactiver les animations si reduced motion
  const getAnimationProps = (baseProps: any) => {
    if (prefersReducedMotion) {
      return { initial: baseProps.initial || {}, animate: {} };
    }
    return baseProps;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '2500px' }}>
      
      {/* Particules de poussière lumineuse - Animations intermittentes pour réduire GPU */}
      {!prefersReducedMotion && [...Array(4)].map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute w-1 h-1 bg-pink-500/30 rounded-full blur-[1px] z-0"
          {...getAnimationProps({
            animate: {
              y: [0, -40, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0, 0.6, 0],
            },
            transition: {
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              repeatDelay: 6 + Math.random() * 6, // Intermittent, pas continu
              delay: i * 0.8,
              ease: EASE_SOFT,
            },
          })}
          style={{
            left: `${20 + i * 20}%`,
            top: `${30 + i * 12}%`,
          }}
        />
      ))}

      {/* Vignette atmosphérique */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] z-5 pointer-events-none" />

      {/* WALL LAYER */}
      <motion.div
        style={{ 
          rotateX, 
          rotateY,
          filter: 'brightness(0.95) contrast(0.95)', // Hiérarchie visuelle
        }}
        className="absolute top-[30%] -translate-y-1/2 left-1/2 -translate-x-1/2 lg:left-auto lg:right-0 lg:translate-x-0 w-[85%] sm:w-[480px] md:w-[560px] lg:w-[650px] xl:w-[760px] min-h-[400px] h-auto max-h-[600px] sm:max-h-[700px] md:max-h-[800px] bg-[#0b0b0b] rounded-2xl border-[6px] border-[#202027] shadow-[0_40px_100px_-12px_rgba(0,0,0,0.7),0_10px_40px_-10px_rgba(139,92,246,0.3)] z-10 overflow-hidden transform-gpu blur-[0.5px] opacity-90"
      >
        {/* Balayage de reflet Premium - Intermittent */}
        {!prefersReducedMotion && (
          <motion.div 
            {...getAnimationProps({
              animate: { x: ['-100%', '200%'] },
              transition: { 
                duration: 4, 
                repeat: Infinity, 
                repeatDelay: 8, // Plus espacé
                ease: "linear" 
              },
            })}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent z-40 skew-x-12 pointer-events-none" 
          />
        )}
        
        {/* WallHeader */}
        <div className="absolute top-0 left-0 right-0 h-10 sm:h-12 bg-black/60 backdrop-blur-sm z-25 flex items-center justify-between px-4 sm:px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-pulse shadow shadow-red-900" />
            <span className="text-xs sm:text-sm font-bold text-pink-400 tracking-wide">LIVE FEED</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
          <div className="text-xs sm:text-sm font-mono text-gray-300 font-semibold drop-shadow">#WeddingSarahTom</div>
        </div>
        
        {/* PhotoGrid */}
        <div className="absolute inset-0 pt-12 sm:pt-14 pb-3 px-2 bg-black/90 flex flex-wrap content-start gap-1 sm:gap-1.5 overflow-y-auto overflow-x-hidden">
          {EVENT_PHOTOS.map((photo, i) => (
            <PhotoGridItem key={i} photo={photo} index={i} />
          ))}
          
          {/* IncomingPhoto */}
          <motion.div
            key="incoming-photo"
            {...getAnimationProps({
              initial: { opacity: 0, scale: 0.5, y: 100, rotate: -10 },
              animate: {
                opacity: [0, 0, 1, 1],
                scale: [0.5, 0.8, 1, 1],
                y: [100, 50, 0, 0],
                rotate: [-10, -5, 0, 0],
              },
              transition: {
                duration: 0.8,
                repeat: Infinity,
                repeatDelay: CYCLE,
                delay: TIMING.PHOTO_ARRIVAL,
                ease: EASE_BACK_OUT,
              },
            })}
            className="absolute top-12 sm:top-14 left-3 z-30 w-[calc(33.33%-0.2rem)] sm:w-[calc(33.33%-0.3rem)] aspect-[4/5] rounded-lg sm:rounded-xl shadow-[0_0_40px_rgba(139,92,246,0.8)] overflow-hidden ring-2 sm:ring-4 ring-pink-500 backdrop-blur-lg"
          >
            <img src={HERO_PHOTO} className="w-full h-full object-cover" alt="Live Photo" />
            
            {/* Flash d'arrivée - Synchronisé */}
            {!prefersReducedMotion && (
              <motion.div
                {...getAnimationProps({
                  animate: { opacity: [0, 1, 0] },
                  transition: { 
                    duration: 0.3, 
                    repeat: Infinity, 
                    repeatDelay: CYCLE, 
                    delay: TIMING.PHOTO_ARRIVAL + 0.3 
                  },
                })}
                className="absolute inset-0 bg-white/30"
              />
            )}
            
            {/* Particules de succès - Réduites (moins de GPU) */}
            {!prefersReducedMotion && [...Array(3)].map((_, i) => (
              <motion.div
                key={`success-particle-${i}`}
                {...getAnimationProps({
                  animate: {
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: [0, (Math.random() - 0.5) * 40],
                    y: [0, (Math.random() - 0.5) * 40],
                  },
                  transition: {
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: CYCLE,
                    delay: TIMING.PHOTO_ARRIVAL + 0.35 + i * 0.05,
                    ease: EASE_OUT,
                  },
                })}
                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full"
              />
            ))}
            
            {/* Likes bubble - Synchronisé */}
            <motion.div 
              className="absolute top-2 right-2 bg-black/70 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-1 z-40"
              {...getAnimationProps({
                initial: { scale: 0 },
                animate: { scale: [0, 1.3, 1] },
                transition: { 
                  duration: 0.5, 
                  repeat: Infinity, 
                  repeatDelay: CYCLE,
                  delay: TIMING.REACTIONS,
                  ease: EASE_BACK_OUT
                },
              })}
            >
              <Heart size={8} className="text-red-500 fill-red-500" />
              <span className="text-[7px] sm:text-[9px] text-white font-bold">0</span>
            </motion.div>

            {/* Explosion de cœurs - Réduite (éviter "too much") */}
            {!prefersReducedMotion && [...Array(6)].map((_, i) => (
              <motion.div
                key={`explosion-heart-${i}`}
                {...getAnimationProps({
                  initial: { 
                    opacity: 0, 
                    scale: 0, 
                    x: "50%", 
                    y: "50%" 
                  },
                  animate: {
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.5, 1, 0.5],
                    x: `calc(50% + ${Math.cos((i / 6) * Math.PI * 2) * 60}px)`,
                    y: `calc(50% + ${Math.sin((i / 6) * Math.PI * 2) * 60}px)`,
                    rotate: [0, 360],
                  },
                  transition: {
                    duration: 1.2,
                    repeat: Infinity,
                    repeatDelay: CYCLE,
                    delay: TIMING.REACTIONS + i * 0.05,
                    ease: EASE_OUT,
                  },
                })}
                className="absolute top-1/2 left-1/2 z-40 pointer-events-none"
              >
                <Heart 
                  size={12} 
                  className="text-red-500 fill-red-500 drop-shadow-xl" 
                />
              </motion.div>
            ))}
          </motion.div>
          
          {/* Réactions flottantes - Intermittentes */}
          {!prefersReducedMotion && [...Array(2)].map((_, i) => (
            <motion.div
              key={`floating-reaction-${i}`}
              {...getAnimationProps({
                initial: { 
                  opacity: 0, 
                  scale: 0, 
                  x: `${20 + i * 30}%`, 
                  y: "100%" 
                },
                animate: {
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.2, 1, 0.6],
                  y: ["100%", "60%", "20%", "-10%"],
                  x: [`${20 + i * 30}%`, `${20 + i * 30 + (Math.random() - 0.5) * 15}%`, `${20 + i * 30 + (Math.random() - 0.5) * 25}%`, `${20 + i * 30 + (Math.random() - 0.5) * 35}%`],
                  rotate: [0, 180, 360],
                },
                transition: {
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: CYCLE * 1.5 + i * 1.5, // Plus espacé
                  delay: i * 0.8,
                  ease: EASE_OUT,
                },
              })}
              className="absolute bottom-0 z-35 pointer-events-none"
            >
              {i % 2 === 0 ? (
                <Heart size={14} className="text-red-500 fill-red-500 drop-shadow-2xl" />
              ) : (
                <Star size={12} className="text-yellow-400 fill-yellow-400 drop-shadow-2xl" />
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Vignette pour focus central */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-20 pointer-events-none" />
      </motion.div>

      {/* PHONE LAYER */}
      <motion.div
        style={{ 
          x: phoneX, 
          y: useTransform(mouseY, [-0.5, 0.5], prefersReducedMotion ? [0, 0] : [-10, 10])
        }}
        {...getAnimationProps({
          animate: { y: [-8, 8, -8] },
          transition: { 
            duration: 6, 
            repeat: Infinity, 
            ease: EASE_SOFT 
          },
        })}
        className="absolute left-8 top-[55%] sm:left-[5%] md:left-[8%] w-[120px] h-[240px] sm:w-[150px] sm:h-[300px] lg:w-[180px] lg:h-[370px] bg-gradient-to-br from-[#181823] via-black to-[#0a0b15] rounded-[2.5rem] sm:rounded-[3rem] border-[5px] sm:border-[6px] border-[#30303a] shadow-[0_50px_100px_-20px_rgba(139,92,246,0.2)] z-50 overflow-hidden ring-2 ring-pink-500/20"
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-5 sm:h-7 bg-[#23232a] rounded-b-xl z-[60] shadow-lg" />
        
        <div className="w-full h-full relative rounded-[2.2rem] sm:rounded-[2.8rem] overflow-hidden">
            {/* Camera Viewfinder */}
            <img src={HERO_PHOTO} className="w-full h-full object-cover brightness-110" alt="Camera" />
            
            {/* Camera UI Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 z-[65] pointer-events-none">
              {/* Top UI */}
              <div className="flex justify-between items-start mt-3 sm:mt-4 opacity-90">
                <Zap size={16} className="text-pink-400 drop-shadow-lg" />
                <div className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-black/50 backdrop-blur-md rounded-full text-[9px] sm:text-xs font-semibold text-white border border-white/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="hidden sm:inline">Party </span>Wall
                </div>
                <RefreshCcw size={16} className="text-purple-400 drop-shadow-lg" />
              </div>

              {/* Focus Frame */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-44 sm:h-44 border-2 border-pink-500/40 rounded-xl pointer-events-none">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-pink-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-pink-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-pink-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-pink-500"></div>
              </div>

              {/* Bottom Controls */}
              <div className="flex flex-col items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black/60 border border-white/15 backdrop-blur flex items-center justify-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-cover bg-center" style={{backgroundImage: `url(${EVENT_PHOTOS[0].url})`}}></div>
                  </div>
                  
                  {/* Shutter Button - Synchronisé avec CYCLE */}
                  <motion.button
                    {...getAnimationProps({
                      animate: { 
                        scale: [1, 0.85, 1],
                        boxShadow: [
                          "0 0 0px rgba(236,72,153,0)",
                          "0 0 30px rgba(236,72,153,0.8)",
                          "0 0 0px rgba(236,72,153,0)"
                        ]
                      },
                      transition: { 
                        duration: 0.3, 
                        repeat: Infinity, 
                        repeatDelay: CYCLE,
                        delay: TIMING.PHOTO_CAPTURE,
                        ease: EASE_OUT
                      },
                    })}
                    className="w-14 h-14 sm:w-18 sm:h-18 rounded-full border-4 border-white shadow-xl flex items-center justify-center bg-white/30 backdrop-blur-sm relative overflow-hidden"
                  >
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-500 via-purple-500 to-pink-500 rounded-full shadow-lg"></div>
                    {/* Ripple effect - Synchronisé */}
                    {!prefersReducedMotion && (
                      <motion.div
                        {...getAnimationProps({
                          animate: { scale: [0, 2], opacity: [0.8, 0] },
                          transition: { 
                            duration: 0.6, 
                            repeat: Infinity, 
                            repeatDelay: CYCLE, 
                            delay: TIMING.PHOTO_CAPTURE + 0.15 
                          },
                        })}
                        className="absolute inset-0 rounded-full border-2 border-white"
                      />
                    )}
                  </motion.button>
                  
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-black/60 border border-white/15 backdrop-blur flex items-center justify-center text-white">
                    <Share2 size={14} />
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4 text-[8px] sm:text-[10px] font-semibold text-white/80 uppercase tracking-widest">
                  <span>Vidéo</span>
                  <span className="text-yellow-300">Photo</span>
                  <span>Portrait</span>
                </div>
              </div>
            </div>
            
            {/* Flash Effect - Synchronisé avec prise de photo */}
            <motion.div 
              {...getAnimationProps({
                animate: { 
                  opacity: [0, 1, 0.3, 0],
                  scale: [1, 1.1, 1]
                },
                transition: { 
                  duration: 0.4, 
                  repeat: Infinity, 
                  repeatDelay: CYCLE,
                  delay: TIMING.PHOTO_CAPTURE,
                  ease: EASE_OUT
                },
              })}
              className="absolute inset-0 bg-white z-[70] pointer-events-none"
            />
            
            {/* Photo qui sort du téléphone - Story: Photo quitte le téléphone */}
            <motion.div
              {...getAnimationProps({
                initial: { opacity: 0, scale: 0.3, y: 0, x: 0, rotate: 0 },
                animate: {
                  opacity: [0, 0, 1, 1, 0.8, 0],
                  scale: [0.3, 0.5, 0.8, 1, 0.9, 0.7],
                  y: [0, -20, -150, -300, -450, -600],
                  x: [0, 10, 40, 80, 120, 150],
                  rotate: [0, 5, 8, 6, 4, 2],
                },
                transition: {
                  duration: 2.2,
                  repeat: Infinity,
                  repeatDelay: CYCLE,
                  delay: TIMING.PHOTO_EXIT,
                  ease: EASE_SOFT,
                },
              })}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 w-28 h-36 sm:w-36 sm:h-48 bg-gradient-to-br from-white via-gray-50 to-pink-500/10 p-1.5 rounded-xl shadow-2xl z-[75] pointer-events-none border-2 border-pink-500/30"
            >
              <img src={HERO_PHOTO} className="w-full h-full object-cover rounded-lg shadow-inner" alt="Photo envoyée" />
              
              {/* Effet de brillance - Synchronisé */}
              {!prefersReducedMotion && (
                <motion.div
                  {...getAnimationProps({
                    animate: { opacity: [0, 0.5, 0] },
                    transition: { 
                      duration: 0.3, 
                      repeat: Infinity, 
                      repeatDelay: CYCLE, 
                      delay: TIMING.PHOTO_EXIT + 0.1 
                    },
                  })}
                  className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-lg pointer-events-none"
                />
              )}
              
              {/* Particules autour de la photo - Réduites */}
              {!prefersReducedMotion && [...Array(2)].map((_, i) => (
                <motion.div
                  key={`photo-particle-${i}`}
                  {...getAnimationProps({
                    animate: {
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      x: [0, (i - 1) * 20],
                      y: [0, (i - 1) * 20],
                    },
                    transition: {
                      duration: 0.8,
                      repeat: Infinity,
                      repeatDelay: CYCLE,
                      delay: TIMING.PHOTO_EXIT + 0.05 + i * 0.1,
                      ease: EASE_OUT,
                    },
                  })}
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-pink-500 rounded-full blur-sm"
                />
              ))}
            </motion.div>
        </div>
      </motion.div>

      {/* BEAM LAYER */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible hidden md:block">
        <defs>
          <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
            <stop offset="30%" stopColor="#ec4899" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
          <filter id="neonGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Story: Beam de transfert (synchronisé avec CYCLE) */}
        <motion.path
          d="M 220 520 Q 350 450, 500 350 Q 600 280, 680 260"
          fill="none"
          stroke="url(#beamGradient)"
          strokeWidth="4"
          filter="url(#neonGlow)"
          strokeDasharray="20 100"
          {...getAnimationProps({
            initial: { strokeDashoffset: 0 },
            animate: { 
              strokeDashoffset: [-120, 0],
              opacity: [0, 1, 1, 0]
            },
            transition: { 
              duration: 1.8, 
              repeat: Infinity, 
              repeatDelay: CYCLE,
              delay: TIMING.BEAM_START,
              ease: EASE_SOFT
            },
          })}
        />
        
        {/* Particules le long du beam - Réduites */}
        {!prefersReducedMotion && [...Array(5)].map((_, i) => (
          <motion.circle
            key={`beam-particle-${i}`}
            r="3"
            fill="url(#beamGradient)"
            filter="url(#neonGlow)"
            {...getAnimationProps({
              initial: { 
                opacity: 0,
                cx: 220 + i * 60,
                cy: 520 - i * 25,
              },
              animate: {
                opacity: [0, 1, 1, 0],
                cx: [220 + i * 60, 220 + i * 60 + 20, 220 + i * 60 + 40],
                cy: [520 - i * 25, 520 - i * 25 - 15, 520 - i * 25 - 30],
              },
              transition: {
                duration: 1.8,
                repeat: Infinity,
                repeatDelay: CYCLE,
                delay: TIMING.BEAM_START + i * 0.1,
                ease: EASE_SOFT,
              },
            })}
          />
        ))}
      </svg>
    </div>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL Hero
// ============================================================================

const Hero: React.FC<HeroProps> = ({ onAdminClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  // Smooth scroll for parallax
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const scrollYSpring = useSpring(scrollY, springConfig);
  
  const y1 = useTransform(scrollYSpring, [0, 500], [0, 200]);
  const y2 = useTransform(scrollYSpring, [0, 500], [0, -150]);

  // Staggered Text Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        ease: EASE_OUT
      } 
    }
  };

  return (
    <section ref={containerRef} className="relative min-h-[100svh] flex items-center justify-center pt-20 sm:pt-24 lg:pt-16 pb-8 sm:pb-12 lg:pb-16 overflow-hidden bg-gradient-to-br from-fuchsia-900 via-black to-pink-900">
      
      {/* Dynamic Background Elements */}
      <motion.div style={{ y: y1 }} className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-pink-500/20 rounded-full blur-[80px] md:blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />
      <motion.div style={{ y: y2 }} className="absolute bottom-0 right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-purple-500/15 rounded-full blur-[80px] md:blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />

      {/* Grid Pattern with mask */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-8 xl:gap-12">
          
          {/* Text Content */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 text-center lg:text-left relative z-20 pt-4 sm:pt-6 lg:pt-0"
          >
            {/* New Badge */}
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4 sm:mb-5 lg:mb-6 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-gray-200 tracking-wide uppercase">
                Le mur photo viral
              </span>
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white">
              Transformez vos invités en<br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 animate-gradient-x">
                photographes stars
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg sm:text-xl text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
              L'animation photo interactive qui sublime votre événement. <br/>
              <span className="text-white font-medium">Capturez. L'IA sublime. Le mur diffuse.</span> <br/>
              Zéro application à installer. Effet "Wow" immédiat.
            </motion.p>

            {/* Feature Pills */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
                {[
                    { icon: <Monitor size={14} />, text: "TV/PC + Smartphones" },
                    { icon: <Zap size={14} />, text: "Live Feed Instantané" },
                    { icon: <ShieldCheck size={14} />, text: "Modération IA 100% Sûre" }
                ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-gray-200 backdrop-blur-md shadow-sm hover:bg-white/10 transition-colors">
                        <span className="text-pink-400">{feature.icon}</span>
                        {feature.text}
                    </div>
                ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-2.5 justify-center lg:justify-start items-center mb-4 sm:mb-5 lg:mb-6 w-full sm:w-auto">
              <button 
                onClick={onAdminClick}
                className="relative px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-black rounded-full font-bold text-sm sm:text-base hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-1 w-full sm:w-auto overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Essayer gratuitement
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                 <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button className="px-5 sm:px-6 py-2.5 sm:py-3 bg-transparent border border-white/20 rounded-full font-semibold text-xs sm:text-sm text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 w-full sm:w-auto backdrop-blur-sm group">
                <Play className="w-3.5 h-3.5 fill-white group-hover:scale-110 transition-transform" />
                Voir la démo
              </button>
            </motion.div>

            {/* Social Proof Enhanced */}
            <motion.div variants={itemVariants} className="flex items-center justify-center lg:justify-start gap-2.5">
               <div className="flex -space-x-2">
                  {EVENT_PHOTOS.slice(0,3).map((photo, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 bg-cover bg-center" style={{backgroundImage: `url(${photo.url})`}}></div>
                  ))}
               </div>
               <div className="flex items-center gap-1">
                   {[1,2,3,4,5].map(s => <Star key={s} size={11} className="text-yellow-400 fill-yellow-400" />)}
               </div>
               <span className="text-xs text-gray-400"><strong className="text-white">4.9/5</strong> par +500 organisateurs</span>
            </motion.div>
          </motion.div>

          {/* 3D Scene */}
          <div className="hidden md:flex flex-1 w-full relative h-[400px] sm:h-[500px] lg:h-[550px] xl:h-[600px] items-center justify-center mt-6 sm:mt-8 lg:mt-0">
             <SceneAnimation mode="demo" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

