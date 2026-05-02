# posthog-flag-types

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Release](https://github.com/abobadilla02/posthog-flag-types/actions/workflows/release.yml/badge.svg)](https://github.com/abobadilla02/posthog-flag-types/actions/workflows/release.yml)

Generate type-safe TypeScript constants from PostHog feature flags. Stop using magic strings and start using fully typed, auto-generated constants with local development overrides.

## Why use this?

PostHog's SDK gives you typed methods but untyped flag key strings — magic strings that typo without error and silently break when flags are deleted. This tool solves that by generating a `posthog-flags.ts` file from your real PostHog API.

- ✅ **Type-safe:** No more `posthog.isFeatureEnabled('my-typoed-flag')`.
- ✅ **Local Overrides:** Control flags in development without touching the PostHog dashboard.
- ✅ **Watch Mode:** Automatically sync flags when they change in PostHog.
- ✅ **Multivariate Support:** Union types for variants (e.g., `'control' | 'variant-a'`).
- ✅ **Dev Panel:** Toggle flags in the browser with a secret keyboard shortcut.

## Installation

```bash
npm install posthog-flag-types
```

## Quick Start

### 1. Generate flag types

Run the CLI to fetch flags and generate types:

```bash
npx posthog-flag-types --api-key <your-api-key> --project-id <your-project-id>
```

### 2. Configure for your app

We recommend using a configuration file `posthog-flags.config.js` in your root:

```javascript
module.exports = {
  apiKey: process.env.POSTHOG_API_KEY,
  projectId: process.env.POSTHOG_PROJECT_ID,
  output: './src/posthog-flags.ts',
};
```

### 3. Use the Runtime Helper

Wrap your PostHog client to enable type safety and overrides:

```typescript
import posthog from 'posthog-js';
import { createFlagClient } from 'posthog-flag-types/runtime';
import { FLAGS } from './posthog-flags';
import overrides from './posthog-flags.overrides'; // This file is gitignored

const flags = createFlagClient(posthog, {
  overrides: process.env.NODE_ENV === 'development' ? overrides : {},
  debug: true,
});

// Fully typed boolean check
if (flags.isEnabled(FLAGS.NEW_DASHBOARD)) {
  console.log('New dashboard active!');
}

// Fully typed variant retrieval
const variant = flags.getVariant(FLAGS.CHECKOUT_EXPERIMENT);
// variant type is: 'control' | 'variant-a' | 'variant-b' | undefined
```

## Dev Panel (Experimental)

The `FlagDevPanel` is a floating UI that lets you toggle flags dynamically in the browser.

### 1. Integration

```tsx
import { useState } from 'react';
import { FlagDevPanel } from 'posthog-flag-types/devpanel';
import { FLAGS, FLAG_METADATA, type FlagOverrides } from './posthog-flags';

function App() {
  const [liveOverrides, setLiveOverrides] = useState<FlagOverrides>({});

  const flags = createFlagClient(posthog, {
    overrides: fileOverrides,
    liveOverrides,
  });

  return (
    <>
      <YourApp flags={flags} />
      <FlagDevPanel
        flags={FLAGS}
        metadata={FLAG_METADATA}
        overrides={liveOverrides}
        onOverridesChange={setLiveOverrides}
        enabled={process.env.NODE_ENV === 'development'}
      />
    </>
  );
}
```

### 2. Usage

- **Trigger:** Press `Shift` twice quickly, then `F` (`Shift+Shift+F`).
- **Persistence:** Changes are saved to `localStorage` and survive page refreshes.
- **Priority:** Live Overrides (Panel) > File Overrides (`.overrides.ts`) > PostHog.

## Generated Code Example
...
### `posthog-flags.ts`

```typescript
export const FLAGS = {
  /** @boolean */
  NEW_DASHBOARD: 'new-dashboard',
  /** @multivariate variants: control, variant-a, variant-b */
  CHECKOUT_EXPERIMENT: 'checkout-experiment',
} as const;

export type FlagKey = typeof FLAGS[keyof typeof FLAGS];

export type FlagVariants = {
  'checkout-experiment': 'control' | 'variant-a' | 'variant-b';
};
```

## Local Overrides

When you run the tool, it generates a `posthog-flags.overrides.ts` file. **Add this file to your `.gitignore`**.

```typescript
import type { FlagOverrides } from './posthog-flags';

const overrides: FlagOverrides = {
  'new-dashboard': true,         // Force enable for local dev
  'checkout-experiment': 'variant-a', // Force a specific variant
};

export default overrides;
```

## Comparison vs hogsync

| Feature | posthog-flag-types | hogsync |
|---|---|---|
| API-first (PostHog is source of truth) | ✅ | ❌ |
| `FLAGS` const + `FlagKey` type | ✅ | ✅ |
| Multivariate variant union types | ✅ | ✅ |
| Local overrides file (gitignored) | ✅ | ✅ |
| Preserves override values on regen | ✅ | ❌ |
| Runtime helper (`createFlagClient`) | ✅ | ❌ |
| Watch mode | ✅ | ❌ |

## CLI Options

| Flag | Env Var | Description |
|---|---|---|
| `--api-key <key>` | `POSTHOG_API_KEY` | PostHog personal API key |
| `--project-id <id>` | `POSTHOG_PROJECT_ID` | PostHog project ID |
| `--output <path>` | - | Flags output file (default: `./posthog-flags.ts`) |
| `--overrides-output <path>` | - | Overrides output file (default: `./posthog-flags.overrides.ts`) |
| `--host <url>` | `POSTHOG_HOST` | PostHog host (default: `https://us.posthog.com`) |
| `--watch` | - | Poll PostHog and regenerate on change |
| `--watch-interval <secs>` | - | Polling interval (default: 30) |

## Development

This project uses **Conventional Commits**. Please follow the format:
- `feat: ...` for new features
- `fix: ...` for bug fixes
- `chore: ...` for maintenance

## License

MIT © [Alonso Bobadilla](https://github.com/abobadilla02)
