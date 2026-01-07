import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

interface IdleScreenProps {
  isActive: boolean;
  uploadUrl: string;
  title: string;
}

export const IdleScreen = React.memo(({ isActive, uploadUrl, title }: IdleScreenProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isActive]);

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
            className="relative z-10 flex flex-col items-center max-w-2xl w-full"
          >
            {/* Clock */}
            <h2 className="text-6xl md:text-8xl font-black text-white/10 mb-8 font-mono">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h2>

            <h1 className="text-4xl md:text-6xl font-handwriting text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 mb-12 drop-shadow-2xl">
              {title}
            </h1>

            {/* Giant QR Code */}
            <div className="relative p-6 bg-white rounded-3xl shadow-[0_0_100px_rgba(236,72,153,0.3)] animate-float">
               <div className="absolute -inset-1 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-[28px] blur-lg opacity-70 animate-pulse"></div>
               <div className="relative bg-white p-2 rounded-2xl">
                 <QRCodeCanvas 
                    value={uploadUrl} 
                    size={300}
                    level={"H"}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                 />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/95 backdrop-blur-sm rounded-full p-4 shadow-xl border border-gray-100">
                        <span className="text-5xl">📸</span>
                    </div>
                 </div>
               </div>
            </div>

            <p className="mt-12 text-2xl md:text-3xl font-bold text-white uppercase tracking-[0.2em] animate-pulse">
              Scannez pour participer
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

