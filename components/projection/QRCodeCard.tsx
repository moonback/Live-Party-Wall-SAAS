import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeCardProps {
  value: string;
  title: string;
  subtitle: string;
  emoji: string;
  position: 'left' | 'right';
  show: boolean;
  gradientColors: {
    hover: string;
    glow: string;
    text: string;
  };
  borderColor: string;
  qrKey?: string | number; // Pour forcer le re-render du QR code
}

/**
 * Composant réutilisable pour afficher un QR Code avec style élégant
 */
export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  value,
  title,
  subtitle,
  emoji,
  position,
  show,
  gradientColors,
  borderColor,
  qrKey,
}) => {
  const rotation = position === 'left' ? -2 : 2;
  const translateX = position === 'left' ? '-translate-x-20' : 'translate-x-20';

  return (
    <div
      className={`fixed z-40 transition-all duration-500 ${
        show ? 'opacity-100 translate-x-0' : `opacity-0 ${translateX} pointer-events-none`
      } top-1/2 -translate-y-1/2 ${position === 'left' ? 'left-8' : 'right-8'}`}
    >
      <div
        className={`relative bg-gradient-to-br from-white via-white to-gray-50 p-3 md:p-4 rounded-2xl shadow-2xl transition-all duration-500 group border-2 border-white/50 transform ${
          position === 'left' ? 'rotate-[-2deg]' : 'rotate-[2deg]'
        } hover:rotate-0 hover:scale-105`}
        style={{
          boxShadow: show
            ? '0 20px 60px rgba(0,0,0,0.3)'
            : undefined,
        }}
      >
        {/* Glow effect */}
        <div
          className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"
          style={{
            background: position === 'left' 
              ? 'linear-gradient(to right, rgb(236, 72, 153), rgb(168, 85, 247), rgb(6, 182, 212))'
              : 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246), rgb(168, 85, 247))',
          }}
        />

        {/* QR Code Container */}
        <div className="relative bg-white p-2.5 rounded-xl shadow-inner">
          <QRCodeCanvas
            value={value}
            size={100}
            level="H"
            bgColor="#ffffff"
            fgColor="#000000"
            includeMargin={false}
            key={qrKey}
          />
          {/* Logo overlay center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-full p-1 shadow-lg">
              <span className="text-xl md:text-2xl drop-shadow-md">{emoji}</span>
            </div>
          </div>
        </div>

        {/* Text avec animations */}
        <div className="text-center mt-2 relative z-10">
          <p
            className={`text-slate-900 font-extrabold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-0.5 transition-colors ${
              position === 'left' ? 'group-hover:text-pink-600' : 'group-hover:text-cyan-600'
            }`}
          >
            {title}
          </p>
          <p
            className={`text-transparent bg-clip-text ${gradientColors.text} font-extrabold text-[9px] md:text-[10px]`}
          >
            {subtitle}
          </p>
        </div>

        {/* Decorative corner marks */}
        <div className={`absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 ${borderColor} rounded-tl-lg`} />
        <div className={`absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 ${borderColor} rounded-tr-lg`} />
        <div className={`absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 ${borderColor} rounded-bl-lg`} />
        <div className={`absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 ${borderColor} rounded-br-lg`} />

        {/* Effet de scotch (tape) en haut */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/60 backdrop-blur-sm border border-white/80 shadow-md opacity-70 group-hover:opacity-90 transition-opacity"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
      </div>
    </div>
  );
};

