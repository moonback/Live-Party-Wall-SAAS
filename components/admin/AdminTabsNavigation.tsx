import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Image as ImageIcon, BarChart2, Settings, Video, 
  Zap, Users, Menu, Key, X
} from 'lucide-react';
import { AdminTab } from './types';

interface AdminTabsNavigationProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  currentEvent: boolean;
  photosCount: number;
  battlesCount: number;
  guestsCount: number;
  eventsCount: number;
  battleModeEnabled: boolean;
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
  onLoadGuests?: () => void;
  onLoadEvents?: () => void;
}

export const AdminTabsNavigation: React.FC<AdminTabsNavigationProps> = ({
  activeTab,
  onTabChange,
  currentEvent,
  photosCount,
  battlesCount,
  guestsCount,
  eventsCount,
  battleModeEnabled,
  isMobileMenuOpen,
  onMobileMenuToggle,
  onLoadGuests,
  onLoadEvents
}) => {
  const tabs = [
    { id: 'events' as AdminTab, label: 'Événements', icon: Calendar, count: eventsCount, alwaysVisible: true },
    { id: 'license' as AdminTab, label: 'Licence', icon: Key, alwaysVisible: true },
    { id: 'moderation' as AdminTab, label: 'Modération', icon: ImageIcon, count: photosCount, requiresEvent: true },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart2, requiresEvent: true },
    { id: 'configuration' as AdminTab, label: 'Configuration', icon: Settings, requiresEvent: true },
    { id: 'aftermovie' as AdminTab, label: 'Aftermovie', icon: Video, requiresEvent: true },
    { id: 'battles' as AdminTab, label: 'Battles', icon: Zap, count: battlesCount, requiresEvent: true, requiresBattleMode: true },
    { id: 'guests' as AdminTab, label: 'Inviter', icon: Users, count: guestsCount, requiresEvent: true },
  ];

  const visibleTabs = tabs.filter(tab => {
    if (tab.alwaysVisible) return true;
    if (!currentEvent && tab.requiresEvent) return false;
    if (tab.requiresBattleMode && !battleModeEnabled) return false;
    return true;
  });

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Header Sidebar */}
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Navigation</h2>
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
            aria-label="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                if (tab.id === 'guests' && onLoadGuests) onLoadGuests();
                if (tab.id === 'events' && onLoadEvents) onLoadEvents();
                // Fermer le menu mobile après sélection
                if (isMobileMenuOpen) onMobileMenuToggle();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px] group ${
                isActive
                  ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="text-sm font-medium flex-1 text-left">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold min-w-[24px] text-center ${
                  isActive
                    ? 'bg-indigo-500/30 text-indigo-200'
                    : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Bouton menu hamburger pour mobile */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden fixed top-24 left-4 z-40 flex items-center gap-2 px-3 py-2 bg-slate-900/95 backdrop-blur-sm hover:bg-slate-800/95 rounded-lg transition-colors border border-slate-800 shadow-xl"
        aria-label="Ouvrir le menu"
        aria-expanded={isMobileMenuOpen}
      >
        <Menu className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`} />
        <span className="text-sm font-medium text-slate-200">
          {tabs.find(t => t.id === activeTab)?.label || 'Menu'}
        </span>
      </button>

      {/* Overlay mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onMobileMenuToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Desktop (toujours visible) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 z-30">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile (drawer) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeInOut' }}
            className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 z-50 shadow-2xl"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
