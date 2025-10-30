<!-- Powered by BMAD™ Core -->

# ux-interactive-review

Test interactive behaviors, user flows, and dynamic states using MCP Playwright browser automation. Validates click interactions, form submissions, hover states, keyboard navigation, and error handling.

## Inputs

```yaml
required:
  - story_id: '{epic}.{story}' # e.g., "22.1"
  - flow_url: 'URL path to test' # e.g., '/?v=m'
  - interaction_scenarios: 'List of interactions to test' # e.g., "click drum pad, change tempo, save pattern"
optional:
  - viewport: 'desktop|mobile' # Default: desktop (1920x1080)
  - test_errors: true # Test error states (invalid inputs, network failures)
```

## Purpose

Interactive testing validates that the UI responds correctly to user actions, catching issues that static analysis cannot detect:

**Tests:**
- Click interactions (buttons, links, drum pads, piano keys)
- Form inputs (text fields, dropdowns, sliders)
- Hover states (tooltips, hover effects, previews)
- Keyboard navigation (tab order, shortcuts, accessibility)
- Dialog handling (modals, alerts, confirmations)
- Network requests (API calls, loading states, error handling)
- State changes (tempo adjustments, pattern saves, mode switches)

## Key Difference from Visual/Persona Testing

| Aspect | Persona UX | Interactive Review |
|--------|-----------|-------------------|
| **Focus** | First impressions, emotions | Action → Result validation |
| **Method** | Screenshots + analysis | Live interaction + assertion |
| **Question** | "Does this feel right?" | "Does this work correctly?" |
| **Testing** | Static states | Dynamic behaviors |

---

## Prerequisites

**MCP Playwright Server**: Configured in `.mcp.json` (automatically available in Claude Code)

**Dev Server Running**: `npm run dev` at localhost:5173

**MCP Tools Available**:
- `mcp__playwright__browser_navigate` - Navigate to test URLs
- `mcp__playwright__browser_click` - Click buttons, links, interactive elements
- `mcp__playwright__browser_type` - Type into input fields
- `mcp__playwright__browser_fill_form` - Fill multiple form fields
- `mcp__playwright__browser_hover` - Trigger hover states
- `mcp__playwright__browser_press_key` - Test keyboard shortcuts
- `mcp__playwright__browser_handle_dialog` - Handle alerts/confirms
- `mcp__playwright__browser_wait_for` - Wait for elements/text
- `mcp__playwright__browser_network_requests` - Monitor API calls
- `mcp__playwright__browser_console_messages` - Check for errors during interaction

---

## Process

### Step 1: Navigate and Setup

#### 1A. Navigate to Flow URL

```
Use: mcp__playwright__browser_navigate
URL: http://localhost:5173{flow_url}
```

#### 1B. Set Viewport

```
Use: mcp__playwright__browser_resize
Desktop: width=1920, height=1080
Mobile: width=375, height=667
```

#### 1C. Capture Initial State

```
Use: mcp__playwright__browser_snapshot
Purpose: Baseline state before interactions

Use: mcp__playwright__browser_take_screenshot
filename: testing/persona-ux/screenshots/{story}-interactive/initial-state-{date}.png
```

---

### Step 2: Test Click Interactions

#### 2A. Identify Interactive Elements

From `browser_snapshot`, identify all clickable elements:
- Buttons (primary CTAs, navigation, controls)
- Links (navigation, help, documentation)
- Interactive components (drum pads, piano keys, step buttons)
- Toggles/switches (mute, solo, loop)

#### 2B. Test Each Interaction

For each interactive element:

```
Use: mcp__playwright__browser_click
element: "{Human-readable description}" (e.g., "Drum pad C1")
ref: "{Element reference from snapshot}"
```

**After each click:**

1. **Wait for response**:
   ```
   Use: mcp__playwright__browser_wait_for
   time: 0.5 # Wait for animations/state changes
   ```

2. **Check console for errors**:
   ```
   Use: mcp__playwright__browser_console_messages
   onlyErrors: true
   ```

3. **Capture new state**:
   ```
   Use: mcp__playwright__browser_snapshot
   Purpose: Verify state change occurred

   Use: mcp__playwright__browser_take_screenshot
   filename: testing/persona-ux/screenshots/{story}-interactive/after-{action}-{date}.png
   ```

