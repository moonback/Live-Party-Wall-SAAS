import React from 'react';
import { ViewMode } from '../types';
import { Monitor, Smartphone, Tv, BarChart3, HelpCircle } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

interface QuickAccessButtonsProps {
  onSelectMode: (mode: ViewMode) => void;
  isAdminAuthenticated: boolean;
  statsEnabled?: boolean;
}

const QuickAccessButtons: React.FC<QuickAccessButtonsProps> = ({
  onSelectMode,
  isAdminAuthenticated,
  statsEnabled = true,
}) => {
  const isMobile = useIsMobile();

  if (!isAdminAuthenticated) {
    return null;
  }

  const buttons = [
    {
      id: 'wall' as ViewMode,
      label: 'Mur',
      icon: Monitor,
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'hover:from-blue-400 hover:to-cyan-400',
    },
    {
      id: 'projection' as ViewMode,
      label: 'Projection',
      icon: Tv,
      color: 'from-purple-500 to-pink-500',
      hoverColor: 'hover:from-purple-400 hover:to-pink-400',
    },
    {
      id: 'mobile-control' as ViewMode,
      label: 'Mobile',
      icon: Smartphone,
      color: 'from-green-500 to-emerald-500',
      hoverColor: 'hover:from-green-400 hover:to-emerald-400',
    },
    ...(statsEnabled
      ? [
          {
            id: 'stats-display' as ViewMode,
            label: 'Stats',
            icon: BarChart3,
            color: 'from-orange-500 to-red-500',
            hoverColor: 'hover:from-orange-400 hover:to-red-400',
          },
        ]
      : []),
    {
      id: 'help' as ViewMode,
      label: 'Aide',
      icon: HelpCircle,
      color: 'from-gray-500 to-gray-600',
      hoverColor: 'hover:from-gray-400 hover:to-gray-500',
    },
  ];

  if (isMobile) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 px-2">
        <div className="flex gap-2 bg-black/60 backdrop-blur-md rounded-2xl p-2 border border-white/10 shadow-xl">
          {buttons.map((button) => {
            const Icon = button.icon;
            return (
              <button
                key={button.id}
                onClick={() => onSelectMode(button.id)}
                className={`px-3 py-2 bg-gradient-to-r ${button.color} ${button.hoverColor} rounded-xl text-white text-xs font-medium transition-all shadow-lg flex items-center gap-1.5 min-w-[70px] justify-center`}
              >
                <Icon className="w-4 h-4" />
                <span>{button.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      {buttons.map((button) => {
        const Icon = button.icon;
        return (
          <button
            key={button.id}
            onClick={() => onSelectMode(button.id)}
            className={`px-4 py-3 bg-gradient-to-r ${button.color} ${button.hoverColor} rounded-xl text-white text-sm font-medium transition-all shadow-lg backdrop-blur-sm border border-white/20 flex items-center gap-2 hover:scale-105 hover:shadow-xl`}
            title={button.label}
          >
            <Icon className="w-5 h-5" />
            <span>{button.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickAccessButtons;

