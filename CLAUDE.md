# Claude Code Development Guidelines

## Project Scale & Testing Philosophy

**Scale:** Small-to-medium creative coding project (5 interactive modules, solo developer/small team)

**Testing Approach:**
- **Manual testing** with human-in-the-loop verification (NOT automated test suites)
- Browser DevTools for debugging and performance monitoring
- Visual/audio inspection of module behavior across views
- Git history + Dev Agent Records as implementation verification

**What We DON'T Use:**
- ❌ Automated unit test frameworks (Vitest, Jest, etc.)
- ❌ Integration test suites or E2E test frameworks
- ❌ Code coverage metrics or test coverage requirements
- ❌ CI/CD test pipelines
- ❌ Formal QA department sign-offs

**BMAD Workflow Adaptation:**
- Architecture documents include **"Manual Verification Steps"** not "Test Suites"
- Stories focus on **"Verification Checklist"** not "Test Coverage %"
- Dev Agent Records document **manual testing performed**, not tests written
- "Testing Strategy" sections describe **browser-based verification workflows**

**Quality Assurance:**
- Developer manually tests features in browser (localhost:5173)
- Audio/visual behavior verified by ear and eye
- Responsive design tested via browser DevTools (mobile/tablet/desktop)
- Hardware integration (MIDI/WLED) tested with physical devices when available

---

## UX Design Standards (bolt.new Template)

**Core Design Philosophy**: For all designs and UI components, make them **beautiful, not cookie cutter**. Create webpages and components that are **fully featured and worthy for production**.

### Technology Stack Requirements
- **JSX syntax with Tailwind CSS classes** (already configured)
- **React hooks** (functional components only)
- **Lucide React for icons** (consistent icon system)
- **shadcn/ui components** (accessible via MCP server for modern UI patterns)
- **Minimal external dependencies** (do not install UI themes, icon libraries, etc. unless absolutely necessary)

### Design Quality Standards
- **Production-ready from start** - No placeholder content or incomplete implementations
- **Beautiful and thoughtful** - Custom design decisions, not generic templates
- **Fully featured** - Complete functionality, proper error states, loading states
- **Consistent visual system** - Follow existing Tailwind component patterns

### Existing Project Integration
- **Use established component classes** from `/src/index.css` (@layer components)
- **Follow design tokens** from `tailwind.config.js` (primary/accent color scales)
- **Maintain border radius consistency** - use `rounded-lg` for interactive elements
- **Extend existing patterns** - build on `.btn-primary`, `.step-button`, `.track-row`, etc.
- **Responsive design** - follow mobile-first patterns with `sm:`, `md:`, `lg:` breakpoints

### Component Development Guidelines
1. **Review existing components** for established patterns before creating new ones
2. **Use shadcn/ui components** when appropriate - search for existing patterns and examples via MCP server
3. **Use Lucide React icons** exclusively (already imported)
4. **Follow Tailwind @layer components** approach for reusable styles
5. **Implement proper hover states** and transitions (`transition-colors`)
6. **Ensure accessibility** - proper contrast, touch targets (44px minimum)
7. **Test responsiveness** across all breakpoints

### File Locations for UX Reference
- **Design System**: `/docs/UX_STANDARDS.md` - Comprehensive design guidelines
- **View Templates**: `/src/components/Layout/ViewTemplate.tsx` - Reusable view/page templates
- **Component Classes**: `/src/index.css` - Reusable Tailwind component utilities
- **Color System**: `tailwind.config.js` - Custom primary/accent color scales
- **Component Architecture**: `/docs/architecture/component-architecture.md`

### Quality Checklist
Before implementing any UI component:
- [ ] Reviewed similar existing components for patterns
- [ ] **Used ViewTemplate for new views/pages** (see View Template Guidelines below)
- [ ] Searched shadcn/ui registry for relevant components and examples
- [ ] Using established color tokens (primary-600, gray-700, etc.)
- [ ] Applied consistent border radius (rounded-lg)
- [ ] Included proper hover states and transitions
- [ ] Tested on mobile, tablet, and desktop breakpoints
- [ ] Used Lucide React icons only
- [ ] Extended existing component classes where applicable

## View Template Guidelines

When creating new experiment views, module pages, or feature demonstrations, **always use the ViewTemplate component** instead of building custom layouts from scratch.

### Quick Decision Tree

**Creating a new view? Ask:**

1. **Does it have collaborative features** (session code, user list, real-time sync)?
   - ✅ YES → Use `ResponsiveContainer` + `Header` + `MobileNavigation` (JamSession pattern)
   - ❌ NO → Continue to step 2