#### 2C. Validate State Changes

**Check that:**
- [ ] Visual feedback occurs (button press animation, color change)
- [ ] State updates correctly (tempo display, pattern grid, active step)
- [ ] Sound plays (if applicable - check console for audio errors)
- [ ] No JavaScript errors in console
- [ ] Network requests complete successfully (check `browser_network_requests`)

**Example Test Case:**
```
Interaction: Click "Drum Pad - Kick"
Expected: Kick sound plays, pad animates, console shows no errors
Actual: {Describe what happened}
Result: PASS|FAIL
Issues: {List any problems}
```

---

### Step 3: Test Form Interactions

#### 3A. Identify Form Fields

From `browser_snapshot`, locate:
- Text inputs (pattern name, BPM input)
- Dropdowns/selects (scale selection, instrument picker)
- Sliders (volume, swing, tempo)
- Checkboxes (loop, metronome, auto-save)

#### 3B. Test Form Filling

**Single field test:**
```
Use: mcp__playwright__browser_type
element: "{Field description}" (e.g., "BPM input field")
ref: "{Element reference}"
text: "120"
```

**Multi-field test:**
```
Use: mcp__playwright__browser_fill_form
fields:
  - name: "Pattern name"
    type: "textbox"
    ref: "{reference}"
    value: "My First Beat"
  - name: "Tempo"
    type: "slider"
    ref: "{reference}"
    value: "120"
  - name: "Loop enabled"
    type: "checkbox"
    ref: "{reference}"
    value: "true"
```

#### 3C. Validate Form Behavior

**Check that:**
- [ ] Input accepts text correctly
- [ ] Validation works (invalid BPM rejected)
- [ ] Sliders update displayed values
- [ ] Checkboxes toggle correctly
- [ ] Form submission works (if applicable)
- [ ] Error messages appear for invalid inputs

**Test Invalid Inputs:**
```
Type: "999" into BPM field (if max is 300)
Expected: Error message "BPM must be between 60-300"
Actual: {Describe what happened}
```

---

### Step 4: Test Hover States

#### 4A. Identify Hoverable Elements

Elements with hover behaviors:
- Tooltips (help icons, info buttons)
- Previews (waveform preview, pattern preview)
- Menus (dropdown menus, context menus)
- Visual effects (button hover states, drum pad highlights)

#### 4B. Test Hover Interactions

```
Use: mcp__playwright__browser_hover
element: "{Element description}" (e.g., "Help icon next to BPM")
ref: "{Element reference}"
```

**After hover:**

1. **Wait for tooltip/effect**:
   ```
   Use: mcp__playwright__browser_wait_for
   text: "{Expected tooltip text}"
   ```

2. **Capture hover state**:
   ```
   Use: mcp__playwright__browser_take_screenshot
   filename: testing/persona-ux/screenshots/{story}-interactive/hover-{element}-{date}.png
   ```

#### 4C. Validate Hover Behavior

**Check that:**
- [ ] Tooltip appears within 500ms
- [ ] Tooltip content is helpful (not just repeating label)
- [ ] Visual feedback occurs (color change, border, shadow)
- [ ] Hover state persists while hovering
- [ ] Hover state clears when mouse leaves

---

### Step 5: Test Keyboard Navigation

#### 5A. Test Tab Order

```
Use: mcp__playwright__browser_press_key
key: "Tab"
```

**Repeat** and verify focus moves logically:
1. Primary CTA (Start/Continue)
2. Navigation elements
3. Form fields
4. Interactive controls (in logical order)

**Capture focus states:**
```
Use: mcp__playwright__browser_snapshot
Purpose: Verify focus visible and correct element

Use: mcp__playwright__browser_take_screenshot
filename: testing/persona-ux/screenshots/{story}-interactive/focus-state-{step}.png
```

#### 5B. Test Keyboard Shortcuts

**Common shortcuts to test:**
- `Space` - Play/pause
- `Arrow keys` - Navigate pattern grid
- `Enter` - Confirm/submit
- `Escape` - Close modals/cancel
- `Ctrl+Z` - Undo (if applicable)

