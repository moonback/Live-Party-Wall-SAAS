import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Image as ImageIcon, BarChart2, Settings, Video, 
  Zap, Users, Menu, CreditCard 
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
  allowedFeatures?: Set<string>;
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
  onLoadEvents,
  allowedFeatures = new Set()
}) => {
  const tabs = [
    { id: 'events' as AdminTab, label: 'Événements', icon: Calendar, count: eventsCount, alwaysVisible: true },
    { id: 'moderation' as AdminTab, label: 'Modération', icon: ImageIcon, count: photosCount, requiresEvent: true },
    { id: 'analytics' as AdminTab, label: 'Analytics', icon: BarChart2, requiresEvent: true, feature: "Statistiques avancées" },
    { id: 'configuration' as AdminTab, label: 'Configuration', icon: Settings, requiresEvent: true },
    { id: 'aftermovie' as AdminTab, label: 'Aftermovie', icon: Video, requiresEvent: true, feature: "Aftermovie automatique" },
    { id: 'battles' as AdminTab, label: 'Battles', icon: Zap, count: battlesCount, requiresEvent: true, requiresBattleMode: true },
    { id: 'guests' as AdminTab, label: 'Inviter', icon: Users, count: guestsCount, requiresEvent: true },
    { id: 'billing' as AdminTab, label: 'Facturation', icon: CreditCard, alwaysVisible: true },
  ];

  const visibleTabs = tabs.filter(tab => {
    if (tab.alwaysVisible) return true;
    if (!currentEvent && tab.requiresEvent) return false;
    if (tab.requiresBattleMode && !battleModeEnabled) return false;
    if (tab.feature && !allowedFeatures.has(tab.feature)) return false;
    return true;
  });

  const getTabLabel = (tabId: AdminTab) => {
    return tabs.find(t => t.id === tabId)?.label || '';
  };

  return (
    <div className="mb-6">
      {/* Bouton menu hamburger pour mobile */}
      <button
        data-mobile-menu
        onClick={onMobileMenuToggle}
        className="sm:hidden flex items-center gap-3 px-4 py-3 mb-4 w-full bg-slate-900/50 backdrop-blur-sm hover:bg-slate-800/50 rounded-lg transition-colors border border-slate-800"
        aria-label="Menu de navigation"
        aria-expanded={isMobileMenuOpen}
      >
        <Menu className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`} />
        <span className="text-sm font-medium text-slate-200">
          {getTabLabel(activeTab)}
        </span>
        <span className="ml-auto text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
          {activeTab === 'events' && eventsCount}
          {activeTab === 'moderation' && photosCount}
          {activeTab === 'battles' && battlesCount}
          {activeTab === 'guests' && guestsCount}
        </span>
      </button>

      {/* Menu mobile dropdown */}
      {isMobileMenuOpen && (
        <div data-mobile-menu className="sm:hidden mb-4 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800 overflow-hidden">
          <div className="p-2 space-y-1">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    onMobileMenuToggle();
                    if (tab.id === 'guests' && onLoadGuests) onLoadGuests();
                    if (tab.id === 'events' && onLoadEvents) onLoadEvents();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border min-h-[44px] ${
                    isActive
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                      : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1 text-left">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isActive ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-700 text-slate-300'
                    }`}>{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation horizontale pour desktop */}
      <div className="hidden sm:block">
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800 p-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
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
                  }}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all whitespace-nowrap min-h-[44px] flex-shrink-0 ${
                    isActive
                      ? 'text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-lg border border-indigo-500/30"></div>
                  )}
                  <div className="relative flex items-center gap-2">
                    <Icon className={`w-4 h-4 flex-shrink-0 transition-all ${isActive ? 'text-indigo-400' : ''}`} />
                    <span className="text-sm font-medium">{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-indigo-500/30 text-indigo-200'
                          : 'bg-slate-800 text-slate-400'
                      }`}>{tab.count}</span>
                    )}
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-indigo-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

