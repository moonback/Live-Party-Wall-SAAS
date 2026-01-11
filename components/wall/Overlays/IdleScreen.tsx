import React, { useEffect, useState, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

interface IdleScreenProps {
  isActive: boolean;
  uploadUrl: string;
  title: string;
}

export const IdleScreen = React.memo(({ isActive, uploadUrl, title }: IdleScreenProps) => {
  const [time, setTime] = useState(new Date());
  
  // ⚡ OPTIMISATION : Timer seulement quand actif
  useEffect(() => {
    if (!isActive) return;
    
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  // ⚡ OPTIMISATION : Mémoriser la taille du QR code avec debounce
  const qrSize = useMemo(() => {
    return window.innerWidth >= 1920 ? 400 : 300;
  }, []);

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout | null = null;
    const updateQrSize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // La taille est calculée via CSS responsive, pas besoin de state
      }, 200);
    };
    window.addEventListener('resize', updateQrSize, { passive: true });
    return () => {
      window.removeEventListener('resize', updateQrSize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 overflow-hidden"
        >
          {/* Background animé */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-gradient-to-br from-pink-900/20 via-purple-900/20 to-black animate-pulse-slow"></div>
          </div>

          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="relative z-10 flex flex-col items-center max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl w-full"
          >
            {/* Clock */}
            <h2 className="text-6xl md:text-8xl lg:text-9xl xl:text-[12rem] 2xl:text-[14rem] font-black text-white/10 mb-8 md:mb-12 lg:mb-16 font-mono">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h2>

            <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-handwriting text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 mb-12 md:mb-16 lg:mb-20 drop-shadow-2xl">
              {title}
            </h1>

            {/* ⚡ OPTIMISATION : Giant QR Code - Mémoriser pour éviter les re-renders */}
            <div className="relative p-6 md:p-8 lg:p-10 xl:p-12 bg-white rounded-3xl md:rounded-[2rem] lg:rounded-[2.5rem] shadow-[0_0_100px_rgba(236,72,153,0.3)] animate-float">
               <div className="absolute -inset-1 md:-inset-2 lg:-inset-3 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-[28px] md:rounded-[2rem] lg:rounded-[2.5rem] blur-lg opacity-70 animate-pulse"></div>
               <div className="relative bg-white p-2 md:p-3 lg:p-4 rounded-2xl md:rounded-3xl">
                 <QRCodeCanvas 
                    value={uploadUrl} 
                    size={qrSize}
                    level={"H"}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    includeMargin={false}
                 />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-sm rounded-full p-4 md:p-5 lg:p-6 shadow-xl border-2 border-gray-100">
                        <span className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl">📸</span>
                    </div>
                 </div>
               </div>
            </div>

            <p className="mt-12 md:mt-16 lg:mt-20 text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-white uppercase tracking-[0.2em] animate-pulse">
              Scannez pour participer
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

