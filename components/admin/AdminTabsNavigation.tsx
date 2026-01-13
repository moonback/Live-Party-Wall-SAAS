import React from 'react';
import { 
  Calendar, Image as ImageIcon, BarChart2, Settings, Video, 
  Zap, Users, Menu, Key
} from 'lucide-react';
import { AdminTab } from './types';
import { Button, Badge, Card } from './ui';

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

  const getTabLabel = (tabId: AdminTab) => {
    return tabs.find(t => t.id === tabId)?.label || '';
  };

  return (
    <div className="mb-6">
      {/* Bouton menu hamburger pour mobile */}
      <button
        data-mobile-menu
        onClick={onMobileMenuToggle}
        className="sm:hidden flex items-center gap-3 px-4 py-3 mb-4 w-full bg-slate-900/50 backdrop-blur-sm hover:bg-slate-800/50 rounded-lg transition-colors border border-slate-800 min-h-[44px]"
        aria-label="Menu de navigation"
        aria-expanded={isMobileMenuOpen}
      >
        <Menu className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${isMobileMenuOpen ? 'rotate-90' : ''}`} />
        <span className="text-sm font-medium text-slate-200 flex-1 text-left">
          {getTabLabel(activeTab)}
        </span>
        {(activeTab === 'events' && eventsCount > 0) ||
         (activeTab === 'moderation' && photosCount > 0) ||
         (activeTab === 'battles' && battlesCount > 0) ||
         (activeTab === 'guests' && guestsCount > 0) ? (
          <Badge variant="neutral">
            {activeTab === 'events' && eventsCount}
            {activeTab === 'moderation' && photosCount}
            {activeTab === 'battles' && battlesCount}
            {activeTab === 'guests' && guestsCount}
          </Badge>
        ) : null}
      </button>

      {/* Menu mobile dropdown */}
      {isMobileMenuOpen && (
        <Card data-mobile-menu className="sm:hidden mb-4" variant="default">
          <div className="space-y-2">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? 'primary' : 'ghost'}
                  fullWidth
                  onClick={() => {
                    onTabChange(tab.id);
                    onMobileMenuToggle();
                    if (tab.id === 'guests' && onLoadGuests) onLoadGuests();
                    if (tab.id === 'events' && onLoadEvents) onLoadEvents();
                  }}
                  icon={Icon}
                  className={`justify-start ${isActive ? 'bg-indigo-500/10 border-indigo-500/30' : ''}`}
                >
                  <span className="text-sm font-medium flex-1 text-left">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <Badge variant={isActive ? 'primary' : 'neutral'}>
                      {tab.count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Navigation horizontale pour desktop */}
      <div className="hidden sm:block">
        <Card variant="default" className="p-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? 'primary' : 'ghost'}
                  size="md"
                  onClick={() => {
                    onTabChange(tab.id);
                    if (tab.id === 'guests' && onLoadGuests) onLoadGuests();
                    if (tab.id === 'events' && onLoadEvents) onLoadEvents();
                  }}
                  icon={Icon}
                  className={`relative whitespace-nowrap flex-shrink-0 ${
                    isActive ? 'bg-indigo-500/10 border-indigo-500/30' : ''
                  }`}
                >
                  <span className="text-sm font-medium">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <Badge variant={isActive ? 'primary' : 'neutral'}>
                      {tab.count}
                    </Badge>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-indigo-500 rounded-full"></div>
                  )}
                </Button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

