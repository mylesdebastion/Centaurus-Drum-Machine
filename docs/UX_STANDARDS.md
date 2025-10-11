# UX Standards - Audiolux Jam Session

## Purpose
This document establishes consistent design patterns and styling standards across the Audiolux Jam Session application to ensure a cohesive user experience.

## Design Philosophy (bolt.new Standards)

**Core Principle**: For all designs and UI components, make them **beautiful, not cookie cutter**. Create components that are **fully featured and worthy for production**.

### Quality Standards
- **Production-ready from start** - No placeholder content or incomplete implementations
- **Beautiful and thoughtful** - Custom design decisions, not generic templates
- **Fully featured** - Complete functionality, proper error states, loading states
- **Consistent visual system** - Follow established Tailwind component patterns

### Technology Stack Alignment
- **JSX with Tailwind CSS classes** (established project pattern)
- **React hooks** (functional components only)
- **Lucide React icons exclusively** (do not add other icon libraries)
- **Minimal external dependencies** (extend existing patterns instead)

### Component Development Process
1. **Review existing components** for established patterns before creating new ones
2. **Use component classes** from `/src/index.css` (@layer components: `.btn-primary`, `.step-button`, `.track-row`)
3. **Follow design tokens** from `tailwind.config.js` (primary/accent color scales)
4. **Extend, don't override** - build on existing visual patterns
5. **Reference CLAUDE.md** for additional development guidelines

## Design System

### Border Radius Standards

| Component Type | Border Radius | Usage |
|----------------|---------------|--------|
| Small buttons/indicators | `rounded-lg` (8px) | Status indicators, small action buttons, form controls |
| Medium containers | `rounded-lg` (8px) | Cards, panels, input groups, transport controls |
| Large containers | `rounded-xl` (12px) | Feature cards, modal dialogs, major content sections |
| Full round | `rounded-full` | Avatar images, circular progress indicators ONLY |

**❌ Avoid**: `rounded-full` for rectangular buttons or status indicators
**✅ Preferred**: `rounded-lg` for most interactive elements

### Button Styling Standards

#### Primary Action Buttons
```css
className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
```

#### Secondary Action Buttons
```css
className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
```

#### Small Action Buttons (Status indicators, close buttons)
```css
className="px-2 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
```

#### Icon-Only Buttons
```css
className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
```

### Status Indicators

#### Connection Status Pattern
```css
/* Main indicator */
className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border"

/* Color variants */
- Connected: "bg-green-50 border-green-200 text-green-700"
- Connecting: "bg-blue-50 border-blue-200 text-blue-700"
- Error: "bg-red-50 border-red-200 text-red-700"
- Disconnected: "bg-gray-50 border-gray-200 text-gray-700"
```

### Panel and Container Standards

#### Dropdown Panels
```css
className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
```

#### Content Cards
```css
className="bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-700 hover:border-primary-500 transition-colors"
```

#### Header Elements
```css
className="bg-gray-700 px-2 sm:px-3 py-1 rounded-lg" /* For inline elements */
```

### Color System

#### Status Colors
- **Success**: `green-50/green-200/green-600/green-700`
- **Warning**: `yellow-50/yellow-200/yellow-600/yellow-700`
- **Error**: `red-50/red-200/red-600/red-700`
- **Info**: `blue-50/blue-200/blue-600/blue-700`
- **Neutral**: `gray-50/gray-200/gray-600/gray-700`

#### Brand Colors
- **Primary**: `primary-400/primary-500/primary-600/primary-700`
- **Accent**: `accent-400/accent-500/accent-600/accent-700`

### Typography Standards

#### Interactive Text Sizes
- **Large buttons**: `text-base` (16px)
- **Medium buttons**: `text-sm` (14px)
- **Small buttons/status**: `text-xs` (12px)
- **Icon buttons**: No text, icon sizing: `w-4 h-4` to `w-6 h-6`

#### Font Weights
- **Button text**: `font-medium`
- **Status text**: `font-medium`
- **Body text**: `font-normal`
- **Headings**: `font-semibold` or `font-bold`

### Spacing Standards

#### Internal Padding
- **Large buttons**: `px-4 py-2`
- **Medium buttons**: `px-3 py-1.5`
- **Small buttons**: `px-2 py-1`
- **Icon buttons**: `p-2` or `p-3`

#### Gap Spacing
- **Button groups**: `gap-2`
- **Section spacing**: `gap-4` or `gap-6`
- **Large layouts**: `gap-8` or `gap-12`

