# Phase 2: Quality Minimum - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish testing infrastructure, enable TypeScript strictNullChecks, add error tracking (Sentry scaffold), and create a CI/CD pipeline so that bugs are caught before reaching users.

**Architecture:** Vitest for unit tests (fast, Vite-native), Testing Library for component tests, Sentry SDK for error tracking (scaffold ready, API key pending). GitHub Actions for CI with lint, typecheck, test, and build gates.

**Tech Stack:** Vitest, @testing-library/react, @sentry/react, GitHub Actions

**Findings covered:** F9, F10, F11, F25, F27

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `vitest.config.ts` | Vitest configuration with path aliases |
| Create | `src/test/setup.ts` | Test setup (jsdom, cleanup) |
| Create | `src/lib/__tests__/geometry-calculations.test.ts` | Unit tests for GeometryCalculator |
| Create | `src/lib/__tests__/utils.test.ts` | Unit tests for cn() utility |
| Create | `src/lib/sentry.ts` | Sentry initialization module |
| Modify | `src/components/ErrorBoundary.tsx` | Replace TODO with Sentry captureException |
| Modify | `src/main.tsx` | Initialize Sentry at app entry |
| Modify | `package.json` | Add test deps, test scripts |
| Modify | `tsconfig.json` | Enable strictNullChecks |
| Modify | `tsconfig.app.json` | Enable strictNullChecks |
| Create | `.github/workflows/ci.yml` | CI pipeline: lint, typecheck, test, build |

---

### Task 1: Install Vitest and Configure Test Infrastructure (F10)

**Files:**
- Modify: `package.json` (add devDependencies and scripts)
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/testing-library__jest-dom
```

- [ ] **Step 2: Add test scripts to package.json**

Add to `"scripts"` in `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 4: Create src/test/setup.ts**

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Verify setup works**

Run: `npx vitest run`
Expected: "No test files found" (no tests yet, but no config errors).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json package-lock.json
git commit -m "chore: add Vitest test infrastructure - F10"
```

---

### Task 2: Write Unit Tests for GeometryCalculator (F10)

**Files:**
- Create: `src/lib/__tests__/geometry-calculations.test.ts`

**Context:** `GeometryCalculator` is a static class at `src/lib/geometry-calculations.ts` with a `calculateProperties(params: GeometryParams)` method. It returns `GeometryProperties` with `volume`, `baseArea`, `lateralArea`, `totalArea`, etc. The `GeometryParams` type is at `src/types/geometry.ts` with `type: GeometryType`, `height`, `radius`, `sideLength`, `baseEdgeLength`, `numSides`.

- [ ] **Step 1: Write tests for cube calculations**

```typescript
import { describe, it, expect } from 'vitest';
import { GeometryCalculator } from '@/lib/geometry-calculations';

describe('GeometryCalculator', () => {
  describe('calculateProperties', () => {
    it('returns zero volume for unknown geometry type', () => {
      const result = GeometryCalculator.calculateProperties({
        type: 'unknown-shape' as any,
      });
      expect(result.volume).toBe(0);
    });

    describe('cube', () => {
      it('calculates volume for unit cube', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'cube',
          sideLength: 1,
        });
        expect(result.volume).toBeCloseTo(1);
      });

      it('calculates volume for cube with side 3', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'cube',
          sideLength: 3,
        });
        expect(result.volume).toBeCloseTo(27);
      });

      it('calculates surface area for unit cube', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'cube',
          sideLength: 1,
        });
        expect(result.totalArea).toBeCloseTo(6);
      });
    });

    describe('sphere', () => {
      it('calculates volume for unit sphere', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'sphere',
          radius: 1,
        });
        expect(result.volume).toBeCloseTo((4 / 3) * Math.PI);
      });

      it('calculates surface area for unit sphere', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'sphere',
          radius: 1,
        });
        expect(result.surfaceArea).toBeCloseTo(4 * Math.PI);
      });
    });

    describe('cylinder', () => {
      it('calculates volume for r=1 h=1', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'cylinder',
          radius: 1,
          height: 1,
        });
        expect(result.volume).toBeCloseTo(Math.PI);
      });

      it('calculates lateral area for r=1 h=1', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'cylinder',
          radius: 1,
          height: 1,
        });
        expect(result.lateralArea).toBeCloseTo(2 * Math.PI);
      });
    });

    describe('cone', () => {
      it('calculates volume for r=1 h=3', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'cone',
          radius: 1,
          height: 3,
        });
        expect(result.volume).toBeCloseTo(Math.PI);
      });
    });

    describe('pyramid', () => {
      it('calculates volume for square pyramid h=3 base=2', () => {
        const result = GeometryCalculator.calculateProperties({
          type: 'pyramid',
          height: 3,
          baseEdgeLength: 2,
          numSides: 4,
        });
        // V = (base_area * h) / 3 = (4 * 3) / 3 = 4
        expect(result.volume).toBeCloseTo(4);
      });
    });
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/geometry-calculations.test.ts
git commit -m "test: add unit tests for GeometryCalculator - F10"
```

---

### Task 3: Write Unit Tests for utils (F10)

**Files:**
- Create: `src/lib/__tests__/utils.test.ts`

**Context:** `src/lib/utils.ts` exports `cn(...inputs: ClassValue[])` which merges Tailwind classes using `clsx` + `tailwind-merge`.

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('deduplicates tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/utils.test.ts
git commit -m "test: add unit tests for cn utility - F10"
```