2. **Is it a simple experiment/demo/settings page?**
   - ✅ YES → Use `ViewTemplate` with `variant="centered"` and `maxWidth="4xl"`
   - ❌ NO → Continue to step 3

3. **Is it a visualizer, canvas tool, or immersive experience?**
   - ✅ YES → Use `ViewTemplate` with `variant="full-width"` and `maxWidth="7xl"`
   - ❌ NO → Use `ViewTemplate` with appropriate variant

### ViewTemplate Import

```tsx
import { ViewTemplate, ViewCard } from '@/components/Layout/ViewTemplate';
```

### Pattern 1: Simple Experiment View

**Use for:** MIDI tests, hardware demos, simple experiments

```tsx
export const MyExperiment: React.FC<MyExperimentProps> = ({ onBack }) => {
  return (
    <ViewTemplate
      title="My Experiment"
      subtitle="Brief description of what this does"
      onBack={onBack}
      variant="centered"
      maxWidth="4xl"
      badge="Beta"
      badgeVariant="orange"
    >
      <ViewCard title="Setup">
        {/* Setup content */}
      </ViewCard>

      <ViewCard title="Results">
        {/* Results content */}
      </ViewCard>

      <ViewCard title="About">
        {/* Documentation */}
      </ViewCard>
    </ViewTemplate>
  );
};
```

**Key features:**
- Back button automatically positioned above title
- Centered content with max-width constraint
- Gradient background (gray-900 to gray-800)
- Consistent spacing between cards (space-y-6)

### Pattern 2: Full-Width Visualizer View

**Use for:** Piano roll, guitar fretboard, audio visualizers, canvas tools

```tsx
export const MyVisualizer: React.FC<MyVisualizerProps> = ({ onBack }) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <ViewTemplate
      title="My Visualizer"
      subtitle="Optional subtitle for context"
      onBack={onBack}
      variant="full-width"
      maxWidth="7xl"
      badge="Beta"
      badgeVariant="orange"
      headerActions={
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      }
    >
      <ViewCard title="Canvas Area" large>
        <div className="h-64 sm:h-80 md:h-96">
          <MyCanvas />
        </div>
      </ViewCard>

      {showSettings && (
        <CollapsiblePanel title="Settings" defaultOpen={true}>
          {/* Settings content */}
        </CollapsiblePanel>
      )}

      <ViewCard title="About This Visualizer">
        {/* Documentation */}
      </ViewCard>
    </ViewTemplate>
  );
};
```

**Key features:**
- Header bar with back (left), title (center), actions (right)
- Full-width layout with flex-column structure
- Larger content area (max-w-7xl)
- Optional header actions slot

### ViewCard Component

Use `ViewCard` instead of manually creating card divs:

```tsx
// ❌ DON'T - Manual card creation
<div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
  <h2 className="text-xl font-semibold text-white mb-4">Title</h2>
  {/* Content */}
</div>

// ✅ DO - Use ViewCard
<ViewCard title="Title">
  {/* Content */}
</ViewCard>

// ✅ DO - Use large variant for main features
<ViewCard title="Main Feature" large>
  {/* Content */}
</ViewCard>
```

### When NOT to Use ViewTemplate

**Don't use for:**
- Collaborative jam sessions → Use `ResponsiveContainer` + `Header`
- Welcome/landing pages → Custom layout
- Complex multi-tab layouts → Custom responsive layout with `MobileNavigation`
- Embedded components → Use component-specific patterns

### Responsive Design

ViewTemplate automatically handles:
- Mobile padding: `p-4`
- Desktop padding: `p-6`
- Touch targets: 44px minimum
- Text scaling: `text-2xl sm:text-3xl`
- Safe area insets for iOS notches

### Badge Usage

Use badges to communicate view status:

```tsx
badge="Beta"          badgeVariant="orange"   // Experimental features
badge="Experiment"    badgeVariant="blue"     // Prototype views
badge="Live"          badgeVariant="green"    // Production features
badge="New"           badgeVariant="primary"  // Recently added
```

### Max Width Selection

| View Type | maxWidth | Example |
|-----------|----------|---------|
| Simple experiments | `4xl` | MIDI Test, settings pages |
| Visualizers/canvas tools | `7xl` | Piano Roll, Audio Visualizer |
| Documentation/info | `2xl` | About pages, help screens |

### Migration Example

When updating existing views:

