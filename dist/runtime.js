"use strict";
/**
 * Runtime helper to wrap PostHog with override-awareness.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlagClient = void 0;
exports.createFlagClient = createFlagClient;
class FlagClient {
    constructor(posthog, options = {}) {
        this.posthog = posthog;
        this.options = options;
    }
    isEnabled(key, options) {
        const override = this.options.overrides?.[key];
        if (override !== undefined) {
            if (this.options.debug) {
                console.log(`[posthog-flag-types] Override applied: ${key} = ${override}`);
            }
            return !!override;
        }
        return !!this.posthog.isFeatureEnabled(key, options);
    }
    getVariant(key, options) {
        const override = this.options.overrides?.[key];
        if (override !== undefined) {
            if (this.options.debug) {
                console.log(`[posthog-flag-types] Override applied: ${key} = ${override}`);
            }
            return override;
        }
        return this.posthog.getFeatureFlag(key, options);
    }
}
exports.FlagClient = FlagClient;
function createFlagClient(posthog, options) {
    return new FlagClient(posthog, options);
}
//# sourceMappingURL=runtime.js.map