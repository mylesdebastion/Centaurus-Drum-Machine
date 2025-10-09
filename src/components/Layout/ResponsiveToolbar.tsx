import { useState, useRef, useEffect } from 'react';
import { MoreVertical, MoreHorizontal } from 'lucide-react';

export interface ToolbarItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}

interface ResponsiveToolbarProps {
  items: ToolbarItem[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  buttonClassName?: string;
}

/**
 * Responsive toolbar with intelligent overflow handling
 *
 * Features:
 * - Auto-reflow toolbar items based on available width
 * - Overflow menu for items that don't fit
 * - Support for horizontal and vertical orientations
 * - Touch-friendly 44px minimum button size
 * - Smooth transitions and animations
 *
 * @param items - Array of toolbar items with id, label, icon, onClick
 * @param orientation - Toolbar orientation: 'horizontal' (default) or 'vertical'
 * @param className - Additional classes for toolbar container
 * @param buttonClassName - Additional classes for toolbar buttons
 */
export function ResponsiveToolbar({
  items,
  orientation = 'horizontal',
  className = '',
  buttonClassName = '',
}: ResponsiveToolbarProps) {
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [showOverflow, setShowOverflow] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Calculate how many items can fit
  useEffect(() => {
    if (!toolbarRef.current || orientation === 'vertical') {
      setVisibleCount(items.length);
      return;
    }

    const calculateVisibleItems = () => {
      const toolbar = toolbarRef.current;
      if (!toolbar) return;

      const toolbarWidth = toolbar.offsetWidth;
      const buttonWidth = 60; // Approximate button width with padding
      const overflowButtonWidth = 50; // Width of overflow menu button

      // Calculate how many buttons fit
      const maxButtons = Math.floor((toolbarWidth - overflowButtonWidth) / buttonWidth);
      const canFitAll = items.length * buttonWidth <= toolbarWidth;

      if (canFitAll) {
        setVisibleCount(items.length);
      } else {
        setVisibleCount(Math.max(1, maxButtons));
      }
    };

    calculateVisibleItems();

    // Recalculate on window resize
    window.addEventListener('resize', calculateVisibleItems);
    return () => window.removeEventListener('resize', calculateVisibleItems);
  }, [items.length, orientation]);

  const visibleItems = items.slice(0, visibleCount);
  const overflowItems = items.slice(visibleCount);
  const hasOverflow = overflowItems.length > 0 && orientation === 'horizontal';

  const orientationClasses =
    orientation === 'horizontal'
      ? 'flex-row items-center'
      : 'flex-col items-stretch';

  return (
    <div
      ref={toolbarRef}
      className={`flex ${orientationClasses} gap-2 relative ${className}`}
    >
      {/* Visible toolbar items */}
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={item.onClick}
            disabled={item.disabled}
            className={`
              flex items-center justify-center gap-2
              px-3 py-2 min-h-[44px] min-w-[44px]
              bg-gray-700 hover:bg-gray-600
              text-white text-sm font-medium
              rounded-lg transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              ${buttonClassName}
            `}
            aria-label={item.label}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span className={orientation === 'vertical' ? '' : 'hidden sm:inline'}>
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Overflow menu */}
      {hasOverflow && (
        <div className="relative">
          <button
            onClick={() => setShowOverflow(!showOverflow)}
            className={`
              flex items-center justify-center
              px-3 py-2 min-h-[44px] min-w-[44px]
              bg-gray-700 hover:bg-gray-600
              text-white text-sm font-medium
              rounded-lg transition-colors
              ${buttonClassName}
            `}
            aria-label="More options"
            aria-expanded={showOverflow}
          >
            {orientation === 'horizontal' ? (
              <MoreHorizontal className="w-5 h-5" />
            ) : (
              <MoreVertical className="w-5 h-5" />
            )}
          </button>

          {/* Overflow dropdown */}
          {showOverflow && (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowOverflow(false)}
              />

              {/* Dropdown menu */}
              <div
                className={`
                  absolute right-0 mt-2 z-20
                  min-w-[200px]
                  bg-gray-800 border border-gray-700
                  rounded-lg shadow-lg
                  overflow-hidden
                `}
              >
                {overflowItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.onClick();
                        setShowOverflow(false);
                      }}
                      disabled={item.disabled}
                      className={`
                        w-full flex items-center gap-3
                        px-4 py-3 min-h-[44px]
                        text-left text-sm
                        hover:bg-gray-700
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors
                      `}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
