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
export declare class FlagClient {
    private posthog;
    private options;
    constructor(posthog: PostHogLike, options?: FlagClientOptions);
    isEnabled(key: string, options?: any): boolean;
    getVariant<T extends string | boolean>(key: string, options?: any): T | undefined;
}
export declare function createFlagClient(posthog: PostHogLike, options?: FlagClientOptions): FlagClient;
