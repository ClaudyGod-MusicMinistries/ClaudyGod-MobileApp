# Code Quality Checking System

This project has a comprehensive code quality checking system with automated git hooks and manual checks.

## Quick Start

### Before Committing
```bash
npm run check:pre-commit
```

### Before Pushing
```bash
npm run check:pre-push
```

### Full Check Anytime
```bash
npm run check
```

---

## Available Commands

### `npm run check`
**Comprehensive code check** - Runs all checks in this order:
1. ✅ Dependency verification
2. ✅ TypeScript compilation
3. ✅ ESLint (code style)
4. ⚠️  Jest tests (optional - won't fail if missing)

**Use when:** You want to verify your code is production-ready before pushing

### `npm run check:deps`
**Dependency verification only** - Checks that all required dependencies are installed

**Use when:** You're getting "Cannot find module" errors

### `npm run check:pre-commit`
**Pre-commit hook** - Runs dependencies check + lints staged files only

**Automatically runs:** Before every `git commit`

### `npm run check:pre-push`
**Pre-push hook** - Runs all comprehensive checks

**Automatically runs:** Before every `git push`

### `npm run typecheck`
**TypeScript type checking only**

**Use when:** You want to quickly verify types without linting

### `npm run lint`
**ESLint linting only**

**Use when:** You want to check code style

### `npm run lint:fix`
**Auto-fix linting issues**

**Use when:** You have ESLint errors and want to auto-fix them

---

## Git Hooks (Automatic)

Git hooks run automatically. They prevent bad code from being committed or pushed.

### Pre-Commit Hook
**Runs:** Before every `git commit`
**Checks:**
- Dependencies are installed
- Staged files pass ESLint

**What if it fails:**
- Fix the errors shown
- Re-run the command
- Try committing again

### Pre-Push Hook
**Runs:** Before every `git push`
**Checks:**
- All dependencies installed
- TypeScript compiles
- ESLint passes
- Tests pass (optional)

**What if it fails:**
- Fix errors shown
- Run `npm run check` to verify
- Try pushing again

---

## Understanding Error Messages

### ❌ Failed (Critical)
The check FAILED and prevents committing/pushing.
- TypeScript errors
- ESLint errors
- Missing dependencies

**Action:** Fix the errors and try again

### ⚠️  Failed (Optional)
The check failed but doesn't block committing/pushing.
- Missing tests

**Action:** Recommended to fix, but not required

### ✅ Passed
The check succeeded. Good to go!

---

## Common Issues & Solutions

### "Cannot find module 'react'"
```bash
npm install
```
Dependencies not installed. Run install command.

### TypeScript Compilation Error
```bash
npm run typecheck
```
See full error message and fix the type issue.

### ESLint Error
```bash
npm run lint:fix
```
Try auto-fixing first. If it doesn't fix everything, manually edit the file.

### Git Hook Bypassing (Not Recommended!)
To skip hooks (use only if absolutely necessary):
```bash
git commit --no-verify
git push --no-verify
```
**WARNING:** This bypasses quality checks. Do this only in emergencies!

---

## Hook Configuration

Hooks are managed by **Lefthook** in `lefthook.yml`:

```yaml
pre-commit:
  - Check dependencies
  - Run ESLint on staged files

pre-push:
  - Check dependencies
  - TypeScript compilation
  - Full ESLint
  - Tests (optional)
```

### Reinstall Hooks
If hooks aren't running:
```bash
npm run hooks:install
```

---

## CI/CD Integration

The checking system works in CI/CD pipelines:

```bash
# In CI/CD pipeline
npm run check
```

This command:
- Exits with code 0 on success
- Exits with code 1 on failure
- Works in both local and CI environments

---

## Scripts Location

All checking scripts are in `/scripts/`:
- `check-all.js` - Comprehensive check (runs all checks)
- `check-dependencies.js` - Dependency verification
- `check-dependencies.js` - Used by git hooks

These are **Node.js scripts** (excluded from ESLint).

---

## Performance

Typical check times:
- **Dependency check:** < 1 second
- **TypeScript check:** 15-30 seconds
- **ESLint:** 5-10 seconds
- **Full check:** 30-60 seconds

---

## Tips for Smooth Development

### Before Starting Work
```bash
npm install        # Ensure dependencies installed
npm run lint:fix   # Fix any existing lint issues
```

### During Development
```bash
npm run typecheck  # Frequently check types
npm run lint       # Check style before committing
```

### Before Committing
```bash
npm run check:pre-commit  # Pre-commit checks
```

### Before Pushing
```bash
npm run check:pre-push    # Pre-push checks
```

### Final Verification
```bash
npm run check   # Full comprehensive check
```

---

## Disabling Specific Rules (When Necessary)

### Disable ESLint Rule for a Line
```typescript
// eslint-disable-next-line no-unused-vars
const unusedVar = 'only when necessary';
```

### Disable ESLint Rule for a Block
```typescript
/* eslint-disable no-console */
console.log('debugging');
/* eslint-enable no-console */
```

### Disable TypeScript Check
```typescript
// @ts-ignore
const suspicious = someWeirdCode();
```

**Note:** Use these sparingly! They disable important checks.

---

## Getting Help

If checks fail and you're stuck:

1. **Read the error message carefully** - It usually tells you exactly what's wrong
2. **Run the specific check** - Get more detailed output
3. **Check the file** - Navigate to the error and understand the code
4. **Fix the issue** - Make the necessary changes
5. **Run the check again** - Verify it's fixed

---

**Status:** ✅ Checking system active and enforced
**Last Updated:** 2026-06-10