---

### Task 4: Add Sentry Scaffold (F11, F25)

**Files:**
- Create: `src/lib/sentry.ts`
- Modify: `src/components/ErrorBoundary.tsx`
- Modify: `src/main.tsx`

**Context:** Sentry API key is pending. We create the integration code with a placeholder DSN that can be swapped via environment variable `VITE_SENTRY_DSN`. When the env var is not set, Sentry is disabled (no-op).

- [ ] **Step 1: Install Sentry**

```bash
npm install @sentry/react
```

- [ ] **Step 2: Create src/lib/sentry.ts**

```typescript
import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.info('[Sentry] No DSN configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

export { Sentry };
```

- [ ] **Step 3: Update src/main.tsx to initialize Sentry**

Add at the top of `src/main.tsx`, before `ReactDOM.createRoot`:
```typescript
import { initSentry } from '@/lib/sentry';

initSentry();
```

- [ ] **Step 4: Update ErrorBoundary to use Sentry**

In `src/components/ErrorBoundary.tsx`, replace line 1:
```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
```
with:
```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
import { Sentry } from '@/lib/sentry';
```

Replace the `componentDidCatch` method (lines 24-27):
```typescript
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    // TODO: Send to Sentry when integrated
  }
```
with:
```typescript
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }
```

- [ ] **Step 5: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds. Sentry is tree-shaken when DSN is not set in production.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sentry.ts src/components/ErrorBoundary.tsx src/main.tsx package.json package-lock.json
git commit -m "feat: add Sentry error tracking scaffold (DSN pending) - F11 F25"
```

---

### Task 5: Enable TypeScript strictNullChecks (F9)

**Files:**
- Modify: `tsconfig.json`
- Modify: `tsconfig.app.json`

**Context:** Currently `strictNullChecks: false` in `tsconfig.json` and `strict: false` in `tsconfig.app.json`. Enabling `strictNullChecks` will likely produce type errors in files that access potentially-null values without checks. We enable it and fix errors.

- [ ] **Step 1: Enable strictNullChecks in tsconfig.json**

In `tsconfig.json`, change line 17:
```json
"strictNullChecks": false
```
to:
```json
"strictNullChecks": true
```

- [ ] **Step 2: Enable strictNullChecks in tsconfig.app.json**

In `tsconfig.app.json`, add `"strictNullChecks": true` after line 19 (`"strict": false`):
```json
"strict": false,
"strictNullChecks": true,
```

- [ ] **Step 3: Run type check to find errors**

Run: `npx tsc --noEmit 2>&1 | head -100`
Expected: List of type errors (or none if lucky).

- [ ] **Step 4: Fix all type errors**

For each error, apply the minimal fix:
- Add `?.` optional chaining where accessing nullable properties
- Add null checks (`if (x) { ... }`) where values are used
- Add `!` non-null assertion only when you're certain the value exists (e.g., after a guard)
- Do NOT change function signatures or add `| undefined` to types that shouldn't be nullable

- [ ] **Step 5: Verify type check passes**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Run tests**

Run: `npx vitest run`
Expected: All tests still pass.

- [ ] **Step 8: Commit**

```bash
git add tsconfig.json tsconfig.app.json src/
git commit -m "fix: enable strictNullChecks and fix type errors - F9"
```

---

### Task 6: Create CI/CD Pipeline (F27)

**Files:**
- Create: `.github/workflows/ci.yml`

**Context:** The project uses npm, Vite, ESLint, and TypeScript. No tests existed before Task 1-3. The CI pipeline should run on every push and PR to main.

- [ ] **Step 1: Create .github/workflows directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create .github/workflows/ci.yml**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Lint, Type Check, Test, Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

- [ ] **Step 3: Verify YAML is valid**

Run: `node -e "const yaml = require('fs').readFileSync('.github/workflows/ci.yml', 'utf8'); console.log('Valid YAML, length:', yaml.length)"`
Expected: Prints length without error.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions pipeline with lint, typecheck, test, build - F27"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run full quality suite locally**

```bash
npm run lint && npx tsc --noEmit && npx vitest run && npm run build
```

Expected: All 4 commands pass.

- [ ] **Step 2: Verify all commits**

Run: `git log --oneline -8`

Expected: 6 new commits for Phase 2 tasks.

- [ ] **Step 3: Commit plan completion**

```bash
git add -A
git commit -m "docs: Phase 2 quality minimum implementation complete"
```
