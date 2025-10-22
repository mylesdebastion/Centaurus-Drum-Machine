# Admin Settings Startup Architecture

**Last Updated:** 2025-10-20
**Status:** Planning
**Owner:** Dev Team

---

## Overview

This document defines how authenticated users ("admins") will have their personalized settings automatically applied on app startup, creating a consistent experience across devices and sessions.

### Business Value

**For Anonymous Users:**
- Continue using localStorage for settings (existing behavior)
- Zero friction - no account required
- Settings persist within single browser/device

**For Authenticated Users:**
- Settings sync across all devices
- Settings persist indefinitely (Supabase cloud storage)
- Seamless transition from anonymous → authenticated (migrate localStorage settings)
- Professional experience: "My workspace follows me everywhere"

### Use Cases

1. **Music Educator Workshop** (Primary motivation):
   - Educator opens app on school laptop
   - Automatically loads:
     - 6 WLED tube configurations (IP addresses, colors, layout)
     - Preferred tempo (60 BPM for beginners)
     - Workshop patterns (simple/callResponse/fullBeat)
     - Audio settings (no metronome click during demos)
   - **Zero setup time** - just login and start teaching

2. **Pro User Multi-Device**:
   - Producer works on studio desktop (APC40 controller)
   - Saves custom controller mapping to cloud
   - Opens app on laptop at gig venue
   - Automatically loads controller mapping when APC40 connected
   - Same workflow, different device

3. **Jam Session Host**:
   - User frequently hosts jam sessions
   - Preferred settings:
     - Default tempo: 120 BPM
     - Default key: C major
     - WLED visualization: "Spectrum" mode
     - Audio input: Line-in (not microphone)
   - Opens `/jam` → settings auto-applied before session starts

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────┐
│  React Frontend (Client)                                 │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  App.tsx (Startup Sequence)                        │ │
│  │  1. Check auth status (useAuth)                    │ │
│  │  2. If authenticated → Load settings from Supabase │ │
│  │  3. If anonymous → Load settings from localStorage │ │
│  │  4. Apply settings to GlobalMusicContext           │ │
│  │  5. Render routes                                  │ │
│  └────────────────────────────────────────────────────┘ │
│            ↓                                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  useSettings Hook                                   │ │
│  │  - loadUserSettings(userId)                        │ │
│  │  - saveUserSettings(userId, settings)              │ │
│  │  - migrateLocalStorageSettings(userId)             │ │
│  └────────────────────────────────────────────────────┘ │
│            ↓                                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  SettingsService                                    │ │
│  │  - Fetch from Supabase (authenticated)             │ │
│  │  - Fallback to localStorage (anonymous/offline)    │ │
│  │  - Debounced auto-save (30s after changes)         │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
            ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────┐
│  Supabase (Backend)                                      │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  user_settings Table (PostgreSQL + RLS)            │ │
│  │  - user_id (FK → auth.users)                       │ │
│  │  - settings_category (e.g., "wled", "audio", "ui") │ │
│  │  - settings_data (JSONB)                           │ │
│  │  - updated_at (timestamp)                          │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**Startup Flow (Authenticated User):**
```
1. App.tsx renders
   └→ useAuth() checks session
      └→ User authenticated ✓
         └→ useSettings(user.id) called
            └→ Fetch settings from Supabase:
               SELECT * FROM user_settings WHERE user_id = :userId
               └→ Settings retrieved (JSONB)
                  └→ Apply to GlobalMusicContext
                     └→ Components render with user settings

Total latency: 200-300ms (parallel with initial render)
```

**Startup Flow (Anonymous User):**
```
1. App.tsx renders
   └→ useAuth() checks session
      └→ User anonymous
         └→ useSettings(null) called
            └→ Load from localStorage:
               - wled-devices
               - global-tempo
               - global-key
               - ui-preferences
            └→ Apply to GlobalMusicContext
               └→ Components render with local settings

Total latency: <10ms (synchronous localStorage read)
```

**Save Flow (Auto-save on Change):**
```
User changes tempo (120 → 140 BPM)
   └→ GlobalMusicContext.setTempo(140)
      └→ useSettings detects change
         └→ Debounce timer starts (30s)
            └→ After 30s of no changes:
               └→ If authenticated:
                  └→ Upsert to Supabase:
                     INSERT INTO user_settings (user_id, category, data)
                     VALUES (:userId, 'audio', '{"tempo": 140}')
                     ON CONFLICT (user_id, category) DO UPDATE
               └→ If anonymous:
                  └→ Save to localStorage:
                     localStorage.setItem('global-tempo', '140')
```

