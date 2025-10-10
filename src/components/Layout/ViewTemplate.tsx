import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ViewTemplateProps {
  /** Title displayed in the header */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Back button callback */
  onBack?: () => void;
  /** Main content */
  children: React.ReactNode;
  /** Optional header actions (buttons, badges, etc.) */
  headerActions?: React.ReactNode;
  /** Layout variant */
  variant?: 'simple' | 'centered' | 'full-width';
  /** Max width for centered layouts */
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl';
  /** Additional className for root container */
  className?: string;
  /** Show badge (e.g., "Beta", "Experiment") */
  badge?: string;
  /** Badge color variant */
  badgeVariant?: 'primary' | 'orange' | 'blue' | 'green';
}

/**
 * ViewTemplate - Consistent layout template for experiment/module views
 *
 * **Usage Patterns:**
 *
 * 1. **Simple Experiment View** (MIDITest-style):
 *    - variant="centered"
 *    - maxWidth="4xl"
 *    - Back button + title
 *
 * 2. **Full-Screen Visualizer** (PianoRoll-style):
 *    - variant="full-width"
 *    - maxWidth="7xl"
 *    - Flex column layout
 *
 * 3. **Collaborative Session** (JamSession-style):
 *    - Use ResponsiveContainer + Header instead
 *    - This template is for simpler views
 *
 * **Responsive Design:**
 * - Follows /jam patterns: p-4 md:p-6
 * - Text sizes: text-xl sm:text-2xl sm:text-3xl
 * - Header padding: px-4 sm:px-6 py-3 sm:py-4
 * - Touch targets: 44px minimum
 *
 * @example
 * ```tsx
 * <ViewTemplate
 *   title="Piano Roll Visualizer"
 *   subtitle="Interactive 88-key piano with MIDI input"
 *   onBack={() => navigate('/')}
 *   badge="Beta"
 *   badgeVariant="orange"
 *   variant="full-width"
 *   maxWidth="7xl"
 * >
 *   <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
 *     // Your content
 *   </div>
 * </ViewTemplate>
 * ```
 */
export const ViewTemplate: React.FC<ViewTemplateProps> = ({
  title,
  subtitle,
  onBack,
  children,
  headerActions,
  variant = 'centered',
  maxWidth = '4xl',
  className = '',
  badge,
  badgeVariant = 'orange',
}) => {
  const maxWidthClass = {
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl',
  }[maxWidth];

  const badgeColors = {
    'primary': 'bg-primary-600 text-white',
    'orange': 'bg-orange-500 text-white',
    'blue': 'bg-blue-500 text-white',
    'green': 'bg-green-500 text-white',
  }[badgeVariant];

  // Simple variant: Centered content with back button above title
  if (variant === 'simple' || variant === 'centered') {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 ${className}`}>
        <div className={`${maxWidthClass} mx-auto`}>
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors min-h-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Welcome
            </button>
          )}

          {/* Title Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {title}
              </h1>
              {badge && (
                <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeColors}`}>
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-gray-400 text-sm sm:text-base">
                {subtitle}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Full-width variant: Header bar + full-width content (PianoRoll/LiveAudioVisualizer style)
  if (variant === 'full-width') {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col ${className}`}>
        {/* Header Bar */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className={`${maxWidthClass} mx-auto flex items-center justify-between gap-4`}>
            {/* Left: Back Button */}
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors min-h-[44px] flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            {/* Center: Title + Badge */}
            <div className="flex items-center gap-3 flex-1 justify-center">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {title}
              </h1>
              {badge && (
                <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeColors}`}>
                  {badge}
                </span>
              )}
            </div>

            {/* Right: Actions or Spacer */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {headerActions || <div className="w-16 sm:w-20" />}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-auto">
          <div className={`${maxWidthClass} mx-auto space-y-4`}>
            {subtitle && (
              <p className="text-gray-400 text-sm sm:text-base mb-2">
                {subtitle}
              </p>
            )}
            {children}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

/**
 * ViewCard - Standard card component for content sections
 *
 * Consistent with JamSession and experiment view patterns.
 *
 * @example
 * ```tsx
 * <ViewCard title="MIDI Setup">
 *   <MIDIDeviceSelector />
 * </ViewCard>
 * ```
 */
interface ViewCardProps {
  /** Card title */
  title?: string;
  /** Card content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Use larger border radius (rounded-xl vs rounded-lg) */
  large?: boolean;
}

export const ViewCard: React.FC<ViewCardProps> = ({
  title,
  children,
  className = '',
  large = false,
}) => {
  const borderRadius = large ? 'rounded-xl' : 'rounded-lg';
  const padding = large ? 'p-6' : 'p-4 sm:p-6';

  return (
    <div className={`bg-gray-800 ${borderRadius} border border-gray-700 ${padding} ${className}`}>
      {title && (
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};