### Animation Standards

#### Transitions
All interactive elements should include smooth transitions:
```css
className="transition-colors" /* For color changes */
className="transition-all"    /* For multiple properties */
```

#### Hover States
- Buttons should have hover state changes
- Color transitions should be smooth (transition-colors)
- Background color shifts for visual feedback

### Responsive Design

#### Breakpoint-Aware Spacing
```css
className="p-4 sm:p-6"           /* Responsive padding */
className="text-sm sm:text-base"  /* Responsive text size */
className="gap-2 sm:gap-4"       /* Responsive gaps */
```

#### Mobile Considerations
- Touch targets minimum 44px (use appropriate padding)
- Icon sizes: `w-4 h-4` on mobile, `w-5 h-5` on desktop
- Text sizes: smaller on mobile, larger on desktop

## UI Interaction Patterns

### Anti-Modal Philosophy

**Core Principle**: Avoid modals, overlays, and blocking dialogs. Use inline UI patterns that maintain context and allow users to see the surrounding interface.

**Why No Modals:**
- **Context loss**: Modals hide the underlying interface, forcing users to memorize information
- **Mobile unfriendly**: Overlays create complex z-index management and scrolling issues
- **Accessibility concerns**: Focus trapping and screen reader navigation complexity
- **Jarring transitions**: Modals interrupt flow with blocking interactions

**Preferred Alternatives:**

#### 1. Inline Expandable Forms

Replace modal dialogs with inline expandable sections that appear within the component itself.

```tsx
// ✅ GOOD - Inline expandable form
const [showSaveForm, setShowSaveForm] = useState(false);

{showSaveForm && (
  <div className="border-t border-gray-700 pt-3 space-y-3">
    <h4 className="text-sm font-medium text-gray-300">
      Save Current Configuration as Preset
    </h4>
    <input
      type="text"
      value={presetName}
      onChange={(e) => setPresetName(e.target.value)}
      placeholder="Guitar Setup"
      autoFocus
      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
    />
    <div className="flex gap-2">
      <button onClick={() => setShowSaveForm(false)} className="btn-secondary flex-1">
        Cancel
      </button>
      <button onClick={handleSavePreset} className="btn-primary flex-1">
        Save Preset
      </button>
    </div>
  </div>
)}

// ❌ BAD - Modal dialog
<Modal isOpen={showSaveDialog} onClose={...}>
  <ModalHeader>Save Preset</ModalHeader>
  <ModalBody>...</ModalBody>
</Modal>
```

**Pattern in use**: `WLEDDeviceManager.tsx:426-458` (expandable settings), Story 8.1 (inline save form)

#### 2. Inline Dropdowns (No Overlays)

Use inline dropdowns with `relative`/`absolute` positioning instead of overlay-based select components.

```tsx
// ✅ GOOD - Inline dropdown
<div ref={dropdownRef} className="relative flex-1">
  <button
    onClick={() => setIsOpen(!isOpen)}
    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-between min-h-[44px]"
  >
    <span>{currentPreset?.name || 'Select preset...'}</span>
    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
  </button>

  {isOpen && (
    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 max-h-80 overflow-y-auto z-10">
      {/* Dropdown items */}
    </div>
  )}
</div>

// ❌ BAD - Native select or overlay portal
<select>...</select>
// OR
<Portal><Overlay>...</Overlay></Portal>
```

**Pattern in use**: Story 8.1 (preset dropdown), custom dropdowns throughout app

#### 3. Toast Notifications with Undo Actions

Replace confirmation dialogs with toast notifications that include undo actions (Gmail-style).

```tsx
// ✅ GOOD - Toast with undo
showToast('Loaded Drum Kit Config', {
  type: 'success',
  action: {
    label: 'Undo',
    onClick: () => restorePreviousPreset(),
  },
  duration: 5000 // Auto-dismiss after 5 seconds
});

// ❌ BAD - Blocking confirmation dialog
if (confirm('Are you sure you want to load this preset? Unsaved changes will be lost.')) {
  loadPreset();
}
```

**Pattern in use**: Story 8.1 (preset load/delete actions)

#### 4. Inline Error/Warning Messages

Show validation errors and warnings inline near the relevant input, not in modal alerts.

```tsx
// ✅ GOOD - Inline error
{error && (
  <div className="flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-700 rounded-lg">
    <AlertCircle className="w-4 h-4 text-red-400" />
    <span className="text-sm text-red-300">{error}</span>
  </div>
)}

// ❌ BAD - Alert dialog
alert('Error: Invalid preset name');
```

