# Responsive Component Patterns

## Overview

This document provides usage patterns and examples for the responsive layout components in the Audiolux Jam Session application.

## Components

### 1. CollapsiblePanel

Expandable/collapsible panel for complex controls with responsive behavior.

**Features:**
- Mobile: Accordion-style expansion with smooth animations
- Desktop: Always visible (optional) or collapsible based on `mobileOnly` prop
- Smooth Tailwind transitions
- Accessible with ARIA attributes
- Touch-friendly 44px minimum header height

**Usage:**

```tsx
import { CollapsiblePanel } from '../components/Layout';

// Basic usage - collapsible on all devices
<CollapsiblePanel title="Advanced Settings">
  <div className="space-y-3">
    {/* Your controls here */}
  </div>
</CollapsiblePanel>

// Mobile-only collapsible (always expanded on desktop)
<CollapsiblePanel
  title="Visualizer Controls"
  mobileOnly={true}
  defaultOpen={true}
>
  <div className="space-y-3">
    {/* Controls */}
  </div>
</CollapsiblePanel>

// Custom styling
<CollapsiblePanel
  title="Audio Settings"
  className="my-4"
  headerClassName="bg-primary-900"
  contentClassName="bg-gray-900"
  defaultOpen={false}
>
  {/* Content */}
</CollapsiblePanel>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Panel header title |
| `children` | `ReactNode` | required | Panel content |
| `defaultOpen` | `boolean` | `true` | Initial open state |
| `mobileOnly` | `boolean` | `false` | If true, always expanded on desktop |
| `className` | `string` | `''` | Additional classes for container |
| `headerClassName` | `string` | `''` | Additional classes for header |
| `contentClassName` | `string` | `''` | Additional classes for content |

---

### 2. ResponsiveToolbar

Auto-reflow toolbar with overflow menu for items that don't fit.

**Features:**
- Auto-reflow toolbar items based on available width
- Overflow menu for items that don't fit
- Support for horizontal and vertical orientations
- Touch-friendly 44px minimum button size
- Smooth transitions and animations

**Usage:**

```tsx
import { ResponsiveToolbar, ToolbarItem } from '../components/Layout';

const toolbarItems: ToolbarItem[] = [
  {
    id: 'play',
    label: 'Play',
    icon: Play,
    onClick: () => handlePlay(),
  },
  {
    id: 'stop',
    label: 'Stop',
    icon: Stop,
    onClick: () => handleStop(),
  },
  {
    id: 'record',
    label: 'Record',
    icon: Circle,
    onClick: () => handleRecord(),
    disabled: !canRecord,
  },
];

// Horizontal toolbar (default)
<ResponsiveToolbar items={toolbarItems} />

// Vertical toolbar
<ResponsiveToolbar
  items={toolbarItems}
  orientation="vertical"
/>

// Custom styling
<ResponsiveToolbar
  items={toolbarItems}
  className="bg-gray-900 p-2 rounded-lg"
  buttonClassName="bg-primary-600 hover:bg-primary-700"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `ToolbarItem[]` | required | Array of toolbar items |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Toolbar orientation |
| `className` | `string` | `''` | Additional classes for container |
| `buttonClassName` | `string` | `''` | Additional classes for buttons |

**ToolbarItem Interface:**

```typescript
interface ToolbarItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}
```

---

### 3. MobileViewContainer

Container for tab-based mobile views with automatic show/hide.

**Features:**
- Automatic visibility control based on `visible` prop
- Safe-area-insets for iOS notches and Android gesture bars
- Auto bottom-padding for mobile navigation (pb-20)
- Smooth transitions on show/hide

**Usage:**

```tsx
import { MobileViewContainer } from '../components/Layout';

<MobileViewContainer
  visible={activeView === 'settings'}
  enablePadding={true}
>
  <div className="space-y-4">
    {/* Settings content */}
  </div>
</MobileViewContainer>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | required | Whether view is currently active |
| `children` | `ReactNode` | required | View content |
| `className` | `string` | `''` | Additional CSS classes |
| `enablePadding` | `boolean` | `true` | Enable bottom padding for nav |

---

### 4. MobileNavigation

Enhanced mobile navigation with configurable tabs and haptic feedback.

**Features:**
- Configurable tab definitions via props
- Haptic feedback via Vibration API
- Minimum 44px touch targets
- Safe-area-inset support
- Backward compatible with JamSession

**Usage:**

```tsx
import { MobileNavigation } from '../components/Layout';
import { Music, Users, Settings } from 'lucide-react';

// Using default tabs (backward compatible)
<MobileNavigation
  activeView={activeView}
  onViewChange={setActiveView}
  userCount={users.length}
/>

// Custom tabs
const customTabs = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'library', icon: Library, label: 'Library', badge: 5 },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

