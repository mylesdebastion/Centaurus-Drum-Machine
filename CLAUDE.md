# Claude Code Development Guidelines

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

### Port Configuration (`strictPort: true`)

This project uses **strict port enforcement** in `vite.config.ts`:
- **Fixed port**: 5173 (always)
- **strictPort: true** - Vite will **fail** if port 5173 is busy instead of auto-selecting a new port
- **Why**: Prevents confusion from multiple dev servers running on different ports

### When Dev Server Fails to Start

**IMPORTANT**: `npm run dev` has **no built-in stop command**. There is no `npm stop` or `npm run dev:stop`. The only ways to stop a Vite dev server are:
- **Interactive**: Press Ctrl+C in the terminal
- **Programmatic**: Kill the Node.js process via OS commands

If you see an error like:
```
Port 5173 is already in use
```

**Follow this reliable process:**

#### Windows (Recommended Method)
```bash
# One-liner: Find PID, kill it, wait, then start server
powershell -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }" && timeout /t 2 /nobreak >nul && npm run dev
```

**Or step-by-step:**
```bash
# 1. Find and kill process on port 5173
powershell -Command "Get-NetTCPConnection -LocalPort 5173 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"

# 2. Wait 2 seconds
timeout /t 2 /nobreak

# 3. Start dev server
npm run dev
```

#### Linux/Mac
```bash
# One-liner: Kill process and start server
kill -9 $(lsof -ti:5173) 2>/dev/null; sleep 2; npm run dev
```

**Or step-by-step:**
```bash
# 1. Find and kill process
kill -9 $(lsof -ti:5173)

# 2. Wait 2 seconds
sleep 2

# 3. Start dev server
npm run dev
```

### Development Workflow Guidelines

**CRITICAL**: Before starting a new dev server:
- **Always check** if a server is already running on port 5173
- **Never** start multiple dev servers on different ports
- **Always kill** previous dev server processes before starting a new one
- **Use the same port** (5173) for consistency across sessions

**Preferred approach when making code changes:**
- Let Vite's HMR (Hot Module Replacement) handle updates automatically
- Only restart the server if HMR fails or config changes are made
- Check running processes before starting a new dev session

**IMPORTANT for Claude Code users:**
- When using background Bash shells, the shell ID ≠ the actual Node.js/Vite process PID
- Killing a background shell does NOT kill the underlying dev server process
- Always kill the process by PORT (5173) not by shell ID
- Use the PowerShell/lsof commands above to target the actual process

**Best Practice - Restart Script:**
Create a helper script to make restarts reliable:

```bash
# restart-dev.bat (Windows)
@echo off
echo Killing any process on port 5173...
powershell -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"
timeout /t 2 /nobreak >nul
echo Starting dev server...
npm run dev
```

```bash
# restart-dev.sh (Linux/Mac)
#!/bin/bash
echo "Killing any process on port 5173..."
kill -9 $(lsof -ti:5173) 2>/dev/null
sleep 2
echo "Starting dev server..."
npm run dev
```