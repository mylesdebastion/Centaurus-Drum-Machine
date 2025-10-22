import type { NavTab } from '../../types';

interface MobileNavigationProps {
  activeView: string;
  onViewChange: (view: any) => void;
  tabs?: NavTab[];
  userCount?: number;
  mode?: 'sticky' | 'overlay';
  enableHaptics?: boolean;
}

/**
 * Enhanced mobile navigation component with configurable tabs
 *
 * Features:
 * - Configurable tab definitions via props
 * - Support for custom icons and badge counts
 * - Minimum 44px touch targets (Apple HIG standard)
 * - Haptic feedback support (iOS/Android) via Vibration API
 * - Sticky vs overlay positioning modes
 * - Automatic safe-area-inset handling
 *
 * @param activeView - Currently active view identifier
 * @param onViewChange - Callback when view changes
 * @param tabs - Custom tab configuration (optional, falls back to default drum/users/settings)
 * @param userCount - User count for badge display (backward compatibility)
 * @param mode - Navigation mode: 'sticky' (default) or 'overlay'
 * @param enableHaptics - Enable haptic feedback on tab change (default: true)
 */
export function MobileNavigation({
  activeView,
  onViewChange,
  tabs,
  userCount,
  mode = 'sticky',
  enableHaptics = true,
}: MobileNavigationProps) {
  // Trigger haptic feedback (if supported)
  const triggerHaptic = () => {
    if (!enableHaptics) return;

    // Check for Vibration API support (iOS/Android)
    if ('vibrate' in navigator) {
      // Light haptic feedback: 10ms vibration
      navigator.vibrate(10);
    }
  };

  const handleTabChange = (viewId: string) => {
    triggerHaptic();
    onViewChange(viewId);
  };

  // Default tabs for backward compatibility with JamSession
  const defaultTabs: NavTab[] = [
    {
      id: 'drum',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      label: 'Drums',
    },
    {
      id: 'users',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      label: 'Users',
      badge: userCount,
    },
    {
      id: 'settings',
      icon: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Settings',
    },
  ];

  const navTabs = tabs || defaultTabs;

  // Positioning classes based on mode
  const positionClasses = mode === 'overlay'
    ? 'fixed bottom-0 left-0 right-0 z-50'
    : 'fixed bottom-0 left-0 right-0 z-50';

  return (
    <nav
      className={`${positionClasses} bg-gray-800 border-t border-gray-700 px-4 py-2 md:hidden`}
      style={{
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex justify-around items-center">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          const showBadge = tab.badge !== undefined && tab.badge > 0;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex flex-col items-center gap-1
                p-2 rounded-lg transition-colors relative
                min-w-[44px] min-h-[44px]
                ${
                  isActive
                    ? 'text-primary-400 bg-primary-400/10'
                    : 'text-gray-400 hover:text-white'
                }
              `}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {showBadge && (
                <span
                  className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  aria-label={`${tab.badge} ${tab.label.toLowerCase()}`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
