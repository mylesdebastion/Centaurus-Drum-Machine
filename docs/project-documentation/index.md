# Project Documentation - Master Index

**Project:** Centaurus Drum Machine
**Generated:** 2026-01-02
**Documentation Type:** Deep Scan (BMAD document-project workflow)

---

## 📋 Quick Navigation

| Document | Description | Status |
|----------|-------------|--------|
| [Architecture Overview](./architecture-overview.md) | High-level system architecture and design patterns | ✅ Complete |
| [API Contracts](./api-contracts.md) | Versioned API interfaces and service contracts | ✅ Complete |
| [Data Models](./data-models.md) | TypeScript types and database schemas | ✅ Complete |
| [Component Inventory](./component-inventory.md) | UI component catalog (24 categories, 87 files) | ✅ Complete |
| [State Management](./state-management.md) | React Context patterns and persistence | ✅ Complete |
| [Development Guide](./development-guide.md) | Setup, build, test, and deploy | ✅ Complete |

---

## 🎯 Project Overview

**Centaurus Drum Machine** is a React-based web application for interactive music creation with hardware integration. The system combines traditional web audio synthesis (Tone.js) with hardware MIDI controllers and WLED LED visualizations, enabling both solo and collaborative music-making experiences.

**Key Features:**
- 🥁 Multi-track step sequencer (DrumMachine)
- 🎹 Piano roll MIDI sequencer
- 🎸 Interactive guitar fretboard with chord progressions
- 🎛️ Hardware MIDI controller integration (APC40, Launchpad Pro, Roli Lumi)
- 💡 WLED LED visualization routing (intelligent device assignment)
- 🎵 Real-time collaborative jam sessions (Supabase Realtime)
- 🏫 Educational workshop mode for music classrooms
- 🎨 Custom design system with Tailwind CSS

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| **Component Categories** | 24 |
| **Component Files** | 87 (TypeScript/TSX) |
| **Type Definition Files** | 15 |
| **Service Files** | 13 |
| **React Contexts** | 1 primary (GlobalMusicContext) |
| **API Contracts** | 6 (versioned v1) |
| **Existing Documentation Files** | 200+ markdown files |
| **Lines of TypeScript** | ~15,000+ (estimated) |

---

## 🏗️ Architecture at a Glance

**Type:** Monolith web application
**Pattern:** Component-based React with hardware abstraction layer
**State Management:** React Context API + localStorage
**Backend:** Supabase (Realtime + Auth + Postgres)
**Deployment:** Vercel Edge Network
**Testing:** Manual browser-based testing

**Technology Stack:**
- React 18.2.0 + TypeScript 5.2.2
- Vite 5.0.8 (build tool)
- Tailwind CSS 3.3.6 (styling)
- Tone.js 15.1.22 (audio synthesis)
- Supabase 2.75.0 (backend)
- Web MIDI API (hardware controllers)
- WLED HTTP/WebSocket (LED devices)

---

## 📖 Documentation Guide

### For New Developers

**Start here:**
1. [Development Guide](./development-guide.md) - Setup and quick start
2. [Architecture Overview](./architecture-overview.md) - Understand the system
3. [Component Inventory](./component-inventory.md) - Explore the codebase

### For Feature Development

**Planning a new feature:**
1. [API Contracts](./api-contracts.md) - Understand existing interfaces
2. [Data Models](./data-models.md) - Review TypeScript types
3. [State Management](./state-management.md) - Learn state patterns
4. [Component Inventory](./component-inventory.md) - Find reusable components

### For Integration Work

**Integrating hardware or external services:**
1. [API Contracts](./api-contracts.md) - Hardware abstraction layer
2. [Architecture Overview](./architecture-overview.md) - Integration patterns
3. [Data Models](./data-models.md) - Device capability models

---

## 🔑 Key Concepts

### 1. **Module System**

The project uses a **module adapter pattern** where musical components adapt to three execution contexts:

- **Standalone** (`/piano`, `/guitar-fretboard`) - Full local state and controls
- **Studio** (`/studio`) - Multi-module workspace with shared GlobalMusicContext
- **Jam** (`/jam`) - Collaborative mode with Supabase Realtime sync

