import React from 'react';
import { Music, Eye, BookOpen, Users, Settings } from 'lucide-react';

interface MobileNavigationProps {
  activeView: 'drum' | 'visualizer' | 'users' | 'settings';
  onViewChange: (view: 'drum' | 'visualizer' | 'users' | 'settings') => void;
  userCount: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeView,
  onViewChange,
  userCount
}) => {
  const navItems = [
    { id: 'drum' as const, icon: Music, label: 'Drums' },
    { id: 'visualizer' as const, icon: Eye, label: 'Visual' },
    { id: 'users' as const, icon: Users, label: 'Users', badge: userCount },
    { id: 'settings' as const, icon: Settings, label: 'Settings' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-2 z-50 md:hidden">
      <div className="flex justify-around items-center">
        {navItems.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative ${
              activeView === id
                ? 'text-primary-400 bg-primary-400/10'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
            {badge && badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};