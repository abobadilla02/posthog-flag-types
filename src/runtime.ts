/**
 * Runtime helper to wrap PostHog with override-awareness.
 */

export interface PostHogLike {
  isFeatureEnabled(key: string, options?: any): boolean | undefined;
  getFeatureFlag(key: string, options?: any): string | boolean | undefined;
}

export interface FlagClientOptions {
  overrides?: Record<string, any>;
  debug?: boolean;
}

export class FlagClient {
  constructor(
    private posthog: PostHogLike,
    private options: FlagClientOptions = {}
  ) {}

  isEnabled(key: string, options?: any): boolean {
    const override = this.options.overrides?.[key];
    if (override !== undefined) {
      if (this.options.debug) {
        console.log(`[posthog-flag-types] Override applied: ${key} = ${override}`);
      }
      return !!override;
    }
    return !!this.posthog.isFeatureEnabled(key, options);
  }

  getVariant<T extends string | boolean>(key: string, options?: any): T | undefined {
    const override = this.options.overrides?.[key];
    if (override !== undefined) {
      if (this.options.debug) {
        console.log(`[posthog-flag-types] Override applied: ${key} = ${override}`);
      }
      return override as T;
    }
    return this.posthog.getFeatureFlag(key, options) as T | undefined;
  }
}

export function createFlagClient(posthog: PostHogLike, options?: FlagClientOptions): FlagClient {
  return new FlagClient(posthog, options);
}
