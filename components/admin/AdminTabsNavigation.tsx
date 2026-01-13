import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Image as ImageIcon, BarChart2, Settings, Video, 
  Zap, Users, Menu, Key, X, LayoutDashboard
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
  const generalTabs = [
    { id: 'events' as AdminTab, label: 'Événements', icon: Calendar, count: eventsCount, alwaysVisible: true },
    { id: 'license' as AdminTab, label: 'Licence', icon: Key, alwaysVisible: true },
  ];

  const eventTabs = [
    { id: 'moderation' as AdminTab, label: 'Modération', icon: ImageIcon, count: photosCount, requiresEvent: true },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart2, requiresEvent: true },
    { id: 'configuration' as AdminTab, label: 'Configuration', icon: Settings, requiresEvent: true },
    { id: 'aftermovie' as AdminTab, label: 'Aftermovie', icon: Video, requiresEvent: true },
    { id: 'battles' as AdminTab, label: 'Battles', icon: Zap, count: battlesCount, requiresEvent: true, requiresBattleMode: true },
    { id: 'guests' as AdminTab, label: 'Inviter', icon: Users, count: guestsCount, requiresEvent: true },
  ];

  const getVisibleTabs = (tabs: typeof generalTabs) => {
    return tabs.filter(tab => {
      if (tab.alwaysVisible) return true;
      if (!currentEvent && tab.requiresEvent) return false;
      if (tab.requiresBattleMode && !battleModeEnabled) return false;
      return true;
    });
  };

  const visibleGeneralTabs = getVisibleTabs(generalTabs);
  const visibleEventTabs = getVisibleTabs(eventTabs);

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const NavItem: React.FC<{
    tab: typeof generalTabs[0];
    isActive: boolean;
    onClick: () => void;
  }> = ({ tab, isActive, onClick }) => {
    const Icon = tab.icon;
    return (
      <motion.button
        whileHover={!prefersReducedMotion ? { x: 4 } : {}}
        whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
        onClick={onClick}
        className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px] group ${
          isActive
            ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 border border-indigo-500/40 text-indigo-200 shadow-lg shadow-indigo-500/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <div className={`relative flex items-center justify-center w-5 h-5 flex-shrink-0 ${
          isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
        }`}>
          <Icon className="w-5 h-5 transition-all duration-200" />
          {isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-indigo-400/20 rounded-full blur-md"
            />
          )}
        </div>
        <span className="text-sm font-medium flex-1 text-left">{tab.label}</span>
        {tab.count !== undefined && (
          <motion.span
            initial={false}
            animate={{ scale: isActive ? 1.1 : 1 }}
            className={`text-xs px-2 py-0.5 rounded-full font-semibold min-w-[24px] text-center transition-colors ${
              isActive
                ? 'bg-indigo-500/40 text-indigo-100 border border-indigo-400/30'
                : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300 border border-transparent'
            }`}
          >
            {tab.count}
          </motion.span>
        )}
      </motion.button>
    );
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900/98 via-slate-900/95 to-slate-900/98">
      {/* Header Sidebar Amélioré */}
      <div className="relative p-4 border-b border-slate-800/50 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-lg"></div>
              <div className="relative p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                <LayoutDashboard className="w-4 h-4 text-indigo-300" />
              </div>
            </div>
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Navigation</h2>
          </div>
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-1.5 hover:bg-slate-800/80 rounded-lg transition-colors text-slate-400 hover:text-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 ml-12">Gérez votre événement</p>
      </div>

      {/* Navigation Items avec Groupes */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {/* Section Général */}
        {visibleGeneralTabs.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 mb-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Général</span>
            </div>
            {visibleGeneralTabs.map(tab => (
              <NavItem
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  if (tab.id === 'events' && onLoadEvents) onLoadEvents();
                  if (isMobileMenuOpen) onMobileMenuToggle();
                }}
              />
            ))}
          </div>
        )}

        {/* Séparateur */}
        {visibleGeneralTabs.length > 0 && visibleEventTabs.length > 0 && (
          <div className="px-3 py-2">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
          </div>
        )}

        {/* Section Événement */}
        {visibleEventTabs.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 mb-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Événement</span>
            </div>
            {visibleEventTabs.map(tab => (
              <NavItem
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  if (tab.id === 'guests' && onLoadGuests) onLoadGuests();
                  if (isMobileMenuOpen) onMobileMenuToggle();
                }}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Footer Sidebar */}
      <div className="p-3 border-t border-slate-800/50">
        <div className="px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <p className="text-[10px] text-slate-500 text-center">
            Live Party Wall
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Bouton menu hamburger amélioré pour mobile */}
      <motion.button
        whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
        whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
        onClick={onMobileMenuToggle}
        className="lg:hidden fixed top-24 left-4 z-40 flex items-center gap-2 px-3 py-2.5 bg-slate-900/95 backdrop-blur-md hover:bg-slate-800/95 rounded-lg transition-all border border-slate-800/50 shadow-2xl"
        aria-label="Ouvrir le menu"
        aria-expanded={isMobileMenuOpen}
      >
        <motion.div
          animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Menu className="w-5 h-5 text-indigo-300" />
        </motion.div>
        <span className="text-sm font-semibold text-slate-200">
          {generalTabs.concat(eventTabs).find(t => t.id === activeTab)?.label || 'Menu'}
        </span>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-slate-900"
          />
        )}
      </motion.button>

      {/* Overlay mobile amélioré */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onMobileMenuToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Desktop améliorée */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-slate-900/98 backdrop-blur-xl border-r border-slate-800/50 z-30 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile améliorée (drawer) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200,
              duration: prefersReducedMotion ? 0 : 0.4 
            }}
            className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-slate-900/98 backdrop-blur-xl border-r border-slate-800/50 z-50 shadow-2xl"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Styles pour scrollbar personnalisée */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      `}</style>
    </>
  );
};
