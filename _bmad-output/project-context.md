---
project_name: 'Centaurus-Drum-Machine'
user_name: 'Myles'
date: '2026-01-02'
sections_completed: ['technology_stack', 'language_specific', 'framework_specific', 'testing', 'code_quality', 'workflow', 'critical_rules']
existing_patterns_found: 13
status: 'complete'
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

**Core Stack:**
- React 18.2.0 (functional components with hooks only)
- TypeScript 5.2.2 (strict mode enabled)
- Vite 5.0.8 (dev server: localhost:5173, strictPort enabled)

**Audio/Music:**
- Tone.js 15.1.22 (audio synthesis, scheduling)
- Web MIDI API (hardware controllers)
- Web Audio API (frequency analysis)

**Backend:**
- Supabase 2.75.0 (auth, realtime, database)

**UI/Styling:**
- Tailwind CSS 3.3.6 (@layer components pattern)
- Lucide React 0.294.0 (exclusive icon system)
- shadcn/ui (via MCP server, not npm package)

**Path Aliases:**
- `@/*` → `./src/*` (configured in tsconfig.json and vite.config.ts)

---

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

**Strict Mode Enforcement:**
- `noUnusedLocals: true` - Unused variables break the build
- `noUnusedParameters: true` - Unused params break the build
- **Solution:** Prefix unused variables with underscore: `_variableName`

**Unused Variable Pattern (CRITICAL):**
```typescript
// ✅ Work-in-progress - use underscore prefix
const [_midiNotes, setMidiNotes] = useState<MIDINote[]>([]);

// ✅ Early-stage - comment out with TODO
// const [midiNotes, setMidiNotes] = useState<MIDINote[]>([]);
// TODO: Integrate with visualizer per story 4.1

// ❌ NEVER remove without checking /docs/stories/ for planned features
```

**Import Rules:**
- Use `@/*` path alias for all src imports
- Named exports only for utilities (no default exports)
- Import directly from source files (avoid barrel exports)

**File Tool Operations (CRITICAL):**
- Edit/Write/Read tools MUST use relative paths from project root
- Never use absolute paths (`D:\Github\...` breaks string matching)
- Example: `Edit("src/components/Foo.tsx", ...)` ✅
- Example: `Edit("D:\\Github\\...\\Foo.tsx", ...)` ❌

---

### Framework-Specific Rules (React)

**Component Architecture:**
- Functional components ONLY (no class components)
- React hooks required (useState, useEffect, useCallback, etc.)
- File naming: PascalCase for components (`MyComponent.tsx`)

**ViewTemplate Pattern (CRITICAL - see CLAUDE.md for full guide):**
- **Simple experiments** → `ViewTemplate` variant="centered" maxWidth="4xl"
- **Visualizers/canvas** → `ViewTemplate` variant="full-width" maxWidth="7xl"
- **Collaborative features** → `ResponsiveContainer` + `Header` + `MobileNavigation`
- **Always use `ViewCard`** instead of manual `<div className="bg-gray-800...">` cards

**UI/Styling Requirements:**
- Tailwind CSS ONLY (no inline styles, no CSS modules)
- Extend existing component classes from `/src/index.css` (@layer components)
- Lucide React for ALL icons (exclusive icon system)
- Search shadcn/ui MCP server before creating custom components

**Responsive Design:**
- Mobile-first: base styles, then `sm:`, `md:`, `lg:` breakpoints
- Touch targets: 44px minimum for interactive elements
- Test all breakpoints: mobile (375px), tablet (768px), desktop (1280px)

**State Management:**
- Local state: `useState` for component-specific state
- Global music state: `GlobalMusicContext` (key, scale, tempo, transport)
- Supabase realtime: For collaborative jam session features

**Performance Patterns:**
- High-FPS canvas: Use refs + direct DOM manipulation (not React re-renders)
- Audio scheduling: Tone.js scheduler ONLY (never setTimeout for audio timing)
- React.memo(): Only use when measured performance issue exists

---

### Testing Rules

**Testing Philosophy (CRITICAL):**
- **Manual browser testing ONLY** - No automated test requirements
- Vitest/Playwright configured but NOT actively used
- Quality verified through browser DevTools and user testing
- Audio/visual features tested by ear and eye

**BMAD Workflow Testing Pattern:**
- Stories include "Verification Checklist" not "Test Coverage %"
- Dev Agent Records document manual testing performed
- **Manual testing MAY be deferred to real-world usage**
- Architecture docs use "Manual Verification Steps"

**Story Completion Without Automated Tests (CRITICAL):**
When implementing BMAD dev-story workflows:
1. Complete all code implementation tasks
2. Mark story status → **"review"** (allows sprint to proceed)
3. Document: "Manual testing deferred to real-world usage"
4. If bugs found later → reopen story or create follow-up
5. This is VALID and ACCEPTABLE per project testing philosophy

**Quality Assurance:**
- Test in browser at localhost:5173 (dev server assumed running)
- Test responsive breakpoints: mobile (375px), tablet (768px), desktop (1280px)
- Verify audio/visual behavior manually
- Test hardware integration when devices available (MIDI, WLED)

**Test Infrastructure (Available but Optional):**
- Unit tests: `npm test` (Vitest) - Can use if desired
- E2E tests: Playwright configured - Can use if desired
- Coverage: 80% threshold configured but not enforced

---

### Code Quality & Style Rules

**Linting:**
- Run `npm run lint` before commits
- ESLint max warnings: 0 (warnings break build)
- TypeScript ESLint enforced (no `any` types without justification)

