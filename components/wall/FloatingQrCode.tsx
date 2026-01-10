import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface FloatingQrCodeProps {
  show: boolean;
  uploadUrl: string;
  isKiosqueMode: boolean;
}

export const FloatingQrCode = React.memo(({ show, uploadUrl, isKiosqueMode }: FloatingQrCodeProps) => {
  return (
    <div className={`fixed z-[40] transition-all duration-500 ${
      show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20 pointer-events-none'
    } ${
      isKiosqueMode 
        ? 'bottom-8 md:bottom-12 lg:bottom-16 right-8 md:right-12 lg:right-16 scale-75 md:scale-90 lg:scale-100 origin-bottom-right' 
        : 'bottom-6 md:bottom-8 lg:bottom-12 right-4 md:right-6 lg:right-8'
    }`}>
      <div className={`relative bg-gradient-to-br from-white/95 via-white/90 to-gray-50/95 backdrop-blur-xl p-3 md:p-4 lg:p-5 rounded-2xl md:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 group border-2 md:border-[3px] border-white/60 ${
        !isKiosqueMode ? 'transform rotate-[-2deg] hover:rotate-0 hover:scale-110 hover:shadow-[0_20px_60px_rgba(236,72,153,0.5)] hover:bg-white' : ''
      }`}>
          {/* Glow effect */}
          <div className="absolute -inset-2 md:-inset-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500"></div>
          {/* Backdrop */}
          <div className="absolute -inset-1 md:-inset-2 bg-black/5 rounded-2xl md:rounded-3xl backdrop-blur-sm"></div>
          
          {/* QR Code Container */}
          <div className="relative bg-white p-2 md:p-3 lg:p-4 rounded-xl md:rounded-2xl shadow-inner border-2 border-gray-200/50">
             <QRCodeCanvas 
                value={uploadUrl} 
                size={isKiosqueMode ? 120 : 140}
                level={"H"}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                marginSize={0}
             />
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="bg-white/95 backdrop-blur-sm rounded-full p-2 md:p-3 lg:p-4 shadow-lg border-2 border-gray-200/30">
                 <span className="text-2xl md:text-3xl lg:text-4xl drop-shadow-md">📸</span>
               </div>
             </div>
          </div>
          
          {/* Text */}
          <div className="text-center mt-3 md:mt-4 relative z-10">
            <p className="text-slate-800 font-extrabold text-xs md:text-sm lg:text-base uppercase tracking-[0.2em] mb-1 group-hover:text-pink-600 transition-colors drop-shadow-sm">Envoyer</p>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 font-extrabold text-[10px] md:text-xs lg:text-sm animate-gradient">une photo !</p>
          </div>
          
          {/* Decorative corner marks */}
          <div className="absolute top-2 md:top-3 left-2 md:left-3 w-3 h-3 md:w-4 md:h-4 border-t-2 md:border-t-[3px] border-l-2 md:border-l-[3px] border-pink-400/50 rounded-tl-lg group-hover:border-pink-500 transition-colors"></div>
          <div className="absolute top-2 md:top-3 right-2 md:right-3 w-3 h-3 md:w-4 md:h-4 border-t-2 md:border-t-[3px] border-r-2 md:border-r-[3px] border-pink-400/50 rounded-tr-lg group-hover:border-pink-500 transition-colors"></div>
          <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 w-3 h-3 md:w-4 md:h-4 border-b-2 md:border-b-[3px] border-l-2 md:border-l-[3px] border-pink-400/50 rounded-bl-lg group-hover:border-pink-500 transition-colors"></div>
          <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 w-3 h-3 md:w-4 md:h-4 border-b-2 md:border-b-[3px] border-r-2 md:border-r-[3px] border-pink-400/50 rounded-br-lg group-hover:border-pink-500 transition-colors"></div>
          
          {/* Effet de scotch (tape) */}
          <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 w-16 md:w-20 lg:w-24 h-4 md:h-5 lg:h-6 bg-gradient-to-br from-white/80 via-white/70 to-white/60 backdrop-blur-sm border-2 border-white/90 shadow-md opacity-70 group-hover:opacity-100 group-hover:shadow-lg transition-all" style={{ transform: 'translateX(-50%) rotate(-2deg)' }}></div>
        </div>
    </div>
  );
});