**Example:**
```
Use: mcp__playwright__browser_press_key
key: "Space"

Expected: Playback starts/stops
Actual: {Describe what happened}
```

#### 5C. Validate Keyboard Accessibility

**Check that:**
- [ ] All interactive elements reachable via Tab
- [ ] Focus visible (outline, highlight)
- [ ] Focus order logical (top → bottom, left → right)
- [ ] Shortcuts documented (help text, tooltips)
- [ ] No keyboard traps (can Tab out of all containers)

---

### Step 6: Test Dialog Handling

#### 6A. Trigger Dialogs

Identify actions that open dialogs:
- Save pattern → Confirmation dialog
- Delete pattern → Confirmation dialog
- Leave with unsaved changes → Alert
- Error states → Error modal

**Example:**
```
Use: mcp__playwright__browser_click
element: "Save pattern button"
ref: "{reference}"
```

#### 6B. Handle Dialog

**Accept dialog:**
```
Use: mcp__playwright__browser_handle_dialog
accept: true
```

**Dismiss dialog:**
```
Use: mcp__playwright__browser_handle_dialog
accept: false
```

**Respond to prompt:**
```
Use: mcp__playwright__browser_handle_dialog
accept: true
promptText: "My Pattern Name"
```

#### 6C. Validate Dialog Behavior

**Check that:**
- [ ] Dialog appears with correct message
- [ ] Accept/Cancel actions work correctly
- [ ] Focus returns to trigger element after dismiss
- [ ] Keyboard navigation works (Tab, Enter, Escape)

---

### Step 7: Monitor Network Requests

#### 7A. Trigger Actions with Network Calls

Actions that make API calls:
- Save pattern
- Load pattern
- Export audio
- Fetch presets

**Before action:**
```
Use: mcp__playwright__browser_network_requests
Purpose: Get baseline request count
```

**Trigger action:**
```
Use: mcp__playwright__browser_click
element: "Save pattern"
ref: "{reference}"
```

**After action:**
```
Use: mcp__playwright__browser_network_requests
Purpose: Check for new requests, validate success
```

#### 7B. Validate Network Behavior

**Check that:**
- [ ] Requests complete successfully (status 200)
- [ ] Loading states appear during request
- [ ] Error handling works (simulate network failure if possible)
- [ ] No unexpected requests (leaked API calls)

---

### Step 8: Test Error States

#### 8A. Invalid Inputs

Test edge cases:
- Empty required fields
- Out-of-range values (BPM 0, BPM 999)
- Invalid characters in text fields
- Maximum length exceeded

**Example:**
```
Use: mcp__playwright__browser_type
element: "BPM input"
ref: "{reference}"
text: "0"

Expected: Error message "BPM must be at least 60"
Actual: {Capture screenshot, check console}
```

#### 8B. Network Failures

**Simulate by:**
- Disconnecting network (if possible)
- Testing offline mode
- Checking error handling in console logs

#### 8C. State Conflicts

Test scenarios:
- Clicking buttons rapidly (debouncing)
- Multiple simultaneous actions
- Undo/redo edge cases

---

### Step 9: Compile Findings

#### 9A. Create Gate YAML

```yaml
schema: 1
story: '{story}'
gate: PASS|CONCERNS|FAIL
reviewer: 'Quinn (QA) - Interactive Review'

interactive_review:
  viewport_tested: 'desktop (1920x1080)'
  scenarios_tested: X
  console_errors: X
  network_requests: X

  categories:
    click_interactions: PASS|CONCERNS|FAIL
    form_behavior: PASS|CONCERNS|FAIL
    hover_states: PASS|CONCERNS|FAIL
    keyboard_navigation: PASS|CONCERNS|FAIL
    dialog_handling: PASS|CONCERNS|FAIL
    network_calls: PASS|CONCERNS|FAIL
    error_handling: PASS|CONCERNS|FAIL

  top_issues:
    - severity: critical
      category: click_interactions
      description: "Drum pad click doesn't trigger sound"
      screenshot: "testing/persona-ux/screenshots/{story}-interactive/drum-pad-click-fail.png"
      console_error: "[ERROR] AudioContext not initialized"
      fix: "Initialize AudioContext on user interaction"
```