**File Organization:**
- Components: `src/components/` (PascalCase.tsx)
- Utilities: `src/utils/` (camelCase.ts)
- Types: `src/types/` (PascalCase types)
- Hardware: `src/hardware/` (MIDI, WLED integration)

**Naming Conventions:**
- Components: PascalCase (`MyComponent.tsx`)
- Utilities: camelCase (`audioEngine.ts`)
- Types: PascalCase (`MIDINote`, `VisualizerSettings`)
- CSS classes: kebab-case (`btn-primary`, `track-row`)
- Constants: SCREAMING_SNAKE_CASE (`DEFAULT_TEMPO`)

**Documentation Rules:**
- **Avoid unnecessary comments** - Code should be self-documenting
- Only comment when logic isn't self-evident
- NO emojis unless user explicitly requests
- NO docstrings/JSDoc unless public API
- Don't add comments to code you didn't change

**Code Organization:**
- Define reusable styles in `/src/index.css` (@layer components)
- Extend existing patterns: `.btn-primary`, `.step-button`, `.track-row`
- NO inline styles - Tailwind utilities only
- NO CSS modules - Use @layer components pattern

---

### Development Workflow Rules

**Dev Server Management (CRITICAL):**
- **Always assume** dev server running at localhost:5173
- Port 5173 fixed (strictPort: true in vite.config.ts)
- **HMR enabled** - Changes auto-reflect, DON'T restart server
- Only start/restart if: connection errors or config file changes
- If "port already in use" → server IS running, no action needed

**Git Workflow:**
- Active branch: `dev` (development work)
- Main branch: `main` (for PRs)
- Branch housekeeping deferred (see CLAUDE.md for details)

**BMAD Workflow Integration:**
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Story files: `docs/stories/*.md`
- Story progression: backlog → ready-for-dev → in-progress → review → done
- **"review" status unblocks sprint** (code complete, testing deferred)

**Development Flow:**
1. Run `/bmad:bmm:workflows:sprint-status` to see next story
2. Run `/bmad:bmm:workflows:dev-story` to implement
3. Mark story "review" when code complete (manual testing optional)
4. Continue to next story (sprint proceeds)

**Key Principles:**
- Trust HMR - avoid server restarts
- Manual testing can be deferred to real-world usage
- Story "review" status = implementation complete, sprint unblocked

---

### Critical Don't-Miss Rules

**Anti-Patterns (NEVER DO THESE):**

❌ **Over-engineering:**
- Don't add features beyond what's requested
- Don't refactor code you're not working on
- Don't create abstractions for one-time use
- Keep solutions simple and focused

❌ **File operations:**
- NEVER write files without reading them first
- NEVER remove code to fix TypeScript errors without checking `/docs/stories/`
- NEVER use absolute paths with Edit/Write/Read tools

❌ **Audio timing:**
- NEVER use `setTimeout`/`setInterval` for audio
- NEVER trigger audio without user gesture
- ✅ Use Tone.js scheduler for ALL musical timing

❌ **Dev server:**
- NEVER restart server unnecessarily
- ✅ Trust HMR for updates

**Edge Cases to Handle:**

**Hardware Integration:**
- MIDI/WLED devices may not be connected (graceful degradation)
- WLED requires Chrome local network access permission
- Features must work without physical hardware

**Audio Context:**
- Requires user gesture to start (suspended state by default)
- Check `Tone.getContext().state` before playing
- Handle "suspended" → "running" transition

**Global Patterns:**
- `window.frequencySourceManager` exposed by LiveAudioVisualizer
- Always check existence: `(window as any).frequencySourceManager`

**WLED Integration Complexity (CRITICAL):**

⚠️ **Multiple Communication Methods Exist:**
- WLED/ESP32 device communication is COMPLEX with several approaches
- Extensive testing has been done with various workarounds
- **BEFORE implementing WLED features:** Check existing patterns in codebase
- **ASK user which method to use** if unclear from context

**Known Challenges:**
- Bridge-less direct browser-to-WLED communication (challenging)
- Local network configuration complexity
- ESP32 device setup variations
- Chrome local network access permissions

**Architectural Direction:**
- **Moving TOWARD:** Global controls/layers/protocols for WLED
- **Moving AWAY FROM:** Unique per-view WLED implementations
- **Check before implementing:** Is there a global layer for this?
- **Don't create new per-view patterns** - extend global system

**Safe Approach When Working on WLED Tasks:**
1. Read existing WLED integration code first
2. Identify which communication method is currently in use
3. Check for global WLED managers/services
4. **If uncertain about approach → ASK user before implementing**
5. Don't assume one method - multiple workarounds exist

**Key Files to Check:**
- WLED manager components (global control layer)
- Hardware integration patterns
- Existing device communication utilities

**Performance Patterns:**

**Canvas Rendering (60fps):**
- Use `requestAnimationFrame`, NOT React re-renders
- Direct DOM manipulation via refs
- Don't update React state in animation loop

**Audio Timing:**
- Tone.js Transport for precise scheduling
- Schedule ahead, don't trigger in realtime
- JavaScript timers are NOT accurate enough for music

**React Performance:**
- Avoid creating functions/objects in render
- Use `useCallback`/`useMemo` for expensive operations
- Minimize re-renders in high-frequency components

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Ask user for clarification on WLED implementation approach
- Update this file if new patterns emerge

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review periodically for outdated rules
- Remove rules that become obvious over time
- See CLAUDE.md for extended guidelines and examples

**Last Updated:** 2026-01-02
