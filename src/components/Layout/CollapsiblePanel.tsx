import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  mobileOnly?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

/**
 * Collapsible panel for complex controls with responsive behavior
 *
 * Features:
 * - Mobile: Accordion-style expansion with smooth animations
 * - Desktop: Always visible (optional) or collapsible based on mobileOnly prop
 * - Smooth Tailwind transitions
 * - Accessible with ARIA attributes
 * - Touch-friendly 44px minimum header height
 *
 * @param title - Panel header title
 * @param children - Panel content
 * @param defaultOpen - Initial open state (default: true)
 * @param mobileOnly - If true, panel is always expanded on desktop (default: false)
 * @param className - Additional classes for panel container
 * @param headerClassName - Additional classes for header
 * @param contentClassName - Additional classes for content area
 */
export function CollapsiblePanel({
  title,
  children,
  defaultOpen = true,
  mobileOnly = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isMobile } = useResponsive();

  // Desktop always-visible mode when mobileOnly is true
  const isAlwaysVisible = !isMobile && mobileOnly;
  const isCollapsible = isMobile || !mobileOnly;

  const togglePanel = () => {
    if (isCollapsible) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden ${className}`}
    >
      {/* Header - always visible */}
      <button
        onClick={togglePanel}
        className={`
          w-full flex items-center justify-between
          px-4 py-3 min-h-[44px]
          text-left font-medium
          transition-colors
          ${isCollapsible ? 'hover:bg-gray-700 cursor-pointer' : 'cursor-default'}
          ${headerClassName}
        `}
        aria-expanded={isAlwaysVisible || isOpen}
        aria-controls={`panel-${title.replace(/\s+/g, '-').toLowerCase()}`}
        disabled={!isCollapsible}
      >
        <span className="text-base sm:text-lg">{title}</span>
        {isCollapsible && (
          <span className="text-gray-400">
            {isOpen ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </span>
        )}
      </button>

      {/* Content - collapsible or always visible */}
      <div
        id={`panel-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isAlwaysVisible || isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
        aria-hidden={!isAlwaysVisible && !isOpen}
      >
        <div className={`px-4 py-3 border-t border-gray-700 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