### Expandable UI Pattern

Use collapsible sections with smooth transitions to reveal additional controls without hiding context.

**State Management:**
```tsx
const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

const toggleSection = (sectionId: string) => {
  setExpandedSections((prev) => {
    const newSet = new Set(prev);
    if (newSet.has(sectionId)) {
      newSet.delete(sectionId);
    } else {
      newSet.add(sectionId);
    }
    return newSet;
  });
};
```

**Visual Pattern:**
```tsx
<button onClick={() => toggleSection(id)} className="flex items-center justify-between w-full">
  <span>Settings</span>
  <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.has(id) ? 'rotate-180' : ''}`} />
</button>

{expandedSections.has(id) && (
  <div className="border-t border-gray-700 pt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
    {/* Expanded content */}
  </div>
)}
```

**Pattern in use**: `WLEDDeviceManager.tsx:232-243` (toggleSettings), Story 8.1 (inline save form)

### Non-Blocking Feedback

Provide feedback without interrupting the user's workflow.

**Guidelines:**
- Use toast notifications for success/info messages (auto-dismiss)
- Include undo actions for destructive operations (5-10 second window)
- Show loading states inline (spinners, progress bars) not in blocking overlays
- Display errors inline near the source of the error

**Example - Loading State:**
```tsx
// ✅ GOOD - Inline loading
{isLoading ? (
  <div className="flex items-center gap-2 px-4 py-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span className="text-sm text-gray-400">Loading presets...</span>
  </div>
) : (
  <PresetList />
)}

// ❌ BAD - Blocking overlay
<LoadingOverlay isLoading={isLoading} />
```

### When Modals Are Acceptable

In rare cases, modals may be necessary:

- **Critical confirmations**: Destructive actions that cannot be undone (use sparingly, prefer undo pattern)
- **Legal requirements**: Cookie consent, terms acceptance that must be acknowledged
- **Full-screen experiences**: Image galleries, video players where immersion is desired

**Even then, consider alternatives first.** Can you use:
- Inline confirmation with undo? (preferred)
- Toast with action buttons?
- Expandable detail view?

## Implementation Guidelines

### Before Adding New Components
1. **Check existing patterns** - Use established button/container styles
2. **Follow border radius hierarchy** - `rounded-lg` for most cases
3. **Use consistent color palette** - Stick to defined status colors
4. **Apply proper spacing** - Use standard padding/gap patterns

### Code Review Checklist
- [ ] **bolt.new Quality**: Component is beautiful and production-ready (not cookie cutter)
- [ ] **Existing Patterns**: Reviewed similar components for established patterns
- [ ] **Component Classes**: Used existing classes from `/src/index.css` where applicable
- [ ] **Design Tokens**: Used primary/accent colors from `tailwind.config.js`
- [ ] **Border Radius**: Follows standards (`rounded-lg` for interactive elements)
- [ ] **Icons**: Used Lucide React icons exclusively
- [ ] **Hover States**: Implemented with smooth transitions
- [ ] **Responsive**: Tested across mobile, tablet, and desktop breakpoints
- [ ] **Accessibility**: Proper contrast and touch targets (44px minimum)
- [ ] **Dependencies**: No unnecessary external packages added

### Anti-Patterns to Avoid
- ❌ **Cookie cutter designs** - Generic, template-like implementations
- ❌ **Incomplete features** - Placeholder content or missing functionality
- ❌ **Modals and overlays** - Blocking dialogs, overlay portals, confirmation alerts (see UI Interaction Patterns)
- ❌ **External dependencies** - Adding UI libraries when existing patterns work
- ❌ **Inconsistent patterns** - Not following established component classes
- ❌ **Non-Lucide icons** - Using other icon libraries
- ❌ **Border radius mixing** - Using `rounded-full` with `rounded-lg` in similar contexts
- ❌ **Custom colors** - Colors outside primary/accent/semantic palette
- ❌ **Missing hover states** - Interactive elements without transitions
- ❌ **Poor responsive** - Not testing across all breakpoints

## Maintenance

This document should be updated when:
- New component patterns are established
- Color palette changes are made
- Breaking changes to styling standards occur
- Major design system updates happen

**Last Updated**: 2025-01-10
**Version**: 1.2 (Added anti-modal design philosophy and UI interaction patterns)
**Applies to**: All UI components in Audiolux Jam Session

## View Templates

### ViewTemplate Component

For consistent experiment and module views, use the `ViewTemplate` component located at `/src/components/Layout/ViewTemplate.tsx`.

**When to use ViewTemplate:**
- Experiment views (/midi-test, /piano, /wled-test)
- Module views (/dj-visualizer as full-screen)
- Simple feature demonstrations
- Views that don't require collaborative features (session code, user list)

**When NOT to use ViewTemplate:**
- Collaborative sessions (use `ResponsiveContainer` + `Header` + `MobileNavigation` instead)
- Complex multi-layout views with tab navigation
- Home/landing pages

### Template Variants

#### 1. Simple/Centered Layout (Default)

Best for: Simple experiments, settings pages, info views

```tsx
import { ViewTemplate, ViewCard } from '@/components/Layout/ViewTemplate';