### Settings Categories

Settings are organized into categories for efficient loading and RLS policies:

| Category | Description | Example Data | Size Estimate |
|----------|-------------|--------------|---------------|
| `wled` | WLED device registry and visualization preferences | `{ devices: [...], defaultMode: "spectrum" }` | 1-5 KB |
| `audio` | Audio engine preferences | `{ tempo: 120, key: "C", scale: "major", metronomeEnabled: false }` | <1 KB |
| `hardware` | Controller mappings and hardware config | `{ apc40: { brightness: 0.8, colorMode: "rainbow" } }` | 2-10 KB |
| `ui` | UI preferences | `{ theme: "dark", compactMode: false, showTooltips: true }` | <1 KB |
| `jam` | Jam session defaults | `{ defaultRoomSize: 4, audioInputDevice: "line-in" }` | <1 KB |
| `license` | Pro tier settings (read-only from license manager) | `{ tier: "pro", expiresAt: "2025-12-31", features: [...] }` | <1 KB |

**Total Storage per User:** ~5-20 KB (well within Supabase free tier)

---

## Database Schema

### user_settings Table

```sql
-- Migration: 003_create_user_settings.sql

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings_category TEXT NOT NULL,
  settings_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one settings record per category per user
  UNIQUE(user_id, settings_category)
);

-- RLS Policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can view own settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own settings
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete own settings
CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_category ON user_settings(user_id, settings_category);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function (if not exists from previous migrations)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### TypeScript Interfaces

```typescript
// src/types/settings.ts

export type SettingsCategory =
  | 'wled'
  | 'audio'
  | 'hardware'
  | 'ui'
  | 'jam'
  | 'license';

export interface UserSettings {
  id: string;
  user_id: string;
  settings_category: SettingsCategory;
  settings_data: Record<string, unknown>; // JSONB data
  created_at: string;
  updated_at: string;
}

// Category-specific interfaces for type safety
export interface WLEDSettings {
  devices: Array<{
    id: string;
    ipAddress: string;
    name: string;
    enabled: boolean;
    color: string;
    ledCount: number;
  }>;
  defaultVisualizationMode: 'spectrum' | 'waveform' | 'matrix';
  defaultBrightness: number; // 0-1
}

export interface AudioSettings {
  tempo: number; // BPM
  key: string; // e.g., "C", "D", "Eb"
  scale: string; // e.g., "major", "minor", "pentatonic"
  metronomeEnabled: boolean;
  metronomeVolume: number; // 0-1
  masterVolume: number; // 0-1
}

export interface HardwareSettings {
  apc40?: {
    brightness: number; // 0-1
    colorMode: 'rainbow' | 'track-based' | 'velocity';
    buttonMapping: Record<string, string>;
  };
  // Future: launchpad, mpk-mini, etc.
}

export interface UISettings {
  theme: 'dark' | 'light'; // Currently only dark supported
  compactMode: boolean;
  showTooltips: boolean;
  defaultView: 'drum-machine' | 'jam-session' | 'studio';
}

export interface JamSettings {
  defaultRoomSize: number; // Max participants
  audioInputDevice: 'microphone' | 'line-in';
  defaultUsername: string; // Fallback if profile.username missing
  autoJoinLastSession: boolean;
}

export interface LicenseSettings {
  tier: 'free' | 'pro';
  expiresAt: string | null; // ISO timestamp
  features: string[]; // Feature flags enabled
  hardwareUnlocked: string[]; // Controller names
}

