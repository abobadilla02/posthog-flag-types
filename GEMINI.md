# posthog-flag-types

A CLI tool that generates type-safe TypeScript constants from PostHog feature flags,
with local development overrides and a runtime helper for user apps.

---

## Project Purpose

PostHog's SDK gives you typed methods but untyped flag key strings — magic strings that
typo without error and silently break when flags are deleted. This tool solves that by
generating a `posthog-flags.ts` file from the real PostHog API, and a gitignored
`posthog-flags.overrides.ts` for per-developer flag control in development.

---

## Architecture

```
src/
├── types.ts              # All shared TypeScript interfaces (PostHogFlagTypesConfig, ParsedFlag, etc.)
├── fetcher.ts            # PostHog REST API client — fetches and paginates flags
├── generator.ts          # Generates posthog-flags.ts (FLAGS const, FlagVariants, FlagOverrides)
├── override-generator.ts # Generates posthog-flags.overrides.ts, handles .gitignore
├── runtime.ts            # createFlagClient() — runtime wrapper for user apps
├── writer.ts             # File I/O helpers (writeFile, fileExists, resolvedPath)
├── config.ts             # Config loader: file → env vars → CLI args (merged in that order)
├── watcher.ts            # Watch mode: polls PostHog, regenerates only on hash change
├── cli.ts                # CLI entry point using commander
└── __tests__/
    └── index.test.ts     # Unit tests: toConstName, generateTypeScript, generateOverridesTemplate
```

**Data flow:**
```
PostHog API → fetchFlags() → ParsedFlag[] → generateTypeScript() → posthog-flags.ts
                                          ↘ generateOverridesTemplate() → posthog-flags.overrides.ts
```

---

## Key Conventions

### TypeScript

- **Strict mode is on.** No `any`, no implicit returns, no unchecked indexing.
- Use `unknown` with type guards — never cast through `any`.
- All public functions must have explicit return types.
- Prefer `interface` over `type` for object shapes; use `type` for unions and mapped types.
- Use `satisfies` when enforcing a type without widening (e.g. config objects).

### Naming

- Flag keys become `SCREAMING_SNAKE_CASE` via `toConstName()` in `fetcher.ts`.
  - `'new-dashboard'` → `NEW_DASHBOARD`
  - `'checkout-experiment_v2'` → `CHECKOUT_EXPERIMENT_V2`
  - Logic: replace non-alphanumeric with `_`, collapse multiples, trim, uppercase.
- Functions: `camelCase`. Files: `kebab-case`. Types/interfaces: `PascalCase`.

### Error Handling

- All API errors include the HTTP status code and a specific action the user should take.
- `401` → mention the API key scope (`Feature flags: Read`)
- `404` → mention checking the project ID
- `pushIdeas`-style batch operations must never throw — capture errors per-item.
- Parse errors (bad JSON from API) must include the first 400 chars of the raw response.

### File Generation

- Every generated file starts with the `AUTO-GENERATED — DO NOT EDIT MANUALLY` banner.
- The overrides file starts with `LOCAL DEVELOPMENT OVERRIDES — DO NOT COMMIT`.
- On regeneration, **preserve existing override values** — parse the current file and
  only add new flags (set to `undefined`) or remove deleted ones.
- `ensureGitignored()` is idempotent — never adds duplicates to `.gitignore`.

### Testing

- Tests live in `src/__tests__/index.test.ts`.
- Use `vitest` — never `jest`.
- Test the pure functions: `toConstName`, `generateTypeScript`, `generateOverridesTemplate`.
- Mock `fetch` globally with `vi.stubGlobal('fetch', mockFetch)` for API tests.
- Do not test the CLI entry point (`cli.ts`) — test the underlying logic modules instead.
- Every error case must have a test (invalid JSON, missing fields, empty arrays, 401, 404).

---

## Core Types (from src/types.ts)

```typescript
interface PostHogFlagTypesConfig {
  apiKey: string;
  projectId: string | number;
  output?: string;           // default: ./posthog-flags.ts
  overridesOutput?: string;  // default: ./posthog-flags.overrides.ts
  host?: string;             // default: https://us.posthog.com
  includeInactive?: boolean; // default: false
  watchInterval?: number;    // seconds, default: 30
}

interface ParsedFlag {
  key: string;         // raw PostHog key, e.g. 'new-dashboard'
  name: string;        // human-readable name
  constName: string;   // generated constant name, e.g. 'NEW_DASHBOARD'
  type: 'boolean' | 'multivariate';
  active: boolean;
  variants: string[];  // empty for boolean flags
}
```

