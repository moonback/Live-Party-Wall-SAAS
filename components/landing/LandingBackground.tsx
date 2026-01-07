import React from 'react';

/**
 * Composant pour les effets de fond de la landing page - Design Grid
 */
export const LandingBackground: React.FC = () => {
  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#050505]">
        {/* Modern Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Radical Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none"></div>
        
        {/* Animated ambient blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse pointer-events-none mix-blend-screen opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-900/20 rounded-full blur-[120px] animate-pulse pointer-events-none mix-blend-screen opacity-30"></div>
      </div>
    </>
  );
};
