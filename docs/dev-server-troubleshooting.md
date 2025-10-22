# Development Server Troubleshooting Guide

## Advanced Port Management

This guide contains detailed commands for managing the Vite dev server when standard approaches fail. **Use these only when necessary** - normal development should rely on HMR (Hot Module Replacement).

## Port Configuration

- **Fixed port**: 5173 (always)
- **strictPort: true** - Vite will fail if port 5173 is busy instead of auto-selecting a new port
- **Why**: Prevents confusion from multiple dev servers running on different ports

## Stopping the Dev Server

**IMPORTANT**: `npm run dev` has **no built-in stop command**. There is no `npm stop` or `npm run dev:stop`.

**The only ways to stop a Vite dev server:**
- **Interactive**: Press Ctrl+C in the terminal running the server
- **Programmatic**: Kill the Node.js process via OS commands (below)

## When Port 5173 is Already in Use

### Windows (Recommended Method)

**One-liner: Find PID, kill it, wait, then start server**
```bash
powershell -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }" && timeout /t 2 /nobreak >nul && npm run dev
```

**Step-by-step approach:**
```bash
# 1. Find and kill process on port 5173
powershell -Command "Get-NetTCPConnection -LocalPort 5173 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"

# 2. Wait 2 seconds for cleanup
timeout /t 2 /nobreak

# 3. Start dev server
npm run dev
```

### Linux/Mac

**One-liner: Kill process and start server**
```bash
kill -9 $(lsof -ti:5173) 2>/dev/null; sleep 2; npm run dev
```

**Step-by-step approach:**
```bash
# 1. Find and kill process on port 5173
kill -9 $(lsof -ti:5173)

# 2. Wait 2 seconds for cleanup
sleep 2

# 3. Start dev server
npm run dev
```

## Restart Helper Scripts

Create these scripts for quick server restarts when needed:

### Windows: `restart-dev.bat`
```batch
@echo off
echo Killing any process on port 5173...
powershell -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"
timeout /t 2 /nobreak >nul
echo Starting dev server...
npm run dev
```

### Linux/Mac: `restart-dev.sh`
```bash
#!/bin/bash
echo "Killing any process on port 5173..."
kill -9 $(lsof -ti:5173) 2>/dev/null
sleep 2
echo "Starting dev server..."
npm run dev
```

Make executable on Linux/Mac:
```bash
chmod +x restart-dev.sh
```

## Important Notes for Claude Code Users

- **Background Bash shells**: The shell ID ≠ the actual Node.js/Vite process PID
- **Killing a background shell does NOT kill the dev server process**
- **Always kill by PORT** (5173) not by shell ID
- Use the PowerShell/lsof commands above to target the actual process

## Best Practices

1. **Check before starting**: Always verify if port 5173 is available
2. **Never run multiple servers**: Stick to one dev server on port 5173
3. **Kill previous processes**: Clean up old processes before starting new ones
4. **Rely on HMR**: Let Vite's Hot Module Replacement handle most updates
5. **Only restart when necessary**: Config changes, stuck processes, or fatal errors

## When NOT to Restart

- After making code changes (HMR handles this)
- After file saves (automatic reload)
- When testing UI changes (HMR updates instantly)
- Multiple times in succession (indicates a deeper issue)
