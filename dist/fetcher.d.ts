import { ParsedFlag } from './types';
/**
 * Converts any flag key to SCREAMING_SNAKE_CASE.
 * 'new-dashboard' -> 'NEW_DASHBOARD'
 * 'checkout-experiment_v2' -> 'CHECKOUT_EXPERIMENT_V2'
 */
export declare function toConstName(key: string): string;
export declare function fetchFlags(config: {
    apiKey: string;
    projectId: string | number;
    host?: string;
    includeInactive?: boolean;
}): Promise<ParsedFlag[]>;