<ViewTemplate
  title="MIDI Input Engine Test"
  subtitle="Connect a MIDI device or use keyboard fallback"
  onBack={() => navigate('/')}
  variant="centered"  // or "simple"
  maxWidth="4xl"
  badge="Beta"
  badgeVariant="orange"
>
  <ViewCard title="MIDI Setup">
    <MIDIDeviceSelector />
  </ViewCard>

  <ViewCard title="Active Notes">
    {/* Content */}
  </ViewCard>
</ViewTemplate>
```

**Pattern characteristics:**
- Back button above title
- Centered content with max-width constraint
- Gradient background (from-gray-900 via-gray-800 to-gray-900)
- Cards with consistent spacing

**Example views:** MIDITest

#### 2. Full-Width Layout

Best for: Visualizers, canvas-based tools, immersive experiences

```tsx
<ViewTemplate
  title="Piano Roll Visualizer"
  subtitle="Interactive 88-key piano with MIDI input"
  onBack={() => navigate('/')}
  variant="full-width"
  maxWidth="7xl"
  badge="Beta"
  badgeVariant="orange"
  headerActions={
    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
      <Settings className="w-5 h-5" />
    </button>
  }
>
  <ViewCard title="Piano Canvas" large>
    <PianoCanvas />
  </ViewCard>

  <CollapsiblePanel title="Settings" defaultOpen={false}>
    {/* Settings content */}
  </CollapsiblePanel>
</ViewTemplate>
```

**Pattern characteristics:**
- Header bar with back button (left), title (center), actions (right)
- Full-width content area with flex-column layout
- Larger max-width (7xl) for canvas/visualization content
- Optional header actions slot

**Example views:** PianoRoll, LiveAudioVisualizer (full-screen mode)

### Inline Settings Pattern

For modular components and visualizers, use a consistent settings icon within the component container that toggles inline settings below the main content.

**Implementation pattern:**

```tsx
// 1. Add showSettings state
const [showSettings, setShowSettings] = useState(false);