// Unified settings object (for GlobalMusicContext)
export interface AllUserSettings {
  wled?: WLEDSettings;
  audio?: AudioSettings;
  hardware?: HardwareSettings;
  ui?: UISettings;
  jam?: JamSettings;
  license?: LicenseSettings;
}
```

---

## Implementation Plan

### Phase 1: Database + Service Layer (Epic 7 Extension)

**New Story 7.10: User Settings Persistence**
- Create `user_settings` table migration
- Implement `SettingsService` class
- Create `useSettings` hook
- Add settings sync to `GlobalMusicContext`

**Acceptance Criteria:**
- Settings saved to Supabase for authenticated users
- Settings loaded on app startup
- Debounced auto-save (30s after last change)
- Offline fallback (localStorage)
- Anonymous users continue using localStorage

**Time Estimate:** 4-6 hours

---

### Phase 2: Settings Migration + UI (Epic 18 Extension)

**New Story 18.11: Settings Migration on Authentication**
- Migrate localStorage settings when user signs up
- Show "Settings Synced" notification after migration
- Add "Reset to Defaults" button in Settings panel

**Acceptance Criteria:**
- localStorage settings automatically migrated to Supabase on first sign-in
- User sees confirmation: "Your settings are now synced across devices"
- Settings reset button clears Supabase data and reloads defaults

**Time Estimate:** 2-3 hours

---

### Phase 3: License Integration (Epic 3 Extension)

**New Story 10.7: License Settings Auto-Load**
- Load Pro tier settings on app startup
- Auto-unlock hardware controllers based on license
- Show "Pro features enabled" notification

**Acceptance Criteria:**
- Pro users see enabled features immediately on startup
- Hardware controllers auto-unlock when connected (if licensed)
- License expiry shows warning 7 days before expiration

**Time Estimate:** 3-4 hours

---

## Service Layer Implementation

### useSettings Hook

```typescript
// src/hooks/useSettings.ts

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { SettingsService } from '@/services/SettingsService';
import { AllUserSettings } from '@/types/settings';

export function useSettings() {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<AllUserSettings>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load settings on auth state change
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);

      if (isAuthenticated && user) {
        // Load from Supabase
        const cloudSettings = await SettingsService.loadFromSupabase(user.id);
        setSettings(cloudSettings);
      } else {
        // Load from localStorage
        const localSettings = SettingsService.loadFromLocalStorage();
        setSettings(localSettings);
      }

      setLoading(false);
    }

    loadSettings();
  }, [user, isAuthenticated]);

  // Debounced save function
  const saveSettings = useDebouncedCallback(
    async (category: SettingsCategory, data: Record<string, unknown>) => {
      setSyncing(true);

      if (isAuthenticated && user) {
        await SettingsService.saveToSupabase(user.id, category, data);
      } else {
        SettingsService.saveToLocalStorage(category, data);
      }

      setSyncing(false);
    },
    30000 // 30 seconds debounce
  );

  // Migrate localStorage → Supabase on first sign-in
  const migrateSettings = async () => {
    if (!user) return;

    const localSettings = SettingsService.loadFromLocalStorage();
    await SettingsService.migrateToSupabase(user.id, localSettings);

    // Clear localStorage after successful migration
    SettingsService.clearLocalStorage();
  };

  return {
    settings,
    loading,
    syncing,
    saveSettings,
    migrateSettings,
  };
}
```

### SettingsService Class

```typescript
// src/services/SettingsService.ts

import { supabase } from '@/lib/supabase';
import {
  SettingsCategory,
  AllUserSettings,
  UserSettings
} from '@/types/settings';

