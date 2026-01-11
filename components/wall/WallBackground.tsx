import React from 'react';

export const WallBackground = React.memo(() => {
  return (
    <>
       {/* ⚡ OPTIMISATION : Background Decor - Réduire le nombre d'éléments animés */}
       <div className="fixed inset-0 pointer-events-none opacity-40 will-change-transform">
         {/* ⚡ OPTIMISATION : Réduire de 3 à 2 blobs principaux */}
         <div className="absolute top-[-10%] right-[-10%] w-[900px] h-[900px] bg-gradient-to-br from-pink-600/20 via-purple-600/25 to-cyan-600/20 rounded-full blur-[200px] animate-blob will-change-transform" style={{ animation: 'blob 15s ease-in-out infinite' }}></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[900px] h-[900px] bg-gradient-to-tr from-indigo-600/20 via-blue-600/25 to-purple-600/20 rounded-full blur-[200px] animate-blob will-change-transform" style={{ animationName: 'blob', animationDuration: '18s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '2s' }}></div>
         
         {/* ⚡ OPTIMISATION : Réduire de 6 à 3 particules */}
         {[...Array(3)].map((_, i) => (
           <div
             key={i}
             className="absolute w-32 h-32 bg-gradient-to-br from-pink-400/10 via-purple-400/10 to-cyan-400/10 rounded-full blur-2xl animate-particle-float will-change-transform"
             style={{
               left: `${15 + i * 30}%`,
               top: `${25 + (i % 2) * 40}%`,
               animationDelay: `${i * 3}s`,
               animationDuration: `${15 + i * 2}s`
             }}
           />
         ))}
       </div>

      {/* Grain Texture - ⚡ OPTIMISATION : Utiliser will-change pour le compositing */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] will-change-auto"></div>
      
       {/* ⚡ OPTIMISATION : Effets de lumière - Réduire de 3 à 2 */}
       <div className="fixed inset-0 pointer-events-none opacity-20 will-change-transform">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-scale-breathe will-change-transform" style={{ animationName: 'scaleBreathe', animationDuration: '6s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite' }}></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-scale-breathe will-change-transform" style={{ animationName: 'scaleBreathe', animationDuration: '8s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '1s' }}></div>
       </div>
       
       {/* ⚡ OPTIMISATION : Rayons de lumière - Réduire de 3 à 2 */}
       <div className="fixed inset-0 pointer-events-none opacity-10 will-change-transform">
         <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-pink-500/30 to-transparent animate-light-ray will-change-transform" style={{ animationDuration: '8s', animationDelay: '0s' }}></div>
         <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent animate-light-ray will-change-transform" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
       </div>
    </>
  );
});