// 2. Create container with header and settings icon
<div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
  {/* Container Header with Settings Icon */}
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-white">Piano Roll</h2>
    <button
      onClick={() => setShowSettings(!showSettings)}
      className="p-2 hover:bg-gray-700 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
      aria-label="Toggle settings"
    >
      <Settings className="w-5 h-5" />
    </button>
  </div>

  {/* Main content */}
  <div className="h-64 sm:h-80 md:h-96">
    {/* Canvas or visualizer */}
  </div>

  {/* Optional active state display */}
  {activeState && (
    <div className="mt-4 pt-4 border-t border-gray-700">
      {/* Active notes, status, etc. */}
    </div>
  )}

  {/* 3. Inline settings panel - expands within the same container */}
  {showSettings && (
    <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
      {/* Settings controls inline */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Setting Name
        </label>
        {/* Control */}
      </div>
    </div>
  )}
</div>
```

**Pattern characteristics:**
- Settings cog icon positioned in upper right of **container header** (not page header)
- Icon button with 44px touch target (`min-w-[44px] min-h-[44px]`)
- Smooth hover transition (`hover:bg-gray-700 transition-colors`)
- Settings expand **inline within the same card**, maintaining context
- Settings use divider (`border-t border-gray-700`) to visually separate from content
- Settings hidden by default, revealed on click
- No modal overlays or separate panels

**Visual consistency:**
- Matches Live Audio Visualizer settings pattern (embedded mode)
- Matches Piano Roll Visualizer settings pattern
- Consistent with anti-modal philosophy (inline, non-blocking)

**Where to use:**
- Visualizers with configurable parameters (Piano Roll, Audio Visualizer)
- Canvas-based components with settings
- Modular components where settings should stay in context
- Any component where users benefit from seeing settings + content simultaneously

**Where NOT to use:**
- Global application settings (use separate settings page)
- Simple components with 1-2 controls (show controls directly)
- Multi-step configuration wizards (use inline expandable sections)

**Example implementations:**
- `PianoRoll.tsx:206-215` - Settings button in container header
- `PianoRoll.tsx:247-416` - Inline settings panel within card
- `LiveAudioVisualizer.tsx:321-327` - Settings button (embedded mode)

**Benefits:**
- Users can see their changes reflected in the visualizer immediately
- No context switching or modal interruption
- Settings are clearly associated with their component
- Mobile-friendly (no overlay z-index issues)

### ViewCard Component

Standard card wrapper for content sections. Automatically follows design system standards.

```tsx
import { ViewCard } from '@/components/Layout/ViewTemplate';

// Standard card
<ViewCard title="Section Title">
  {/* Content */}
</ViewCard>

// Large card (rounded-xl, more padding)
<ViewCard title="Main Feature" large>
  {/* Content */}
</ViewCard>

// Card without title
<ViewCard>
  {/* Content */}
</ViewCard>
```

**Card specifications:**
- Background: `bg-gray-800`
- Border: `border border-gray-700`
- Border radius: `rounded-lg` (default) or `rounded-xl` (large)
- Padding: `p-4 sm:p-6` (default) or `p-6` (large)

### Responsive Behavior

ViewTemplate automatically handles responsive design following /jam patterns:

**Padding:**
- Mobile: `p-4`
- Desktop: `p-6`

**Text sizes:**
- Titles: `text-2xl sm:text-3xl` (simple), `text-xl sm:text-2xl` (full-width)
- Subtitles: `text-sm sm:text-base`

**Touch targets:**
- All interactive elements: minimum 44px height
- Back button: `min-h-[44px]`

### Max Width Guidelines

Choose max-width based on content type:

| Max Width | Use Case | Example Views |
|-----------|----------|---------------|
| `4xl` | Simple experiments, forms, settings | MIDITest, settings pages |
| `7xl` | Visualizers, canvas tools, feature-rich UIs | PianoRoll, LiveAudioVisualizer |
| `2xl` | Narrow content, documentation, info pages | About pages, help screens |

### Badge Variants

Use badges to indicate view status/type:

```tsx
badge="Beta"          badgeVariant="orange"   // Experimental features
badge="Experiment"    badgeVariant="blue"     // Prototype views
badge="Live"          badgeVariant="green"    // Production features
badge="New"           badgeVariant="primary"  // Recently added
```

### Anti-Pattern: Custom Headers

**❌ DON'T create custom header layouts:**
```tsx
// BAD - Inconsistent header
<div className="p-4 border-b border-gray-700">
  <div className="flex items-center justify-between">
    <button onClick={onBack}><ArrowLeft /></button>
    <h1>My View</h1>
  </div>
</div>
```

**✅ DO use ViewTemplate:**
```tsx
// GOOD - Consistent header via template
<ViewTemplate title="My View" onBack={onBack}>
  {/* Content */}
</ViewTemplate>
```

### Migration Path

Existing views can be gradually migrated to ViewTemplate:

1. **Identify candidate views** - Simple views without collaborative features
2. **Choose variant** - `centered` or `full-width`
3. **Wrap content** - Replace custom layout with ViewTemplate
4. **Replace cards** - Use ViewCard for consistent section styling
5. **Test responsive** - Verify mobile/tablet/desktop breakpoints

**Example migration:**

```tsx
// BEFORE (MIDITest-style custom layout)
<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
  <div className="max-w-4xl mx-auto">
    <button onClick={onBack}>
      <ArrowLeft /> Back
    </button>
    <h1>MIDI Test</h1>
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      {/* Content */}
    </div>
  </div>
</div>

// AFTER (ViewTemplate + ViewCard)
<ViewTemplate
  title="MIDI Test"
  onBack={onBack}
  variant="centered"
  maxWidth="4xl"
>
  <ViewCard>
    {/* Content */}
  </ViewCard>
</ViewTemplate>
```

## Related Documentation
- **CLAUDE.md** - Complete development guidelines for Claude Code
- **tailwind.config.js** - Custom design tokens and color scales
- **src/index.css** - Tailwind component classes (@layer components)
- **docs/architecture/component-architecture.md** - Technical component specifications
- **src/components/Layout/ViewTemplate.tsx** - View template implementation