export class SettingsService {
  // Load all settings from Supabase
  static async loadFromSupabase(userId: string): Promise<AllUserSettings> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to load settings from Supabase:', error);
      return this.getDefaultSettings();
    }

    // Transform array of settings into unified object
    const settingsMap: AllUserSettings = {};
    data?.forEach((row: UserSettings) => {
      settingsMap[row.settings_category] = row.settings_data;
    });

    return settingsMap;
  }

  // Save specific settings category to Supabase
  static async saveToSupabase(
    userId: string,
    category: SettingsCategory,
    data: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings_category: category,
        settings_data: data,
      }, {
        onConflict: 'user_id,settings_category'
      });

    if (error) {
      console.error(`Failed to save ${category} settings:`, error);
    }
  }

  // Load settings from localStorage
  static loadFromLocalStorage(): AllUserSettings {
    const settings: AllUserSettings = {};

    try {
      // Load WLED settings
      const wledDevices = localStorage.getItem('wled-devices');
      if (wledDevices) {
        settings.wled = JSON.parse(wledDevices);
      }

      // Load audio settings
      const tempo = localStorage.getItem('global-tempo');
      const key = localStorage.getItem('global-key');
      if (tempo || key) {
        settings.audio = {
          tempo: tempo ? parseInt(tempo) : 120,
          key: key || 'C',
          scale: localStorage.getItem('global-scale') || 'major',
          metronomeEnabled: localStorage.getItem('metronome-enabled') === 'true',
          metronomeVolume: 0.5,
          masterVolume: 1.0,
        };
      }

      // Load UI settings
      const showTooltips = localStorage.getItem('show-tooltips');
      if (showTooltips !== null) {
        settings.ui = {
          theme: 'dark',
          compactMode: false,
          showTooltips: showTooltips === 'true',
          defaultView: 'drum-machine',
        };
      }

      // Load jam settings
      const jamUsername = localStorage.getItem('jam-username');
      if (jamUsername) {
        settings.jam = {
          defaultRoomSize: 4,
          audioInputDevice: 'microphone',
          defaultUsername: jamUsername,
          autoJoinLastSession: false,
        };
      }

    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }

    return settings;
  }

  // Save settings to localStorage
  static saveToLocalStorage(
    category: SettingsCategory,
    data: Record<string, unknown>
  ): void {
    try {
      if (category === 'wled') {
        localStorage.setItem('wled-devices', JSON.stringify(data));
      } else if (category === 'audio') {
        localStorage.setItem('global-tempo', String(data.tempo));
        localStorage.setItem('global-key', String(data.key));
        localStorage.setItem('global-scale', String(data.scale));
        localStorage.setItem('metronome-enabled', String(data.metronomeEnabled));
      } else if (category === 'ui') {
        localStorage.setItem('show-tooltips', String(data.showTooltips));
      } else if (category === 'jam') {
        localStorage.setItem('jam-username', String(data.defaultUsername));
      }
    } catch (error) {
      console.error(`Failed to save ${category} settings to localStorage:`, error);
    }
  }

  // Migrate localStorage → Supabase
  static async migrateToSupabase(
    userId: string,
    localSettings: AllUserSettings
  ): Promise<void> {
    const categories = Object.keys(localSettings) as SettingsCategory[];

    for (const category of categories) {
      const data = localSettings[category];
      if (data) {
        await this.saveToSupabase(userId, category, data);
      }
    }
  }

  // Clear localStorage (after migration)
  static clearLocalStorage(): void {
    const keysToRemove = [
      'wled-devices',
      'global-tempo',
      'global-key',
      'global-scale',
      'metronome-enabled',
      'show-tooltips',
      // Keep jam-username for backward compatibility
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Get default settings
  static getDefaultSettings(): AllUserSettings {
    return {
      audio: {
        tempo: 120,
        key: 'C',
        scale: 'major',
        metronomeEnabled: false,
        metronomeVolume: 0.5,
        masterVolume: 1.0,
      },
      ui: {
        theme: 'dark',
        compactMode: false,
        showTooltips: true,
        defaultView: 'drum-machine',
      },
      jam: {
        defaultRoomSize: 4,
        audioInputDevice: 'microphone',
        defaultUsername: '',
        autoJoinLastSession: false,
      },
    };
  }
}
```

---

## GlobalMusicContext Integration

```typescript
// src/contexts/GlobalMusicContext.tsx

import { useSettings } from '@/hooks/useSettings';

export interface GlobalMusicState {
  // ... existing fields (tempo, key, scale, etc.)

  // NEW: Settings state
  settings: AllUserSettings;
  settingsLoading: boolean;
  settingsSyncing: boolean;

  // NEW: Settings actions
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  updateWLEDSettings: (settings: Partial<WLEDSettings>) => void;
  updateUISettings: (settings: Partial<UISettings>) => void;
  updateJamSettings: (settings: Partial<JamSettings>) => void;
  resetSettings: () => void;
}

export const GlobalMusicProvider: React.FC = ({ children }) => {
  const auth = useAuth();
  const { settings, loading, syncing, saveSettings } = useSettings();

  // Apply settings to state on load
  useEffect(() => {
    if (!loading && settings.audio) {
      setTempo(settings.audio.tempo);
      setKey(settings.audio.key);
      setScale(settings.audio.scale);
    }
  }, [loading, settings]);

  // Update audio settings
  const updateAudioSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    const updatedSettings = { ...settings.audio, ...newSettings };
    saveSettings('audio', updatedSettings);

    // Apply to state immediately (optimistic update)
    if (newSettings.tempo) setTempo(newSettings.tempo);
    if (newSettings.key) setKey(newSettings.key);
    if (newSettings.scale) setScale(newSettings.scale);
  }, [settings, saveSettings]);

  // Reset all settings to defaults
  const resetSettings = useCallback(async () => {
    if (auth.isAuthenticated && auth.user) {
      // Delete all settings from Supabase
      await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', auth.user.id);
    } else {
      // Clear localStorage
      SettingsService.clearLocalStorage();
    }

    // Reload defaults
    window.location.reload();
  }, [auth]);

  const contextValue = useMemo(() => ({
    // ... existing state
    settings,
    settingsLoading: loading,
    settingsSyncing: syncing,
    updateAudioSettings,
    updateWLEDSettings,
    updateUISettings,
    updateJamSettings,
    resetSettings,
  }), [
    // ... existing deps
    settings,
    loading,
    syncing,
  ]);

  return (
    <GlobalMusicContext.Provider value={contextValue}>
      {children}
    </GlobalMusicContext.Provider>
  );
};
```

---

## Startup Sequence

### App.tsx Initialization

```typescript
// src/App.tsx

