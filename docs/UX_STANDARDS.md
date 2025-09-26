# UX Standards - Audiolux Jam Session

## Purpose
This document establishes consistent design patterns and styling standards across the Audiolux Jam Session application to ensure a cohesive user experience.

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

## Implementation Guidelines

### Before Adding New Components
1. **Check existing patterns** - Use established button/container styles
2. **Follow border radius hierarchy** - `rounded-lg` for most cases
3. **Use consistent color palette** - Stick to defined status colors
4. **Apply proper spacing** - Use standard padding/gap patterns

### Code Review Checklist
- [ ] Border radius follows standards (`rounded-lg` for buttons)
- [ ] Color scheme uses established palette
- [ ] Hover states implemented with transitions
- [ ] Responsive breakpoints considered
- [ ] Consistent spacing patterns used
- [ ] Icon sizes appropriate for context

### Anti-Patterns to Avoid
- ❌ Mixing `rounded-full` with `rounded-lg` in similar contexts
- ❌ Inconsistent button padding across similar components
- ❌ Missing hover states on interactive elements
- ❌ Using custom colors outside established palette
- ❌ Forgetting transition animations on state changes

## Maintenance

This document should be updated when:
- New component patterns are established
- Color palette changes are made
- Breaking changes to styling standards occur
- Major design system updates happen

**Last Updated**: 2025-09-25
**Version**: 1.0
**Applies to**: All UI components in Audiolux Jam Session