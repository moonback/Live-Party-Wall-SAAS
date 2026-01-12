import React, { useEffect, useState } from 'react';

export const WallBackground = React.memo(() => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (prefersReducedMotion) {
    return (
      <>
        {/* Background minimal pour prefers-reduced-motion */}
        <div className="fixed inset-0 pointer-events-none opacity-30">
          <div className="absolute top-[-10%] right-[-10%] w-[900px] h-[900px] bg-gradient-to-br from-pink-600/15 via-purple-600/15 to-cyan-600/15 rounded-full blur-[200px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[900px] h-[900px] bg-gradient-to-tr from-indigo-600/15 via-blue-600/15 to-purple-600/15 rounded-full blur-[200px]"></div>
        </div>
      </>
    );
  }

  return (
    <>
       {/* Background Decor - Optimisé */}
       <div className="fixed inset-0 pointer-events-none opacity-40" style={{ willChange: 'auto', transform: 'translateZ(0)' }}>
         {/* Blobs réduits de 3 à 2 */}
         <div className="absolute top-[-10%] right-[-10%] w-[900px] h-[900px] bg-gradient-to-br from-pink-600/20 via-purple-600/25 to-cyan-600/20 rounded-full blur-[200px] animate-blob" style={{ animation: 'blob 15s ease-in-out infinite', willChange: 'transform' }}></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[900px] h-[900px] bg-gradient-to-tr from-indigo-600/20 via-blue-600/25 to-purple-600/20 rounded-full blur-[200px] animate-blob" style={{ animationName: 'blob', animationDuration: '18s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '2s', willChange: 'transform' }}></div>
         
         {/* Particules réduites de 6 à 3 */}
         {[...Array(3)].map((_, i) => (
           <div
             key={i}
             className="absolute w-32 h-32 bg-gradient-to-br from-pink-400/10 via-purple-400/10 to-cyan-400/10 rounded-full blur-2xl animate-particle-float"
             style={{
               left: `${15 + i * 30}%`,
               top: `${25 + (i % 2) * 40}%`,
               animationDelay: `${i * 3}s`,
               animationDuration: `${15 + i * 2}s`,
               willChange: 'transform'
             }}
           />
         ))}
       </div>

      {/* Grain Texture - Désactivé pour performance */}
      
       {/* Effets de lumière - Simplifiés */}
       <div className="fixed inset-0 pointer-events-none opacity-15" style={{ willChange: 'auto' }}>
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/25 rounded-full blur-3xl" style={{ transform: 'translateZ(0)' }}></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/25 rounded-full blur-3xl" style={{ transform: 'translateZ(0)' }}></div>
       </div>
    </>
  );
});

