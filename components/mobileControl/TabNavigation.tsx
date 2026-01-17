import React from 'react';
import { BarChart2, Shield, Settings, Sword, Users, LayoutDashboard, Video } from 'lucide-react';
import { useLicenseFeatures } from '../../hooks/useLicenseFeatures';

export type ControlTab = 'overview' | 'moderation' | 'analytics' | 'settings' | 'battles' | 'guests' | 'aftermovies' | 'license';

interface TabNavigationProps {
  activeTab: ControlTab;
  onTabChange: (tab: ControlTab) => void;
  battleModeEnabled?: boolean;
  aftermoviesEnabled?: boolean;
}

interface TabConfig {
  id: ControlTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'moderation', label: 'Modération', icon: Shield },
  { id: 'analytics', label: 'Stats', icon: BarChart2 },
  { id: 'battles', label: 'Battles', icon: Sword },
  { id: 'guests', label: 'Invités', icon: Users },
  { id: 'aftermovies', label: 'Aftermovies', icon: Video },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, battleModeEnabled = true, aftermoviesEnabled = true }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void aftermoviesEnabled; // Gardé pour compatibilité mais non utilisé
  const { isFeatureEnabled } = useLicenseFeatures();
  
  // Filtrer les onglets selon les fonctionnalités activées
  const visibleTabs = TABS.filter((tab) => {
    // Masquer battles si battleModeEnabled est explicitement false
    if (tab.id === 'battles' && battleModeEnabled === false) {
      return false;
    }
    // L'onglet aftermovies est toujours visible pour permettre de voir les aftermovies existants
    // même si la fonctionnalité est désactivée dans les paramètres
    return true;
  });

  return (
    <nav
      className="sticky top-[65px] md:top-[73px] z-40 bg-black/50 backdrop-blur-xl border-b border-white/10 shadow-lg md:static md:z-40"
      aria-label="Navigation principale"
    >
      <div className="flex justify-between md:justify-start md:gap-0.5 md:overflow-x-auto md:scrollbar-hide snap-x snap-mandatory select-none px-1">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={selected ? 'page' : undefined}
              className={`group relative flex-1 md:flex-none md:min-w-[70px] flex flex-col items-center justify-center py-2 px-1 md:py-2.5 md:px-2.5 font-medium transition-all duration-300 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg md:mx-0.5 ${
                selected
                  ? 'text-pink-400'
                  : 'text-white/60 hover:text-white/90'
              }`}
              tabIndex={0}
              type="button"
            >
              {/* Background pour l'état sélectionné */}
              {selected && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/15 via-rose-500/10 to-pink-500/15 rounded-lg border border-pink-500/20" />
                  <div className="absolute inset-0 bg-pink-500/5 rounded-lg animate-pulse" />
                </>
              )}
              
              {/* Icône avec animation */}
              <span
                className={`relative flex items-center justify-center rounded-xl transition-all duration-300 p-1.5 md:p-2 mb-1 ${
                  selected 
                    ? 'scale-110 bg-gradient-to-br from-pink-500/25 to-rose-500/25 shadow-lg shadow-pink-500/20 ring-1 ring-pink-500/30'
                    : 'group-hover:bg-pink-500/10 group-hover:scale-105 group-active:scale-95'
                }`}
              >
                <Icon 
                  className={`w-4 h-4 md:w-5 md:h-5 transition-all duration-300 relative z-10 ${
                    selected 
                      ? 'text-pink-400 drop-shadow-lg'
                      : 'text-white/70 group-hover:text-white'
                  }`} 
                />
                
                {/* Effet de brillance au hover */}
                {!selected && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-pink-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                )}
              </span>
              
              {/* Label */}
              <span
                className={`text-[10px] md:text-[11px] leading-tight font-medium transition-all duration-300 relative z-10 ${
                  selected
                    ? 'text-pink-400 font-semibold drop-shadow-sm'
                    : 'text-white/60 group-hover:text-white/90'
                }`}
              >
                {tab.label}
              </span>
              
              {/* Indicateur de sélection en bas */}
              {selected && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 md:w-10 rounded-full bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-lg shadow-pink-400/50" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabNavigation;

