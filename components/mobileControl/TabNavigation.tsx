import React from 'react';
import { BarChart2, Shield, Settings, Sword, Users, LayoutDashboard, Video, Key } from 'lucide-react';

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
  { id: 'license', label: 'Licence', icon: Key },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, battleModeEnabled = true, aftermoviesEnabled = true }) => {
  // Filtrer les onglets selon les fonctionnalités activées
  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === 'battles' && !battleModeEnabled) {
      return false;
    }
    if (tab.id === 'aftermovies' && aftermoviesEnabled === false) {
      return false;
    }
    return true;
  });

  return (
    <nav
      className="sticky top-[73px] z-40 bg-black/60 backdrop-blur-xl border-b border-white/20 shadow-lg md:static md:z-40 md:bg-black/50 md:backdrop-blur-lg md:border-white/10"
      aria-label="Navigation principale"
    >
      <div className="flex justify-between md:justify-start md:gap-1 md:overflow-x-auto md:scrollbar-hide snap-x snap-mandatory select-none">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={selected ? 'page' : undefined}
              className={`flex-1 md:flex-none md:min-w-[120px] flex flex-col items-center justify-center py-3.5 px-2 md:py-3 md:px-4 relative font-medium transition-all duration-300 active:scale-[0.96] group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 md:hover:bg-white/5 ${
                selected
                  ? 'text-pink-400 bg-gradient-to-b from-pink-500/20 via-pink-500/15 to-transparent md:bg-gradient-to-b md:from-pink-500/20 md:to-transparent shadow-inner'
                  : 'text-white/70 hover:text-white/90 active:bg-white/5'
              }`}
              tabIndex={0}
              type="button"
            >
              <span
                className={`relative flex items-center justify-center rounded-full transition-all duration-300 p-2 md:mb-1 md:p-2 ${
                  selected 
                    ? 'scale-110 md:scale-125 bg-gradient-to-br from-pink-500/30 via-pink-500/20 to-purple-500/15 md:bg-gradient-to-br md:from-pink-500/30 md:via-pink-500/20 md:to-purple-500/15 shadow-lg shadow-pink-500/30 ring-2 ring-pink-500/30' 
                    : 'group-hover:bg-white/10 group-hover:scale-105 group-active:scale-95'
                }`}
              >
                <Icon 
                  className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${
                    selected 
                      ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]' 
                      : 'text-white/80 group-hover:text-white group-hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]'
                  }`} 
                />
                {selected && (
                  <span className="absolute inset-0 rounded-full bg-pink-500/30 animate-pulse blur-md"></span>
                )}
              </span>
              <span
                className={`text-[10px] md:text-sm leading-tight mt-1 md:mt-[2px] font-medium transition-all duration-300 ${
                  selected
                    ? 'text-pink-400 drop-shadow-[0_0_4px_rgba(236,72,153,0.4)] font-semibold'
                    : 'text-white/70 group-hover:text-white/90'
                }`}
              >
                {tab.label}
              </span>
              {selected && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-10 md:w-12 rounded-t-md bg-gradient-to-r from-pink-400 via-pink-500 to-purple-500 shadow-[0_-1px_12px_0_rgba(236,72,153,0.5)] opacity-95"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabNavigation;

