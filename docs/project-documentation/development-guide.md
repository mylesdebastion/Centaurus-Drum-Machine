# Development Guide

**Project:** Centaurus Drum Machine
**Generated:** 2026-01-02

---

## Quick Start

### Prerequisites

- **Node.js:** 22.21.0 or higher
- **npm:** 10.x or higher
- **Git:** Latest version
- **Modern browser:** Chrome, Firefox, Safari, or Edge (HTTPS required for MIDI)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/mylesdebastion/Centaurus-Drum-Machine.git
cd Centaurus-Drum-Machine

# Install dependencies
npm install

# Start development server
npm run dev
```

**Development server:** http://localhost:5173

---

## Environment Configuration

### Required Environment Variables

Create `.env` file in project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get Supabase credentials:**
1. Log in to [supabase.com](https://supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy "Project URL" and "anon/public key"

### Optional Configuration

```bash
# Analytics (Vercel)
VITE_VERCEL_ANALYTICS_ID=your-analytics-id

# Custom API endpoints (if needed)
VITE_API_BASE_URL=https://api.example.com
```

---

## Development Commands

### Core Commands

```bash
# Start dev server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type check (no emit)
npm run type-check
```

### Git Hooks

This project uses `.githooks` for pre-commit checks:

```bash
# Install git hooks
git config core.hooksPath .githooks

# Hooks run automatically on commit:
# - TypeScript compilation check
# - ESLint
# - Prettier formatting
```

---

## Development Server

### Configuration

**File:** `vite.config.ts`

```typescript
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,  // Fail if port already in use
    host: true,        // Listen on all addresses
    open: false        // Don't auto-open browser
  }
});
```

### Hot Module Replacement (HMR)

Vite automatically reloads changes:
- **Component changes:** Fast refresh (preserves state)
- **CSS changes:** Instant update (no reload)
- **Config changes:** Require manual restart

**Troubleshooting HMR:**
- If changes don't reflect, check browser console for errors
- Clear browser cache if needed
- Restart dev server for vite.config.ts changes

### Port Already in Use

If you see "Port 5173 is already in use":

**Option 1:** Server is already running (check http://localhost:5173)

**Option 2:** Kill existing process (see `docs/dev-server-troubleshooting.md`)

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9
```

---

## File Structure

```
centaurus-drum-machine/
├── public/               # Static assets
├── src/
│   ├── components/      # React components (24 categories)
│   ├── contexts/        # React contexts (global state)
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── hardware/        # Hardware abstraction layer
│   ├── lib/             # Third-party integrations
│   ├── capabilities/    # Module capability declarations
│   ├── index.css        # Global styles + Tailwind
│   ├── App.tsx          # App entry point
│   └── main.tsx         # React DOM mount
├── docs/                # Project documentation (200+ files)
├── _bmad/               # BMAD workflow system
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS config
├── tsconfig.json        # TypeScript config
└── package.json         # Dependencies + scripts
```

---

## TypeScript Configuration

### Compiler Options

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Path Aliases:**
```typescript
// Use @/ instead of ../../
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
```

### Handling Unused Variables

**Project uses strict TypeScript:**
- `noUnusedLocals: true` - Unused variables are build errors

**Solutions:**
1. **Underscore prefix** (work-in-progress code):
   ```typescript
   const [_midiNotes, setMidiNotes] = useState<MIDINote[]>([]);
   ```

2. **Comment out** (early-stage features):
   ```typescript
   // const [midiNotes, setMidiNotes] = useState<MIDINote[]>([]);
   // TODO: Integrate with frequency visualizer per story 4.1
   ```

3. **Complete implementation** (if feature is ready)

**See CLAUDE.md for full guidelines**

---

## Build and Deployment

### Production Build

```bash
# Build for production
npm run build

# Output: dist/ directory
# - Minified JavaScript
# - Optimized CSS
# - Hashed filenames for cache busting
```

### Build Optimization

**Automatic optimizations:**
- Tree-shaking (removes unused code)
- Code splitting (lazy load routes)
- Asset minification
- Gzip compression

**Bundle size analysis:**
```bash
npm run build -- --mode analyze
```

### Deployment (Vercel)

**Production:** jam.audiolux.app
**Preview:** dev-jam.audiolux.app

**Deploy process:**
1. Push to `main` branch → Production deployment
2. Push to `dev` branch → Preview deployment
3. Pull requests → Automatic preview URLs

**Vercel configuration:**
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

**Environment variables:**
- Set in Vercel dashboard → Settings → Environment Variables
- Same keys as `.env` file (VITE_SUPABASE_URL, etc.)

---

## Testing

### Manual Testing Approach

**Project philosophy:** Manual testing with human-in-the-loop

**Testing workflow:**
1. **Browser DevTools** - Console, Network, Performance tabs
2. **Visual inspection** - Module behavior across views
3. **Audio verification** - Sound quality and timing
4. **MIDI testing** - Hardware controller integration
5. **WLED testing** - LED visualization with physical devices

### Unit Tests (Vitest)

**Limited automated tests** - Used for critical utility functions only

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test file location:**
```
src/contexts/__tests__/GlobalMusicContext.test.tsx
src/utils/__tests__/colorMapping.test.ts
```

### End-to-End Tests (Playwright)

