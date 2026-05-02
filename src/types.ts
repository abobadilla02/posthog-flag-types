export interface PostHogFlagTypesConfig {
  apiKey: string;
  projectId: string | number;
  output?: string;           // default: ./posthog-flags.ts
  overridesOutput?: string;  // default: ./posthog-flags.overrides.ts
  host?: string;             // default: https://us.posthog.com
  includeInactive?: boolean; // default: false
  watchInterval?: number;    // seconds, default: 30
  overrides?: boolean;       // whether to generate overrides file, default: true
}

export interface ParsedFlag {
  key: string;         // raw PostHog key, e.g. 'new-dashboard'
  name: string;        // human-readable name
  constName: string;   // generated constant name, e.g. 'NEW_DASHBOARD'
  type: 'boolean' | 'multivariate';
  active: boolean;
  variants: string[];  // empty for boolean flags
}

export interface PostHogResponse {
  results: Array<{
    key: string;
    name: string;
    active: boolean;
    deleted: boolean;
    filters?: {
      multivariate?: {
        variants?: Array<{
          key: string;
        }>;
      };
    };
  }>;
  next: string | null;
}
