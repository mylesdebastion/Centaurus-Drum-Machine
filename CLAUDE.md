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
- **Component Classes**: `/src/index.css` - Reusable Tailwind component utilities
- **Color System**: `tailwind.config.js` - Custom primary/accent color scales
- **Component Architecture**: `/docs/architecture/component-architecture.md`

### Quality Checklist
Before implementing any UI component:
- [ ] Reviewed similar existing components for patterns
- [ ] Searched shadcn/ui registry for relevant components and examples
- [ ] Using established color tokens (primary-600, gray-700, etc.)
- [ ] Applied consistent border radius (rounded-lg)
- [ ] Included proper hover states and transitions
- [ ] Tested on mobile, tablet, and desktop breakpoints
- [ ] Used Lucide React icons only
- [ ] Extended existing component classes where applicable

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