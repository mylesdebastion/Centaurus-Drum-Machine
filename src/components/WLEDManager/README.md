# WLEDManager - Current WLED Architecture

**Epic 18 - Intelligent WLED Visualization Routing**

## Component Structure

This directory contains the **current WLED management system** used in the `/wled-manager` route.

### Key Components

- **WLEDManager.tsx** - Main manager view (route: `/wled-manager`)
- **DeviceCard.tsx** - Device configuration card with inline editing
- **RoutingStatusDisplay.tsx** - Shows current routing assignments
- **index.ts** - Barrel exports

### Integration Points

- **Services:**
  - `WLEDDeviceRegistry` - Device CRUD operations and persistence
  - `VisualizationRoutingMatrix` - Intelligent routing algorithm
  - `LEDCompositor` - Frame blending and output

- **Virtual Preview:**
  - Uses `WLEDVirtualPreview` from `src/components/WLED/` (shared component)
  - Story 18.8 integrated live compositor events

## ⚠️ Important: Legacy vs Current

**Current (Epic 18):**
- `src/components/WLEDManager/` ← **Use this for new features**
- Route: `/wled-manager`
- Architecture: Service-based (registry, routing matrix, compositor)

**Legacy (Epic 6):**
- `src/components/WLED/WLEDDeviceManager.tsx` ← **Deprecated, used only in GuitarFretboard**
- Architecture: Component-local state with WebSocket bridge
- Do not add new features here

## Story Development Guidelines

When working on WLED stories:

1. **Check the route first**: If story mentions `/wled-manager`, use `src/components/WLEDManager/`
2. **Read this README**: Confirms you're in the right place
3. **Explicit file paths**: Stories should specify exact file paths to modify
4. **Ask if unclear**: Better to clarify than implement in wrong component

## Related Documentation

- Epic 18 Architecture: `docs/architecture/wled-visualization-routing.md`
- User Guide: `docs/guides/wled-manager-user-guide.md`
- Routing System: `docs/guides/wled-routing-system.md`
