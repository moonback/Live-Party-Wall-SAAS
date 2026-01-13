import React, { useMemo } from 'react';

export const WallBackground = React.memo(() => {
  // Vérifier si l'utilisateur préfère réduire les animations
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Limiter le nombre de particules si reduced motion
  const particleCount = prefersReducedMotion ? 3 : 6;

  return (
    <>
       {/* Background Decor */}
       <div className="fixed inset-0 pointer-events-none opacity-40">
         <div 
           className="absolute top-[-10%] right-[-10%] w-[900px] h-[900px] bg-gradient-to-br from-pink-600/20 via-purple-600/25 to-cyan-600/20 rounded-full blur-[200px] animate-blob" 
           style={{ 
             animation: prefersReducedMotion ? 'none' : 'blob 15s ease-in-out infinite',
             willChange: prefersReducedMotion ? 'auto' : 'transform',
             transform: 'translateZ(0)' // Force GPU acceleration
           }}
         ></div>
         <div 
           className="absolute bottom-[-10%] left-[-10%] w-[900px] h-[900px] bg-gradient-to-tr from-indigo-600/20 via-blue-600/25 to-purple-600/20 rounded-full blur-[200px] animate-blob" 
           style={{ 
             animationName: prefersReducedMotion ? 'none' : 'blob', 
             animationDuration: '18s', 
             animationTimingFunction: 'ease-in-out', 
             animationIterationCount: 'infinite', 
             animationDelay: '2s',
             willChange: prefersReducedMotion ? 'auto' : 'transform',
             transform: 'translateZ(0)'
           }}
         ></div>
         <div 
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 rounded-full blur-[250px] animate-blob" 
           style={{ 
             animationName: prefersReducedMotion ? 'none' : 'blob', 
             animationDuration: '20s', 
             animationTimingFunction: 'ease-in-out', 
             animationIterationCount: 'infinite', 
             animationDelay: '4s',
             willChange: prefersReducedMotion ? 'auto' : 'transform',
             transform: 'translateZ(0)'
           }}
         ></div>
         
         {[...Array(particleCount)].map((_, i) => (
           <div
             key={i}
             className="absolute w-32 h-32 bg-gradient-to-br from-pink-400/10 via-purple-400/10 to-cyan-400/10 rounded-full blur-2xl animate-particle-float"
             style={{
               left: `${10 + i * 15}%`,
               top: `${20 + (i % 3) * 30}%`,
               animationDelay: prefersReducedMotion ? '0s' : `${i * 2}s`,
               animationDuration: prefersReducedMotion ? '0s' : `${12 + i * 2}s`,
               willChange: prefersReducedMotion ? 'auto' : 'transform',
               transform: 'translateZ(0)'
             }}
           />
         ))}
       </div>

      {/* Grain Texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"
        style={{ willChange: 'auto' }}
      ></div>
      
       {/* Effets de lumière */}
       <div className="fixed inset-0 pointer-events-none opacity-20">
         <div 
           className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-scale-breathe" 
           style={{ 
             animationName: prefersReducedMotion ? 'none' : 'scaleBreathe', 
             animationDuration: '6s', 
             animationTimingFunction: 'ease-in-out', 
             animationIterationCount: 'infinite',
             willChange: prefersReducedMotion ? 'auto' : 'transform',
             transform: 'translateZ(0)'
           }}
         ></div>
         <div 
           className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-scale-breathe" 
           style={{ 
             animationName: prefersReducedMotion ? 'none' : 'scaleBreathe', 
             animationDuration: '8s', 
             animationTimingFunction: 'ease-in-out', 
             animationIterationCount: 'infinite', 
             animationDelay: '1s',
             willChange: prefersReducedMotion ? 'auto' : 'transform',
             transform: 'translateZ(0)'
           }}
         ></div>
         <div 
           className="absolute top-1/2 right-1/3 w-80 h-80 bg-purple-500/25 rounded-full blur-3xl animate-scale-breathe" 
           style={{ 
             animationName: prefersReducedMotion ? 'none' : 'scaleBreathe', 
             animationDuration: '7s', 
             animationTimingFunction: 'ease-in-out', 
             animationIterationCount: 'infinite', 
             animationDelay: '2s',
             willChange: prefersReducedMotion ? 'auto' : 'transform',
             transform: 'translateZ(0)'
           }}
         ></div>
       </div>
       
       {/* Rayons de lumière */}
       <div className="fixed inset-0 pointer-events-none opacity-10">
         <div 
           className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-pink-500/30 to-transparent animate-light-ray" 
           style={{ 
             animationDuration: prefersReducedMotion ? '0s' : '8s', 
             animationDelay: '0s',
             willChange: prefersReducedMotion ? 'auto' : 'opacity',
             transform: 'translateZ(0)'
           }}
         ></div>
         <div 
           className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-purple-500/30 to-transparent animate-light-ray" 
           style={{ 
             animationDuration: prefersReducedMotion ? '0s' : '10s', 
             animationDelay: '2s',
             willChange: prefersReducedMotion ? 'auto' : 'opacity',
             transform: 'translateZ(0)'
           }}
         ></div>
         <div 
           className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent animate-light-ray" 
           style={{ 
             animationDuration: prefersReducedMotion ? '0s' : '9s', 
             animationDelay: '4s',
             willChange: prefersReducedMotion ? 'auto' : 'opacity',
             transform: 'translateZ(0)'
           }}
         ></div>
       </div>
    </>
  );
});

