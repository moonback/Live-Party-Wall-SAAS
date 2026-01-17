import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useSettings } from '../../context/SettingsContext';
import { getStaticAssetPath } from '../../utils/electronPaths';

interface FloatingQrCodeProps {
  show: boolean;
  uploadUrl: string;
  isKiosqueMode: boolean;
}

const getPositioningClasses = (isKiosqueMode: boolean, show: boolean) => [
  'fixed',
  'z-[40]',
  'transition-all',
  'duration-500',
  show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20 pointer-events-none',
  isKiosqueMode
    ? 'bottom-8 md:bottom-12 lg:bottom-16 xl:bottom-20 2xl:bottom-24 right-8 md:right-12 lg:right-16 xl:right-20 2xl:right-24 scale-75 md:scale-90 lg:scale-100 origin-bottom-right'
    : 'bottom-6 md:bottom-8 lg:bottom-12 xl:bottom-16 2xl:bottom-20 right-4 md:right-6 lg:right-8 xl:right-10 2xl:right-12',
].join(' ');

const getCardClasses = (isKiosqueMode: boolean) => [
  'relative',
  'bg-gradient-to-br',
  'from-white/95',
  'via-white/90',
  'to-gray-50/95',
  'backdrop-blur-xl',
  'p-3 md:p-4 lg:p-5 xl:p-6 2xl:p-8',
  'rounded-2xl md:rounded-3xl',
  'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
  'transition-all',
  'duration-500',
  'group',
  'border-2 md:border-[3px] lg:border-4',
  'border-white/60',
  !isKiosqueMode
    ? 'transform rotate-[-2deg] hover:rotate-0 hover:scale-110 hover:shadow-[0_20px_60px_rgba(236,72,153,0.5)] hover:bg-white'
    : '',
].join(' ');

const QrCodeContainer: React.FC<{uploadUrl: string; isKiosqueMode: boolean; logoUrl: string}> = ({
  uploadUrl,
  isKiosqueMode,
  logoUrl,
}) => {
  // Taille adaptative selon la largeur de l'écran
  const getQrSize = () => {
    if (typeof window === 'undefined') return isKiosqueMode ? 120 : 140;
    const width = window.innerWidth;
    if (isKiosqueMode) {
      if (width >= 3840) return 200; // 4K
      if (width >= 2560) return 180; // 2K
      if (width >= 1920) return 160; // Full HD
      return 120;
    } else {
      if (width >= 3840) return 220; // 4K
      if (width >= 2560) return 200; // 2K
      if (width >= 1920) return 180; // Full HD
      return 140;
    }
  };

  return (
    <div className="relative bg-white p-2 md:p-3 lg:p-4 xl:p-5 2xl:p-6 rounded-xl md:rounded-2xl lg:rounded-3xl shadow-inner border-2 border-gray-200/50">
      <QRCodeCanvas
        value={uploadUrl}
        size={getQrSize()}
        level="H"
        bgColor="#ffffff"
        fgColor="#000000"
        marginSize={0}
      />
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="bg-white/95 backdrop-blur-sm rounded-full p-1.5 md:p-2 lg:p-2.5 xl:p-3 2xl:p-4 shadow-lg border-2 border-gray-200/30 flex items-center justify-center">
        {/* <img
          src={logoUrl}
          alt="Logo"
          className={
            (isKiosqueMode
              ? 'w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16'
              : 'w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 2xl:w-18 2xl:h-18'
            ) +
            ' object-contain drop-shadow-md'
          }
        /> */}
      </div>
    </div>
  </div>
  );
};

const FloatingQrText: React.FC = () => (
  <div className="text-center mt-3 md:mt-4 lg:mt-5 xl:mt-6 2xl:mt-8 relative z-10">
    <p className="text-slate-800 font-extrabold text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl uppercase tracking-[0.2em] mb-1 md:mb-1.5 lg:mb-2 group-hover:text-pink-600 transition-colors drop-shadow-sm">
      Envoyer
    </p>
    <p className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 font-extrabold text-[10px] md:text-xs lg:text-sm xl:text-base 2xl:text-lg animate-gradient">
      une photo !
    </p>
  </div>
);

const DecorativeCorners: React.FC = () => (
  <>
    {/* Decorative corner marks */}
    <div className="absolute top-2 md:top-3 left-2 md:left-3 w-3 h-3 md:w-4 md:h-4 border-t-2 md:border-t-[3px] border-l-2 md:border-l-[3px] border-pink-400/50 rounded-tl-lg group-hover:border-pink-500 transition-colors" />
    <div className="absolute top-2 md:top-3 right-2 md:right-3 w-3 h-3 md:w-4 md:h-4 border-t-2 md:border-t-[3px] border-r-2 md:border-r-[3px] border-pink-400/50 rounded-tr-lg group-hover:border-pink-500 transition-colors" />
    <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 w-3 h-3 md:w-4 md:h-4 border-b-2 md:border-b-[3px] border-l-2 md:border-l-[3px] border-pink-400/50 rounded-bl-lg group-hover:border-pink-500 transition-colors" />
    <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 w-3 h-3 md:w-4 md:h-4 border-b-2 md:border-b-[3px] border-r-2 md:border-r-[3px] border-pink-400/50 rounded-br-lg group-hover:border-pink-500 transition-colors" />
  </>
);

const ScotchTape: React.FC = () => (
  <div
    className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 w-16 md:w-20 lg:w-24 h-4 md:h-5 lg:h-6 bg-gradient-to-br from-white/80 via-white/70 to-white/60 backdrop-blur-sm border-2 border-white/90 shadow-md opacity-70 group-hover:opacity-100 group-hover:shadow-lg transition-all"
    style={{ transform: 'translateX(-50%) rotate(-2deg)' }}
  />
);

export const FloatingQrCode: React.FC<FloatingQrCodeProps> = React.memo(
  ({ show, uploadUrl, isKiosqueMode }) => {
    const { settings } = useSettings();
    const logoUrl = settings.logo_url || getStaticAssetPath('logo-accueil.png');

    return (
      <div className={getPositioningClasses(isKiosqueMode, show)}>
        <div className={getCardClasses(isKiosqueMode)}>
          {/* Glow effect */}
          <div className="absolute -inset-2 md:-inset-3 lg:-inset-4 xl:-inset-5 2xl:-inset-6 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500" />
          {/* Backdrop */}
          <div className="absolute -inset-1 md:-inset-2 lg:-inset-3 xl:-inset-4 2xl:-inset-5 bg-black/5 rounded-2xl md:rounded-3xl backdrop-blur-sm" />

          {/* QR Code */}
          <QrCodeContainer uploadUrl={uploadUrl} isKiosqueMode={isKiosqueMode} logoUrl={logoUrl} />
          <FloatingQrText />
          <DecorativeCorners />
          <ScotchTape />
        </div>
      </div>
    );
  }
);