**See:** [Architecture Overview - Module System](./architecture-overview.md#1-module-system-architecture)

### 2. **WLED Visualization Routing**

Intelligent LED device assignment based on:
- Device capabilities (1D strip vs 2D grid)
- Module priorities (exclusive, high, medium, low)
- Dimension preferences (guitar prefers 2D grids)
- Overlay compatibility (audio-reactive can overlay)

**See:** [Architecture Overview - WLED Routing](./architecture-overview.md#2-wled-visualization-routing)

### 3. **Versioned API Contracts**

All public interfaces follow semantic versioning (v1, v2, etc.) with:
- Type guards for runtime validation
- Migration helpers for upgrades
- Breaking change policy (no field removal)

**See:** [API Contracts - Versioning](./api-contracts.md#versioning-and-breaking-changes)

### 4. **Hybrid Storage Strategy**

- **Anonymous users:** localStorage (local only)
- **Authenticated users:** Supabase (synced across devices)
- **Auto-migration:** localStorage → Supabase on sign-in

**See:** [State Management - Persistence](./state-management.md#persistence-strategy)

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/mylesdebastion/Centaurus-Drum-Machine.git
cd Centaurus-Drum-Machine

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
EOF

# Start development server
npm run dev
```

**Open:** http://localhost:5173

**See:** [Development Guide - Quick Start](./development-guide.md#quick-start)

---

## 📚 Related Documentation

### In This Project

- **Project Root:**
  - `README.md` - Project introduction and overview
  - `CLAUDE.md` - Development guidelines for AI assistance
  - `VERCEL_SETUP.md` - Deployment configuration
  - `ENVIRONMENT_SETUP.md` - Environment variables guide

- **Architecture Docs:**
  - `docs/architecture/` - Detailed architecture documents (28 files)
  - `docs/architecture/tech-stack.md` - Technology decisions
  - `docs/architecture/component-architecture.md` - Component patterns
  - `docs/architecture/wled-visualization-routing.md` - LED routing system

- **Planning Docs:**
  - `docs/prd/` - Product requirements (7 files)
  - `docs/epics/` - Feature epics (22 files)
  - `docs/stories/` - Implementation stories (80+ files)

- **User Guides:**
  - `docs/guides/` - User-facing documentation
  - `docs/UX_STANDARDS.md` - Design system guidelines

### External Resources

- **React:** https://react.dev
- **Vite:** https://vitejs.dev
- **Tailwind CSS:** https://tailwindcss.com
- **Tone.js:** https://tonejs.github.io
- **Supabase:** https://supabase.com/docs
- **WLED:** https://kno.wled.ge

---

## 🔧 Common Tasks

### Adding a New Component

1. Create component file: `src/components/MyComponent/MyComponent.tsx`
2. Define props interface with TypeScript
3. Use ViewTemplate for consistent layout
4. Add to component inventory documentation

**See:** [Component Inventory - Component Patterns](./component-inventory.md#component-composition-patterns)

### Adding a New API Endpoint

1. Define versioned interface in `src/types/api-contracts.ts`
2. Add type guards for runtime validation
3. Update API_VERSION_REGISTRY
4. Document in API contracts

**See:** [API Contracts - Versioning](./api-contracts.md#versioning-and-breaking-changes)

### Adding a New Musical Module

1. Create module component in `src/components/Studio/modules/`
2. Implement module adapter pattern (standalone/studio/jam contexts)
3. Register in `moduleRegistry.ts`
4. Add visualization capability declaration

**See:** [Architecture Overview - Module System](./architecture-overview.md#1-module-system-architecture)

### Adding a New Data Model

1. Define TypeScript interface in appropriate `src/types/` file
2. Add database schema (if using Supabase)
3. Implement type guards
4. Document in data models

**See:** [Data Models](./data-models.md)

---

## 🐛 Troubleshooting

### Development Server Issues

**Port 5173 already in use:**
- Server may already be running (check http://localhost:5173)
- Kill process: See [Development Guide - Troubleshooting](./development-guide.md#port-already-in-use)

**HMR not working:**
- Check browser console for errors
- Restart dev server
- Clear browser cache

### MIDI Issues

**MIDI devices not detected:**
- HTTPS required (localhost is OK)
- Connect controller before loading page
- Check browser MIDI permissions

**See:** [Development Guide - Debugging](./development-guide.md#debugging)

### WLED Issues

**WLED device not connecting:**
- Verify device IP address
- Check network connectivity (same WiFi)
- Test device URL: `http://192.168.1.100/json/info`

**See:** [API Contracts - WLED Device Registry](./api-contracts.md#wled-device-registry-service)

---

## 📝 Documentation Maintenance

### Updating Documentation

**When to update:**
- ✅ New component added
- ✅ New API contract created
- ✅ New data model defined
- ✅ Architecture changes
- ✅ Breaking changes

**How to update:**
1. Edit relevant markdown file in `docs/project-documentation/`
2. Update version/date at top of file
3. Add entry to changelog (if major change)
4. Regenerate index if structure changes

### Regenerating Documentation

**To regenerate full documentation:**

```bash
# Run BMAD document-project workflow
/bmad:bmm:workflows:document-project
```

**Options:**
- Quick scan (~2-5 min) - Overview and tech stack
- Deep scan (~5-15 min) - Full analysis with code reading
- Exhaustive scan (~15-30 min) - Complete file-by-file analysis

**Last generated:** 2026-01-02 (Deep Scan)

---

## 🎓 Learning Path

### Beginner Path

1. **Setup:** [Development Guide - Quick Start](./development-guide.md#quick-start)
2. **Overview:** [Architecture Overview - Executive Summary](./architecture-overview.md#executive-summary)
3. **First Component:** [Component Inventory - ViewTemplate Usage](./component-inventory.md#component-composition-patterns)
4. **State Management:** [State Management - Usage Pattern](./state-management.md#usage-pattern)

### Intermediate Path

1. **Module System:** [Architecture Overview - Module System](./architecture-overview.md#1-module-system-architecture)
2. **API Contracts:** [API Contracts - Global Music State API](./api-contracts.md#1-global-music-state-api-v1)
3. **Data Flow:** [Architecture Overview - Data Flow Architecture](./architecture-overview.md#data-flow-architecture)
4. **WLED Integration:** [Architecture Overview - WLED Routing](./architecture-overview.md#2-wled-visualization-routing)

### Advanced Path

1. **Hardware Abstraction:** [API Contracts - Hardware Abstraction](./api-contracts.md#3-hardware-abstraction-api-v1)
2. **Real-time Collaboration:** [Architecture Overview - Collaboration Architecture](./architecture-overview.md#real-time-collaboration-architecture)
3. **Visualization Routing:** [Data Models - Visualization Routing](./data-models.md#visualization-routing-models)
4. **Performance Optimization:** [Development Guide - Performance](./development-guide.md#performance-optimization)

---

## 📞 Support

**GitHub Issues:** https://github.com/mylesdebastion/Centaurus-Drum-Machine/issues

**For AI assistance:** See `CLAUDE.md` for project-specific guidelines

**Deployment:** Vercel (jam.audiolux.app)

---

## ✅ Documentation Completeness

**Generated Files:**
- ✅ `architecture-overview.md` - System architecture and patterns
- ✅ `api-contracts.md` - Versioned API interfaces (6 contracts)
- ✅ `data-models.md` - TypeScript types (15 type files)
- ✅ `component-inventory.md` - UI components (24 categories, 87 files)
- ✅ `state-management.md` - React Context patterns
- ✅ `development-guide.md` - Setup and workflow
- ✅ `index.md` - This master index

**Coverage:**
- ✅ API contracts documented
- ✅ Data models cataloged
- ✅ Components inventoried
- ✅ State management explained
- ✅ Architecture patterns described
- ✅ Development workflow documented
- ✅ Deployment process outlined
- ✅ Troubleshooting guides included

**Scan Level:** Deep Scan (read critical directories, batch processed)

---

## 🔄 Next Steps

**For new developers:**
1. Read [Development Guide](./development-guide.md)
2. Set up local environment
3. Explore [Component Inventory](./component-inventory.md)
4. Review existing [Architecture Docs](../architecture/)

**For feature development:**
1. Review [API Contracts](./api-contracts.md)
2. Check [Data Models](./data-models.md)
3. Study [State Management](./state-management.md)
4. Plan using existing [Epic](../epics/) patterns

**For documentation:**
1. Keep this documentation updated
2. Add new components to inventory
3. Document new API contracts
4. Update architecture for major changes

---

*This documentation was generated using the BMAD document-project workflow (deep scan mode). For questions or updates, see the troubleshooting section or create a GitHub issue.*