```tsx
// BEFORE - Custom layout
const MyView = ({ onBack }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack}>
        <ArrowLeft /> Back
      </button>
      <h1>My View</h1>
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        Content
      </div>
    </div>
  </div>
);

// AFTER - ViewTemplate
const MyView = ({ onBack }) => (
  <ViewTemplate
    title="My View"
    onBack={onBack}
    variant="centered"
    maxWidth="4xl"
  >
    <ViewCard>
      Content
    </ViewCard>
  </ViewTemplate>
);

## shadcn/ui Integration

### Available MCP Commands
- **Search components**: Use MCP server to find relevant UI patterns and examples
- **View examples**: Get complete implementation code with dependencies
- **Get install commands**: Obtain proper installation commands for components

### Workflow for New Components
1. **Search shadcn registry** for similar components or patterns
2. **Review examples** to understand implementation patterns
3. **Adapt to project conventions** - maintain existing design tokens and styles
4. **Integrate with existing patterns** - extend `.btn-primary`, `.track-row`, etc.

**Remember**: The original bolt.new code achieved high quality through systematic design thinking, comprehensive component patterns, and consistent visual hierarchies. All additions should maintain this same level of quality and consistency while leveraging modern UI patterns from shadcn/ui.

## TypeScript Error Handling

### Unused Variable Errors (`noUnusedLocals: true`)

This project enforces strict TypeScript settings including `noUnusedLocals: true`, which treats unused variables as **build-breaking errors**. When encountering unused variable errors:

**CRITICAL**: Never remove code/imports just to satisfy TypeScript errors without understanding the broader context. Always check:
1. Documentation in `/docs/stories/` for planned features
2. Related code that may use the import/variable in the future
3. Whether this is work-in-progress functionality

**Preferred Solutions (in order of preference):**

1. **Option 2 - Underscore Prefix (Preferred for active development)**
   - Use when functionality is partially implemented but variable isn't used yet
   - Signals intentional future use without breaking the build
   - Example: `const [_midiNotes, setMidiNotes] = useState<MIDINote[]>([]);`
   - Use case: State is being set but not yet consumed by components

2. **Option 3 - Comment Out (Preferred for early-stage features)**
   - Use when feature is planned but not yet actively being developed
   - Keeps code nearby for easy restoration
   - Use case: Commented code with "Reserved for future" or "TODO" notes

3. **Option 1 - Complete Implementation**
   - Only if the feature can be quickly integrated without scope creep
   - Ensure proper testing and documentation

**Examples:**

```typescript
// ✅ GOOD - Underscore prefix for work-in-progress
const [_midiNotes, setMidiNotes] = useState<MIDINote[]>([]); // Reserved for visualization integration

// ✅ GOOD - Comment out early-stage features
// const [midiNotes, setMidiNotes] = useState<MIDINote[]>([]);
// TODO: Integrate with frequency visualizer per story 4.1

// ❌ BAD - Removing imports/types without checking docs/stories
// Removed MIDINote import because it was unused
// (May break planned features documented in /docs/stories/)
```

**Before Fixing TypeScript Errors:**
1. Check `/docs/stories/` for feature documentation
2. Search codebase for related functionality
3. Verify if removal would break planned integrations
4. Choose appropriate fix strategy (underscore vs comment vs implement)

## Development Server Management

### Default Workflow Assumption

**IMPORTANT**: Assume the development server (`npm run dev`) is **already running** at the beginning of each coding session.

- **Port**: 5173 (fixed via `strictPort: true` in vite.config.ts)
- **HMR (Hot Module Replacement)**: Code changes are automatically reflected
- **Testing**: Assume the server is running when testing changes
- **Only start the server** if you encounter errors indicating it's not running

### When to Start/Restart the Server

**Start the server only if:**
1. You see "Connection refused" or similar errors when testing
2. You explicitly need to verify the server is running
3. Configuration files (vite.config.ts, package.json) were modified

**Preferred approach:**
- Let Vite's HMR handle updates automatically
- Avoid unnecessary server restarts
- Trust that changes will be reflected via HMR

### Troubleshooting: Port Already in Use

If you encounter `Port 5173 is already in use`, this means the server is actually already running. See the [Dev Server Troubleshooting Guide](./docs/dev-server-troubleshooting.md) for advanced restart/kill commands if absolutely necessary.

**Quick fix:**
- Check if the app is already accessible at `http://localhost:5173`
- If accessible, the "error" indicates the server is running - no action needed
- Only kill/restart if the running server is unresponsive or stuck