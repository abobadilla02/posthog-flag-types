/**
 * Runtime helper to wrap PostHog with override-awareness.
 */

export interface PostHogLike {
  isFeatureEnabled(key: string, options?: any): boolean | undefined;
  getFeatureFlag(key: string, options?: any): string | boolean | undefined;
}

export interface FlagClientOptions {
  overrides?: Record<string, any>;
  liveOverrides?: Record<string, any>;
  debug?: boolean;
}

export class FlagClient {
  constructor(
    private posthog: PostHogLike,
    private options: FlagClientOptions = {}
  ) {}

  isEnabled(key: string, options?: any): boolean {
    const liveOverride = this.options.liveOverrides?.[key];
    if (liveOverride !== undefined) {
      this.logOverride(key, liveOverride, 'live');
      return !!liveOverride;
    }

    const override = this.options.overrides?.[key];
    if (override !== undefined) {
      this.logOverride(key, override, 'file');
      return !!override;
    }
    return !!this.posthog.isFeatureEnabled(key, options);
  }

  getVariant<T extends string | boolean>(key: string, options?: any): T | undefined {
    const liveOverride = this.options.liveOverrides?.[key];
    if (liveOverride !== undefined) {
      this.logOverride(key, liveOverride, 'live');
      return liveOverride as T;
    }

    const override = this.options.overrides?.[key];
    if (override !== undefined) {
      this.logOverride(key, override, 'file');
      return override as T;
    }
    return this.posthog.getFeatureFlag(key, options) as T | undefined;
  }

  private logOverride(key: string, value: any, source: 'live' | 'file') {
    if (this.options.debug) {
      console.log(`[posthog-flag-types] ${source === 'live' ? 'Live' : ''} Override applied: ${key} = ${value}`);
    }
  }
}

export function createFlagClient(posthog: PostHogLike, options?: FlagClientOptions): FlagClient {
  return new FlagClient(posthog, options);
}