**Experimental** - Not actively maintained

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npm run test:e2e
```

---

## Debugging

### Browser DevTools

**Recommended setup:**
1. **Console:** Check for errors/warnings
2. **Network:** Monitor API calls (Supabase, WLED)
3. **React DevTools:** Inspect component state
4. **Performance:** Profile rendering performance

### Common Issues

**1. MIDI not working:**
- Ensure HTTPS (localhost is OK)
- Check browser MIDI permissions
- Verify controller connected before page load

**2. WLED not connecting:**
- Verify device IP address
- Check network connectivity (same WiFi)
- Test device URL: `http://192.168.1.100/json/info`

**3. Supabase errors:**
- Check environment variables
- Verify API keys in `.env`
- Check browser console for auth errors

**4. Audio not playing:**
- Click anywhere on page first (iOS Safari user gesture)
- Check browser audio permissions
- Verify Tone.js Transport is started

---

## Code Style and Conventions

### TypeScript

```typescript
// ✅ GOOD - Explicit types
interface Props {
  title: string;
  onClose: () => void;
}

export const MyComponent: React.FC<Props> = ({ title, onClose }) => {
  const [count, setCount] = useState<number>(0);
  return <div>{title}: {count}</div>;
};

// ❌ BAD - Implicit any
export const MyComponent = (props) => {
  const [count, setCount] = useState(0);
  return <div>{props.title}: {count}</div>;
};
```

### React Components

```tsx
// ✅ GOOD - Functional components with hooks
export const MyComponent: React.FC<Props> = ({ title }) => {
  const [state, setState] = useState(0);

  useEffect(() => {
    // Side effects here
  }, []);

  return <div>{title}</div>;
};

// ❌ BAD - Class components (not used in this project)
class MyComponent extends React.Component { ... }
```

### Tailwind CSS

```tsx
// ✅ GOOD - Utility classes
<button className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-4 py-2">
  Click me
</button>

// ✅ GOOD - Responsive classes
<div className="p-4 sm:p-6 md:p-8">
  <h1 className="text-2xl sm:text-3xl md:text-4xl">Title</h1>
</div>

// ❌ BAD - Inline styles (avoid)
<button style={{ backgroundColor: 'blue', color: 'white' }}>
  Click me
</button>
```

### File Naming

- **Components:** PascalCase (`DrumMachine.tsx`)
- **Utilities:** camelCase (`colorMapping.ts`)
- **Types:** camelCase (`wled.ts`)
- **Hooks:** camelCase with `use` prefix (`useAuth.ts`)

---

## Git Workflow

### Branch Strategy (Post-Cleanup)

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/my-feature

# Create pull request to dev
# After review, merge to dev
# After testing, merge dev to main
```

### Commit Message Format

**Follow conventional commits:**

```
feat: add MIDI recording feature
fix: resolve WLED connection timeout
docs: update API documentation
refactor: extract chord service
style: format code with Prettier
test: add GlobalMusicContext tests
chore: update dependencies
```

### Git Hooks

**Pre-commit checks:**
- TypeScript compilation
- ESLint validation
- Prettier formatting

**Skip hooks (not recommended):**
```bash
git commit --no-verify
```

---

## Troubleshooting

### TypeScript Errors

**"Cannot find module '@/components/...'"**
- Restart VS Code
- Check `tsconfig.json` path aliases
- Run `npm install` again

**"noUnusedLocals" errors:**
- Prefix with `_` for work-in-progress variables
- Comment out unused code
- See CLAUDE.md for full guidelines

### Build Errors

**"Port 5173 already in use":**
- Server already running (check http://localhost:5173)
- Kill process (see Dev Server section)

**"Out of memory" during build:**
```bash
# Increase Node memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Runtime Errors

**MIDI not detected:**
- HTTPS required (localhost is OK)
- Connect controller before loading page
- Check browser MIDI support

**WLED timeout:**
- Verify device IP
- Check network connectivity
- Test URL directly in browser

---

## Performance Optimization

### Vite Build Optimization

**Already configured:**
- Code splitting (automatic)
- Tree-shaking (removes unused code)
- Minification (Terser)
- Asset optimization

### React Performance

**Memoization:**
```typescript
// Memoize expensive computations
const memoizedValue = useMemo(() => {
  return expensiveComputation(a, b);
}, [a, b]);

// Memoize callbacks
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// Memoize components
export const MyComponent = React.memo(({ prop }) => {
  return <div>{prop}</div>;
});
```

---

## Resources

### Documentation

- **Project Docs:** `docs/` directory (200+ files)
- **CLAUDE.md:** Development guidelines for AI assistance
- **UX_STANDARDS.md:** Design system guidelines
- **GIT_HOUSEKEEPING.md:** Branch cleanup guide

### External Resources

- **React:** https://react.dev
- **Vite:** https://vitejs.dev
- **Tailwind CSS:** https://tailwindcss.com
- **Tone.js:** https://tonejs.github.io
- **Supabase:** https://supabase.com/docs
- **WLED:** https://kno.wled.ge

---

## Support

**Issues:** https://github.com/mylesdebastion/Centaurus-Drum-Machine/issues

**For AI assistance:** See CLAUDE.md for project-specific guidelines

---

## Summary

**Quick Start:** `npm install && npm run dev`
**Dev Server:** http://localhost:5173 (port 5173, fixed)
**Build:** `npm run build` → `dist/`
**Deploy:** Push to `main` → Vercel auto-deploys
**Testing:** Manual browser-based testing (see CLAUDE.md)
**TypeScript:** Strict mode enabled (no unused variables)
**Styling:** Tailwind CSS utility classes
**State:** React Context API + localStorage
