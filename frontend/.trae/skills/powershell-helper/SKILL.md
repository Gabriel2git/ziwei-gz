---
name: "powershell-helper"
description: "Converts bash-style commands to PowerShell-compatible syntax. Invoke when user needs to run commands with &&, ||, or other bash operators in PowerShell environment."
---

# PowerShell Helper

This skill helps convert bash-style commands to PowerShell-compatible syntax, since PowerShell does not support `&&` and `||` operators like bash.

## When to Invoke

- User wants to run multiple commands conditionally (equivalent to bash `&&` or `||`)
- User needs command fallbacks or error handling in PowerShell
- Converting bash scripts to PowerShell

## Common Conversions

### 1. Sequential Commands (bash `;`)
**Bash:**
```bash
cd frontend; npm run build
```

**PowerShell:**
```powershell
cd frontend; npm run build
```
✅ Same syntax works

### 2. AND Operator (bash `&&`)
**Bash:**
```bash
cd frontend && npm run build
```

**PowerShell Options:**
```powershell
# Option 1: Use ; (runs sequentially, no condition)
cd frontend; npm run build

# Option 2: Use -and with explicit error checking
$cwd = cd frontend; if ($?) { npm run build }

# Option 3: Use try-catch for better error handling
try { cd frontend; npm run build } catch { Write-Error "Command failed" }
```

### 3. OR Operator (bash `||`)
**Bash:**
```bash
npm run typecheck || npx tsc --noEmit
```

**PowerShell Options:**
```powershell
# Option 1: Use if-else with $?
npm run typecheck; if (-not $?) { npx tsc --noEmit }

# Option 2: Use try-catch
try { npm run typecheck } catch { npx tsc --noEmit }
```

### 4. Combined Commands
**Bash:**
```bash
cd frontend && npm run build || echo "Build failed"
```

**PowerShell:**
```powershell
cd frontend; npm run build; if (-not $?) { Write-Host "Build failed" }
```

### 5. Command with Fallback
**Bash:**
```bash
npm run typecheck 2>&1 || npx tsc --noEmit
```

**PowerShell:**
```powershell
npm run typecheck; if ($LASTEXITCODE -ne 0) { npx tsc --noEmit }
```

## Best Practices

1. **For simple sequential execution**: Use `;` separator
2. **For conditional execution**: Check `$?` (success of last command) or `$LASTEXITCODE`
3. **For complex logic**: Use `if-else` statements
4. **For error handling**: Use `try-catch` blocks

## Quick Reference

| Bash | PowerShell Equivalent |
|------|----------------------|
| `cmd1 && cmd2` | `cmd1; if ($?) { cmd2 }` |
| `cmd1 \|\| cmd2` | `cmd1; if (-not $?) { cmd2 }` |
| `cmd1 ; cmd2` | `cmd1; cmd2` |
| `cmd1 && cmd2 \|\| cmd3` | `cmd1; if ($?) { cmd2 } else { cmd3 }` |

## Automatic Conversion

When user provides a bash command with `&&` or `||`, automatically convert it to PowerShell syntax and present the result.