#### 9B. Create Markdown Report

**Save to:** `docs/qa/assessments/{epic}.{story}-interactive-{YYYYMMDD}.md`

```markdown
# Interactive Testing Review - Story {epic}.{story}

Date: {date}
Reviewer: Quinn (Test Architect)
Viewport: {viewport}

## Executive Summary

- **Gate Decision**: PASS|CONCERNS|FAIL
- **Scenarios Tested**: X
- **Console Errors**: X
- **Network Requests**: X
- **Critical Issues**: X (must fix)
- **Major Issues**: Y (should fix)

## Browser Console Summary

**Errors:** {count}
**Warnings:** {count}

{List critical errors found during interactions}

## Click Interactions

### Drum Pad Clicks

**Test:** Click each drum pad (8 pads tested)
**Result:** {PASS|FAIL}
**Issues:** {List}

**Example:**
- ✅ Kick pad: Sound plays, animation shows
- ❌ Snare pad: No sound, console error: "AudioContext not initialized"

## Form Behavior

{Document all form testing results}

## Hover States

{Document hover behavior testing}

## Keyboard Navigation

**Tab Order:** {PASS|FAIL}
**Focus Visible:** {PASS|FAIL}
**Shortcuts:** {PASS|FAIL}

{Details}

## Dialog Handling

{Test results for dialogs}

## Network Requests

**Requests Monitored:** {count}
**Successful:** {count}
**Failed:** {count}

{Details}

## Error Handling

**Invalid Inputs Tested:** {count}
**Error Messages:** {PASS|FAIL}
**Recovery:** {PASS|FAIL}

{Details}

## Recommendations

### Immediate Actions (Block Launch)

1. {Critical issue to fix}
2. {Critical issue to fix}

### Short-Term Improvements (Next Sprint)

{List}

### Long-Term Enhancements (Backlog)

{List}
```

---

## Gate Decision Criteria

```
Score ≥85: PASS
Score 70-84: CONCERNS
Score <70: FAIL

Overrides:
- Console errors during core actions → FAIL
- Primary CTA doesn't work → FAIL
- Keyboard navigation broken → FAIL
- Network failures unhandled → CONCERNS
```

---

## Output Files

**Gate File:**
- `docs/qa/gates/{epic}.{story}-interactive-{YYYYMMDD}.yml`

**Markdown Report:**
- `docs/qa/assessments/{epic}.{story}-interactive-{YYYYMMDD}.md`

**Screenshots:**
- `testing/persona-ux/screenshots/{story}-interactive/`

---

## Integration with BMAD

### QA Agent Command

Add to `qa.md`:
```yaml
- ux-interactive {story} --url={flow_url} --scenarios={list}:
    Execute interactive behavior testing
    Tests click, form, hover, keyboard, dialog, network
    Produces: Gate decision + assessment report
```

### Usage

```bash
@qa *ux-interactive 22.1 --url="/?v=m" --scenarios="click drums, change tempo, save pattern"
```

---

## Key Principles

- **Action → Result** - Every interaction must produce expected outcome
- **Error visibility** - Console errors indicate code quality issues
- **Keyboard first** - Accessible to all users, not just mouse users
- **Network awareness** - Monitor API calls, handle failures gracefully
- **Edge cases matter** - Invalid inputs reveal robustness
- **Visual feedback** - Users need confirmation that action occurred

---

## Blocking Conditions

Stop the review and request clarification if:

- Dev server not running (browser navigation fails)
- MCP Playwright server not configured
- Interactive elements not identified in snapshot
- Flow URL returns 404 or errors

---

## Completion Checklist

- [ ] Navigate to flow URL and capture initial state
- [ ] Test all click interactions, check console for errors
- [ ] Test form filling and validation
- [ ] Test hover states and tooltips
- [ ] Validate keyboard navigation and shortcuts
- [ ] Test dialog handling (accept/dismiss)
- [ ] Monitor network requests during interactions
- [ ] Test error states with invalid inputs
- [ ] Create gate YAML with scores
- [ ] Create markdown report with findings
- [ ] Recommend: "Interactive behaviors work" or "Issues found"
