import React from 'react';
import { Camera, Users, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { getStaticAssetPath } from '../../utils/electronPaths';

interface WallHeaderProps {
  title: string;
  subtitle: string;
  stats: {
    totalPhotos: number;
    uniqueAuthors: number;
    timeSinceLast: string;
  };
  showControls: boolean;
  isHoveringControls: (hovering: boolean) => void;
}

export const WallHeader = React.memo(({ title, subtitle, stats, showControls, isHoveringControls }: WallHeaderProps) => {
  const { settings } = useSettings();
  const logoUrl = settings.logo_url || getStaticAssetPath('logo-accueil.png');
  
  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: showControls ? 0 : -20, opacity: showControls ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className={`z-50 absolute top-4 md:top-6 lg:top-8 xl:top-10 2xl:top-12 left-0 w-full px-4 md:px-8 lg:px-10 xl:px-12 2xl:px-16 flex flex-col md:flex-row justify-between items-start md:items-center pointer-events-none gap-4 md:gap-6 lg:gap-8`}
      onMouseEnter={() => isHoveringControls(true)}
      onMouseLeave={() => isHoveringControls(false)}
    >
      {/* Titre & Branding */}
      <div className="pointer-events-auto flex flex-row items-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 2xl:gap-12">
        {/* Logo à gauche */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-8 md:h-12 lg:h-14 xl:h-16 2xl:h-20 w-auto max-w-[80px] md:max-w-[120px] lg:max-w-[140px] xl:max-w-[180px] 2xl:max-w-[220px] object-contain drop-shadow-lg rounded-xl bg-white/10 border border-white/20"
            loading="lazy"
          />
        </div>
        {/* Titre et sous-titre à droite du logo */}
        <div className="flex flex-col justify-center">
          {/* Titre amélioré */}
          <h1 className="font-sans font-extrabold tracking-tight text-[1.6rem] md:text-[2.2rem] lg:text-4xl xl:text-5xl 2xl:text-6xl text-white leading-tight bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent drop-shadow-[0_3px_28px_rgba(236,72,153,0.17)]">
            <span className="">
              {title}
            </span>
            <span className="text-pink-400 ml-0.5 animate-pulse font-black text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl align-baseline">.</span>
          </h1>
          {/* Sous-titre design pro */}
          <span className="mt-1 text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-medium tracking-wide text-white/60 uppercase bg-clip-text text-transparent bg-gradient-to-r from-pink-200 via-purple-200 to-cyan-200 drop-shadow-sm">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Stats - Hidden on mobile */}
      <div className="pointer-events-auto hidden md:flex items-center gap-2 lg:gap-3 xl:gap-4 2xl:gap-6 bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-xl p-2 md:p-2.5 lg:p-3 xl:p-4 2xl:p-5 rounded-2xl border border-white/10 shadow-2xl transition-all hover:bg-black/50 hover:border-white/20">
          <div className="flex items-center gap-2 md:gap-2.5 lg:gap-3 px-3 md:px-3.5 lg:px-4 xl:px-5 2xl:px-6 py-1.5 md:py-2 lg:py-2.5 xl:py-3 2xl:py-4 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/10 hover:from-pink-500/30 hover:to-pink-600/20 transition-all border border-pink-500/20 group/stat">
            <Camera className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 text-pink-400 group-hover/stat:scale-110 transition-transform" />
            <span className="text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl font-extrabold text-white/95">{stats.totalPhotos}</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-2.5 lg:gap-3 px-3 md:px-3.5 lg:px-4 xl:px-5 2xl:px-6 py-1.5 md:py-2 lg:py-2.5 xl:py-3 2xl:py-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 hover:from-cyan-500/30 hover:to-cyan-600/20 transition-all border-l border-white/10 border-t border-cyan-500/20 border-r border-cyan-500/20 border-b border-cyan-500/20 group/stat">
            <Users className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 text-cyan-400 group-hover/stat:scale-110 transition-transform" />
            <span className="text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl font-extrabold text-white/95">{stats.uniqueAuthors}</span>
          </div>

          <div className="flex items-center gap-2 md:gap-2.5 lg:gap-3 px-3 md:px-3.5 lg:px-4 xl:px-5 2xl:px-6 py-1.5 md:py-2 lg:py-2.5 xl:py-3 2xl:py-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:from-purple-500/30 hover:to-purple-600/20 transition-all border-l border-white/10 border-t border-purple-500/20 border-r border-purple-500/20 border-b border-purple-500/20 group/stat">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-4.5 lg:h-4.5 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 text-purple-400 group-hover/stat:scale-110 transition-transform" />
            <span className="text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl font-extrabold text-white/95">{stats.timeSinceLast}</span>
          </div>
      </div>
    </motion.div>
  );
});