<MobileNavigation
  activeView={activeView}
  onViewChange={setActiveView}
  tabs={customTabs}
  enableHaptics={true}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activeView` | `string` | required | Currently active view |
| `onViewChange` | `(view: any) => void` | required | Callback when view changes |
| `tabs` | `NavTab[]` | default tabs | Custom tab configuration |
| `userCount` | `number` | - | User count for badge (backward compat) |
| `mode` | `'sticky' \| 'overlay'` | `'sticky'` | Navigation positioning mode |
| `enableHaptics` | `boolean` | `true` | Enable haptic feedback |

---

## Best Practices

### When to Use Tab-Based Layout

Use tab-based layouts (with MobileNavigation) when:
- Multiple distinct views need equal prominence
- User needs to switch between views frequently
- Each view is self-contained with its own content
- Example: Jam Session (Drums, Users, Settings)

### When to Use Collapsible Panels

Use collapsible panels when:
- Controls are complex but don't need separate views
- Want to save vertical space on mobile
- Controls are used occasionally, not constantly
- Example: Advanced audio settings, filter controls

### Touch Target Guidelines

All interactive elements **must** meet 44px minimum touch targets:

```tsx
// ✅ Good - explicit minimum
<button className="min-w-[44px] min-h-[44px] p-2">

// ✅ Good - padding ensures minimum
<button className="px-4 py-3">  // Results in >44px height

// ❌ Bad - too small
<button className="p-1">
```

### Safe Area Insets

Always account for iOS notches and Android gesture bars:

```tsx
// Using inline styles (for dynamic calculations)
<div style={{
  paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
}}>

// Using Tailwind (for static spacing)
<div className="pb-safe-bottom">  // If configured in tailwind.config.js
```

### Responsive Breakpoints

Follow Tailwind's default breakpoints:

| Breakpoint | Min Width | Use Case |
|------------|-----------|----------|
| `sm:` | 640px | Large phones (landscape) |
| `md:` | 768px | Tablets (portrait) |
| `lg:` | 1024px | Tablets (landscape), small laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large desktops |

**Mobile threshold**: `< 768px` (md breakpoint)

---

## Examples

### Example 1: Mobile Settings Panel with Collapsibles

```tsx
import { MobileViewContainer, CollapsiblePanel } from '../components/Layout';

<MobileViewContainer visible={activeView === 'settings'}>
  <div className="space-y-4">
    <CollapsiblePanel title="Audio Settings" defaultOpen={true}>
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm text-gray-400">Input Device</span>
          <select className="w-full mt-1 px-3 py-2 bg-gray-700 rounded">
            <option>Default Microphone</option>
          </select>
        </label>
        {/* More audio controls */}
      </div>
    </CollapsiblePanel>

    <CollapsiblePanel title="WLED Settings" defaultOpen={false}>
      {/* WLED controls */}
    </CollapsiblePanel>
  </div>
</MobileViewContainer>
```

### Example 2: Responsive Control Toolbar

```tsx
import { ResponsiveToolbar } from '../components/Layout';
import { Play, Pause, Square, SkipBack, SkipForward } from 'lucide-react';

const transportControls: ToolbarItem[] = [
  { id: 'skip-back', label: 'Previous', icon: SkipBack, onClick: handlePrevious },
  { id: 'play', label: isPlaying ? 'Pause' : 'Play',
    icon: isPlaying ? Pause : Play, onClick: togglePlay },
  { id: 'stop', label: 'Stop', icon: Square, onClick: handleStop },
  { id: 'skip-forward', label: 'Next', icon: SkipForward, onClick: handleNext },
];

<ResponsiveToolbar
  items={transportControls}
  orientation="horizontal"
  className="justify-center"
/>
```

### Example 3: Complete Mobile Layout

```tsx
import {
  ResponsiveContainer,
  MobileNavigation,
  MobileViewContainer,
  CollapsiblePanel
} from '../components/Layout';

function MobileApp() {
  const [activeView, setActiveView] = useState('main');

  return (
    <ResponsiveContainer>
      {/* Main view */}
      <MobileViewContainer visible={activeView === 'main'}>
        <h1>Main Content</h1>
      </MobileViewContainer>

      {/* Settings view */}
      <MobileViewContainer visible={activeView === 'settings'}>
        <CollapsiblePanel title="Preferences">
          {/* Settings */}
        </CollapsiblePanel>
      </MobileViewContainer>

      {/* Mobile navigation */}
      <MobileNavigation
        activeView={activeView}
        onViewChange={setActiveView}
      />
    </ResponsiveContainer>
  );
}
```

---

## Accessibility

All responsive components follow accessibility best practices:

- **ARIA attributes**: `aria-expanded`, `aria-controls`, `aria-hidden`, `aria-label`
- **Keyboard navigation**: All interactive elements are keyboard accessible
- **Screen readers**: Proper semantic HTML and ARIA labels
- **Focus indicators**: Clear focus rings on all interactive elements
- **Touch targets**: Minimum 44px × 44px for all touch targets

---

## Performance

### Mobile Optimization

- Use `min-h-[44px]` instead of fixed heights for flexibility
- Leverage Tailwind's JIT for minimal CSS bundle
- Use CSS transforms for animations (GPU accelerated)
- Debounce resize events in ResponsiveToolbar (handled internally)

### Animation Performance

```tsx
// ✅ Good - GPU accelerated
<div className="transition-transform duration-300">

// ✅ Good - Composited properties
<div className="transition-opacity duration-200">

// ❌ Avoid - Layout thrashing
<div className="transition-all">  // Only when necessary
```

---

**Last Updated**: 2025-10-09
**Version**: 1.0