export const App: React.FC = () => {
  return (
    <GlobalMusicProvider>
      <AppRoutes />
    </GlobalMusicProvider>
  );
};

// GlobalMusicProvider handles startup sequence:
// 1. useAuth() → Check authentication status
// 2. useSettings(user) → Load settings (Supabase or localStorage)
// 3. Apply settings to state (tempo, key, scale, etc.)
// 4. Render child components with applied settings
```

**Total Startup Latency:**
- **Anonymous Users:** <10ms (localStorage read, synchronous)
- **Authenticated Users:** 200-300ms (Supabase fetch, parallel with initial render)

**Loading UX:**
- Show skeleton screens during settings load
- Display "Loading your workspace..." message if >500ms
- Never block rendering - show defaults immediately, then hydrate with user settings

---

## Testing Strategy

### Manual Verification Steps

**Test 1: Anonymous User Settings**
1. Open app in incognito mode (no auth)
2. Change tempo to 140 BPM
3. Change key to "D"
4. Reload page
5. **Expected:** Tempo = 140, Key = D (loaded from localStorage)

**Test 2: Authenticated User Settings**
1. Sign in with test account
2. Change tempo to 160 BPM
3. Change WLED brightness to 0.5
4. Wait 30 seconds (auto-save)
5. Check Supabase database:
   ```sql
   SELECT * FROM user_settings WHERE user_id = '<user-id>';
   ```
6. **Expected:** Audio settings with tempo=160, WLED settings with brightness=0.5

**Test 3: Settings Sync Across Devices**
1. Sign in on Device A
2. Change tempo to 100 BPM
3. Wait 30 seconds (auto-save)
4. Sign in on Device B (same account)
5. **Expected:** Tempo automatically set to 100 BPM on Device B

**Test 4: Anonymous → Authenticated Migration**
1. Use app anonymously, set tempo to 130 BPM
2. Verify saved to localStorage
3. Sign up for account
4. **Expected:** Tempo remains 130 BPM (migrated to Supabase)
5. Check database: tempo = 130 in user_settings

**Test 5: Offline Mode Fallback**
1. Sign in (authenticated)
2. Disconnect network
3. Change tempo to 150 BPM
4. Reload page (still offline)
5. **Expected:** Tempo remains 150 (saved to localStorage as fallback)
6. Reconnect network
7. **Expected:** Settings sync to Supabase automatically

**Test 6: Reset Settings**
1. Sign in, change multiple settings
2. Click "Reset to Defaults" in Settings panel
3. **Expected:** All settings revert to defaults, Supabase data deleted

---

## Integration with Existing Features

### WLED Devices (Story 18.1)
```typescript
// When user adds WLED device
const addWLEDDevice = (device: WLEDDevice) => {
  const updatedDevices = [...settings.wled.devices, device];
  updateWLEDSettings({ devices: updatedDevices });
  // Auto-saves to Supabase after 30s
};
```

### Hardware Controllers (Epic 3)
```typescript
// When user connects APC40
const onAPC40Connected = () => {
  if (settings.hardware?.apc40) {
    // Load saved button mapping
    APC40Service.applyMapping(settings.hardware.apc40.buttonMapping);
  }
};
```

### Jam Session (Epic 7)
```typescript
// When user creates jam session
const createJamSession = () => {
  const username = auth.profile?.username || settings.jam?.defaultUsername || 'Guest';
  const roomSize = settings.jam?.defaultRoomSize || 4;

  // Create session with user preferences
  JamSessionService.create({ username, maxParticipants: roomSize });
};
```

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading by Category**
   - Only load settings categories when needed
   - Example: Load `hardware` settings only when controller connected
   - Reduces initial payload size

2. **Debounced Auto-Save**
   - 30-second debounce prevents excessive Supabase writes
   - Batch multiple changes into single upsert
   - Free tier: 2M messages/month = ~66K writes/day (plenty of headroom)

3. **Optimistic UI Updates**
   - Apply settings changes immediately to state
   - Save to backend asynchronously
   - Rollback only if save fails

4. **Offline-First Architecture**
   - Always save to localStorage as backup
   - Sync to Supabase when online
   - Seamless offline → online transition

### Cost Analysis

**Supabase Free Tier:**
- 500 MB database storage
- 2 million Realtime messages/month

**Settings Storage per User:** ~5-20 KB
**Max Users on Free Tier:** 500 MB / 20 KB = **25,000 users**

**Monthly Writes Estimate:**
- Average user: 10 setting changes/day
- 1,000 active users × 10 changes/day × 30 days = 300,000 writes/month
- **Well within 2M message limit**

---

## Security Considerations

### RLS Policies

**Enforce strict user isolation:**
```sql
-- Users can ONLY access own settings
CREATE POLICY "Users can only access own settings"
  ON user_settings
  FOR ALL
  USING (auth.uid() = user_id);
