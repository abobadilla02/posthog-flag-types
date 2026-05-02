export interface PostHogFlagTypesConfig {
    apiKey: string;
    projectId: string | number;
    output?: string;
    overridesOutput?: string;
    host?: string;
    includeInactive?: boolean;
    watchInterval?: number;
    overrides?: boolean;
}
export interface ParsedFlag {
    key: string;
    name: string;
    constName: string;
    type: 'boolean' | 'multivariate';
    active: boolean;
    variants: string[];
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
