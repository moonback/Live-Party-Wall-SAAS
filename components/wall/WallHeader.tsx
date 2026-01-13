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
      className={`z-50 absolute top-4 left-0 w-full px-4 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center pointer-events-none gap-4`}
      onMouseEnter={() => isHoveringControls(true)}
      onMouseLeave={() => isHoveringControls(false)}
    >
      {/* Titre & Branding */}
      <div className="pointer-events-auto flex flex-row items-center gap-6">
        {/* Logo à gauche */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-8 md:h-12 w-auto max-w-[80px] md:max-w-[120px] object-contain drop-shadow-lg rounded-xl bg-white/10 border border-white/20"
            loading="lazy"
          />
        </div>
        {/* Titre et sous-titre à droite du logo */}
        <div className="flex flex-col justify-center">
          {/* Titre amélioré */}
          <h1 className="font-sans font-extrabold tracking-tight text-[1.6rem] md:text-[2.2rem] lg:text-4xl text-white leading-tight bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent drop-shadow-[0_3px_28px_rgba(236,72,153,0.17)]">
            <span className="">
              {title}
            </span>
            <span className="text-pink-400 ml-0.5 animate-pulse font-black text-3xl md:text-4xl align-baseline">.</span>
          </h1>
          {/* Sous-titre design pro */}
          <span className="mt-1 text-sm md:text-base lg:text-lg font-medium tracking-wide text-white/60 uppercase bg-clip-text text-transparent bg-gradient-to-r from-pink-200 via-purple-200 to-cyan-200 drop-shadow-sm">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Stats - Hidden on mobile */}
      <div className="pointer-events-auto hidden md:flex items-center gap-2 lg:gap-3 bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl transition-all hover:bg-black/50 hover:border-white/20">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/10 hover:from-pink-500/30 hover:to-pink-600/20 transition-all border border-pink-500/20 group/stat">
            <Camera className="w-3.5 h-3.5 text-pink-400 group-hover/stat:scale-110 transition-transform" />
            <span className="text-xs font-extrabold text-white/95">{stats.totalPhotos}</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 hover:from-cyan-500/30 hover:to-cyan-600/20 transition-all border-l border-white/10 border-t border-cyan-500/20 border-r border-cyan-500/20 border-b border-cyan-500/20 group/stat">
            <Users className="w-3.5 h-3.5 text-cyan-400 group-hover/stat:scale-110 transition-transform" />
            <span className="text-xs font-extrabold text-white/95">{stats.uniqueAuthors}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:from-purple-500/30 hover:to-purple-600/20 transition-all border-l border-white/10 border-t border-purple-500/20 border-r border-purple-500/20 border-b border-purple-500/20 group/stat">
            <Clock className="w-3.5 h-3.5 text-purple-400 group-hover/stat:scale-110 transition-transform" />
            <span className="text-xs font-extrabold text-white/95">{stats.timeSinceLast}</span>
          </div>
      </div>
    </motion.div>
  );
});

