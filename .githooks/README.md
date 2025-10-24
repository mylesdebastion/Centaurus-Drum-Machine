# Git Hooks

This directory contains git hooks that are tracked in version control.

## Setup (One-Time Per Machine)

After cloning this repository, run:

```bash
git config core.hooksPath .githooks
```

This tells git to use hooks from this directory instead of `.git/hooks/`.

## Why This Approach?

- **Version Controlled**: Hook changes are tracked and synced across machines
- **Consistent**: All team members/machines use the same hooks
- **Maintainable**: Update hooks like any other code file
- **Simple**: One command per machine, no scripts to maintain

## Current Hooks

### `pre-push`
- Validates build succeeds before pushing to main/dev
- Blocks dist/ artifacts from being committed
- Smart detection: allows dev → main merges, warns on direct commits to main

## Troubleshooting

### Hook not running after pulling updates?
The hook file needs execute permissions. Run:
```bash
chmod +x .githooks/pre-push
```

### Want to bypass a hook temporarily?
Use `--no-verify` flag:
```bash
git push --no-verify
```
⚠️ Only use this when you know what you're doing!

### Reset to default git hooks?
```bash
git config --unset core.hooksPath
```