```

**Prevent malicious data injection:**
```typescript
// Validate settings before saving
function validateSettings(category: SettingsCategory, data: unknown): boolean {
  // Type validation
  if (category === 'audio') {
    const audio = data as AudioSettings;
    if (audio.tempo < 40 || audio.tempo > 300) return false;
    if (!['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(audio.key[0])) return false;
  }

  // Size validation (prevent storage abuse)
  const jsonSize = JSON.stringify(data).length;
  if (jsonSize > 100000) return false; // Max 100 KB per category

  return true;
}
```

### License Settings Protection

```sql
-- License settings are READ-ONLY for users
CREATE POLICY "Users can only read license settings"
  ON user_settings
  FOR SELECT
  USING (
    auth.uid() = user_id AND
    settings_category = 'license'
  );

-- Only license service can write license settings
-- (Enforce via service-level auth, not RLS)
```

---

## Rollout Plan

### Phase 1: Core Infrastructure (Week 1)
- ✅ Create `user_settings` table + RLS
- ✅ Implement `SettingsService` + `useSettings` hook
- ✅ Add settings state to `GlobalMusicContext`
- ✅ Test with audio settings only (tempo, key, scale)

### Phase 2: Settings Migration (Week 2)
- ✅ Build migration logic (localStorage → Supabase)
- ✅ Add "Settings Synced" notification
- ✅ Test anonymous → authenticated flow

### Phase 3: Feature Integration (Week 3)
- ✅ Integrate with WLED Manager (Story 18.1)
- ✅ Integrate with Jam Session (Epic 7)
- ✅ Add Settings panel with Reset button

### Phase 4: License + Hardware (Week 4)
- ✅ Integrate with License Manager (Epic 3)
- ✅ Auto-unlock hardware based on license
- ✅ Test multi-device sync

---

## Success Metrics

**Technical:**
- Settings load time <300ms (authenticated users)
- Auto-save success rate >99%
- Zero data loss during migration
- RLS policies 100% effective (no cross-user access)

**User Experience:**
- 80%+ of authenticated users enable auto-sync
- <1% of users click "Reset to Defaults" (settings work as expected)
- Zero user reports of lost settings
- 90%+ satisfaction with "settings follow me everywhere" UX

---

## Future Enhancements

1. **Settings Import/Export**
   - Download settings as JSON file
   - Import settings from file (backup/restore)
   - Share settings with other users (presets)

2. **Settings History**
   - Track settings changes over time
   - Rollback to previous settings version
   - "Undo" button for accidental changes

3. **Multi-Profile Support**
   - "Work" vs "Home" vs "Performance" profiles
   - Quick-switch between profiles
   - Per-device profiles

4. **Settings Presets (Community)**
   - Share settings configurations publicly
   - Browse community presets
   - One-click apply preset

---

## References

- **Epic 7:** Jam Session Backend (Supabase infrastructure)
- **Epic 18:** Intelligent WLED Routing (Story 18.0 - Auth foundation)
- **Epic 3:** Multi-Controller Pro Monetization (License integration)
- **Story 18.0:** Low-Friction User Authentication (user_profiles table)
- **Supabase JSONB Docs:** https://supabase.com/docs/guides/database/json

---

**Document Owner:** Dev Team
**Last Review:** 2025-10-20
**Status:** Ready for Story Creation