---

## Generated File Shapes

### posthog-flags.ts (always committed)

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

export type VariantsOf<K extends keyof FlagVariants> = FlagVariants[K];

export type BooleanFlagKey = | 'new-dashboard';
export type MultivariateFlagKey = | 'checkout-experiment';

// Conditional mapped type — the key differentiator from competitors
export type FlagOverrides = {
  [K in FlagKey]?: K extends keyof FlagVariants ? FlagVariants[K] : boolean;
};
```

### posthog-flags.overrides.ts (always gitignored)

```typescript
/**
 * LOCAL DEVELOPMENT OVERRIDES — DO NOT COMMIT
 * Set any flag to override PostHog in development. undefined = use real value.
 */
import type { FlagOverrides } from './posthog-flags';

const overrides: FlagOverrides = {
  'new-dashboard': undefined,          // true | false
  'checkout-experiment': undefined,    // 'control' | 'variant-a' | 'variant-b'
};

export default overrides;
```

---

## Runtime Helper (src/runtime.ts)

`createFlagClient(posthog, { overrides, debug })` wraps PostHog with override-awareness.

- In production: pass `overrides: {}` — zero-cost passthrough, PostHog behaves normally.
- In development: override values are used instead of PostHog.
- `getVariant()` return type is generic and conditional — fully typed per flag.
- `debug: true` logs `[posthog-flag-types] Override applied: key = value` to console.

---

## CLI Flags

```
--api-key <key>            PostHog personal API key (or POSTHOG_API_KEY)
--project-id <id>          PostHog project ID (or POSTHOG_PROJECT_ID)
--output <path>            Flags output file (default: ./posthog-flags.ts)
--overrides-output <path>  Overrides output file (default: ./posthog-flags.overrides.ts)
--host <url>               PostHog host (default: https://us.posthog.com)
--include-inactive         Include inactive/deleted flags
--no-overrides             Skip generating the overrides file (use in CI)
--watch                    Watch mode — poll and regenerate on change
--watch-interval <secs>    Polling interval (default: 30)
```

Config priority (highest to lowest): CLI args → config file → environment variables.

Config file: `posthog-flags.config.ts` or `posthog-flags.config.js` in the project root.

---

## PostHog API

- **Endpoint:** `GET https://us.posthog.com/api/projects/{projectId}/feature_flags/?limit=100`
- **Auth:** `Authorization: Bearer {apiKey}`
- **Pagination:** follow `response.next` until `null`
- **A flag is multivariate** when `filters.multivariate.variants` is a non-empty array
- **Inactive flags** have `active: false` OR `deleted: true` — filter both unless `--include-inactive`

---

## Watch Mode Change Detection

Hash flags by sorting keys alphabetically and joining `key:variants:active`.
Only write files when the hash changes — avoid unnecessary disk writes.

```typescript
function hashFlags(flags: ParsedFlag[]): string {
  return [...flags]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((f) => `${f.key}:${f.variants.join(',')}:${f.active}`)
    .join('|');
}
```

---

## Common Commands

```bash
# Install dependencies
npm install

# Build TypeScript → dist/
npm run build

# Run tests (vitest)
npm test

# Watch tests during development
npm run test:watch

# Run the CLI locally (without building)
npx ts-node src/cli.ts --api-key phx_xxx --project-id 12345

# Run the built CLI
node dist/cli.js --api-key phx_xxx --project-id 12345 --dry-run

# Publish to npm (runs build + test first)
npm publish
```

---

## What This Tool Is NOT

- It does not call any AI/LLM API — it calls PostHog's REST API directly.
- It does not push flags TO PostHog — PostHog is always the source of truth.
- It does not manage rollout percentages or targeting rules.
- It does not replace PostHog's SDK — it wraps it.

---

## Comparison vs hogsync (the main competitor)

| Feature | posthog-flag-types | hogsync |
|---|---|---|
| API-first (PostHog is source of truth) | ✅ | ❌ |
| `FLAGS` const + `FlagKey` type | ✅ | ✅ |
| Multivariate variant union types | ✅ | ✅ |
| `FlagOverrides` conditional mapped type | ✅ | ❌ |
| Local overrides file (gitignored) | ✅ | ✅ |
| Preserves existing override values on regen | ✅ | ❌ |
| Runtime helper (`createFlagClient`) | ✅ | ❌ |
| Watch mode | ✅ | ❌ |
| Bi-directional sync (push flags to PostHog) | ❌ | ✅ |

---

## Versioning & Commit Conventions

This project uses **Semantic Versioning** (`MAJOR.MINOR.PATCH`) and
**Conventional Commits** for all commit messages and PR titles.
Gemini must follow these conventions when suggesting commits, writing
PR descriptions, or bumping the version in `package.json`.

### Semantic Versioning Rules

```
MAJOR — breaking change (users must change their code to upgrade)
MINOR — new feature, fully backward-compatible
PATCH — bug fix, internal refactor, docs, or dependency update
```

| Version bump | When |
|---|---|
| `1.0.0 → 2.0.0` | Removed or renamed a public export, changed CLI flag behavior, altered generated file format in a breaking way |
| `1.0.0 → 1.1.0` | Added `--describe` flag, new export in `runtime.ts`, new config option |
| `1.0.0 → 1.0.1` | Fixed a parsing bug, corrected a type, updated README, bumped a dep |

### Commit Message Format

```
<type>[!]: <short description in imperative mood, lowercase, no period>

[optional body — explain WHY, not WHAT]

[optional footer — BREAKING CHANGE: <description>]
```

**The `!` suffix signals a breaking change** — it triggers a `MAJOR` bump regardless of type.

### Commit Types

| Type | Version impact | When to use |
|---|---|---|
| `feat` | MINOR | New user-facing feature (new CLI flag, new export, new config option) |
| `feat!` | MAJOR | New feature that breaks existing behavior |
| `fix` | PATCH | Bug fix in any module |
| `fix!` | MAJOR | Bug fix that changes existing behavior in a breaking way |
| `refactor` | PATCH | Internal restructure, no behavior change |
| `refactor!` | MAJOR | Restructure that changes a public API |
| `docs` | PATCH | README, JSDoc, GEMINI.md, code comments |
| `test` | PATCH | Adding or updating tests, no production code change |
| `chore` | PATCH | Build config, deps, `.gitignore`, CI, tooling |
| `perf` | PATCH | Performance improvement with no API change |
| `ci` | PATCH | GitHub Actions workflows only |

### Real Examples for This Project

```bash
# Adding the --describe flag
feat: add --describe flag to generate JSDoc from flag names via Gemini API

# Fixing the override parser losing values on regen
fix: preserve existing override values when flag list changes

# Renaming FlagOverrides → LocalOverrides (breaking — public type)
refactor!: rename FlagOverrides to LocalOverrides for clarity

BREAKING CHANGE: FlagOverrides is now exported as LocalOverrides.
Update your posthog-flags.overrides.ts import accordingly.

# Updating the README comparison table
docs: update hogsync comparison table with watch mode row

# Adding a CI workflow
ci: add GitHub Actions workflow for npm publish on release tag

# Bumping a dependency
chore: upgrade chalk to v5.4.0

# Fixing the hash function to be stable across Node versions
fix: use localeCompare in hashFlags to ensure sort stability
```

### PR Title Convention

PR titles follow the same format as commit messages because they become
the squash-merge commit message on main:

```
feat: add runtime helper createFlagClient with override support
fix: handle paginated PostHog responses correctly
chore: publish v0.1.0 to npm
```

### Version Bump Workflow

When Gemini is asked to prepare a release, it must:

1. Determine the highest-impact commit type since last tag:
   - Any `!` commit → MAJOR
   - Any `feat` → MINOR
   - Only `fix`/`chore`/`docs`/`test`/`ci`/`refactor`/`perf` → PATCH
2. Update `version` in `package.json`
3. Add a `CHANGELOG.md` entry with the format below
4. Suggest the commit: `chore: release v<new-version>`
5. Suggest the git tag: `git tag v<new-version>`

### CHANGELOG.md Format

```markdown
## [0.2.0] — 2026-05-10

### Features
- Add `--describe` flag to generate JSDoc comments from flag names (#12)
- Add `VariantsOf<K>` helper type to generated output (#9)

### Bug Fixes
- Preserve existing override values when flag list changes on regen (#14)

### Breaking Changes
None.

---

## [0.1.0] — 2026-05-01

Initial release.
```

### What Gemini Must NEVER Do

- Use past tense in commit messages (`added`, `fixed`) — always imperative (`add`, `fix`)
- Use a period at the end of the short description
- Use `update` as the type — it is not a valid type; use `feat`, `fix`, `chore`, or `docs`
- Suggest a MAJOR bump for a `fix` that doesn't change the public API
- Skip the `BREAKING CHANGE:` footer when using `!`

---

## Author

Alonso Bobadilla — [github.com/abobadilla02](https://github.com/abobadilla02)