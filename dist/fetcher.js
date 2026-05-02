"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toConstName = toConstName;
exports.fetchFlags = fetchFlags;
/**
 * Converts any flag key to SCREAMING_SNAKE_CASE.
 * 'new-dashboard' -> 'NEW_DASHBOARD'
 * 'checkout-experiment_v2' -> 'CHECKOUT_EXPERIMENT_V2'
 */
function toConstName(key) {
    return key
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toUpperCase();
}
async function fetchFlags(config) {
    const { apiKey, projectId, host = 'https://us.posthog.com', includeInactive = false } = config;
    const baseUrl = `${host.replace(/\/$/, '')}/api/projects/${projectId}/feature_flags/`;
    let url = `${baseUrl}?limit=100`;
    const allFlags = [];
    while (url) {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication failed. Check your API key needs Feature flags: Read scope.');
            }
            if (response.status === 404) {
                throw new Error('Project not found. Double-check your project ID.');
            }
            const text = await response.text();
            throw new Error(`PostHog API error (${response.status}): ${text.slice(0, 400)}`);
        }
        const data = (await response.json());
        for (const flag of data.results) {
            const isActive = flag.active && !flag.deleted;
            if (!includeInactive && !isActive) {
                continue;
            }
            const variants = flag.filters?.multivariate?.variants?.map((v) => v.key) || [];
            const type = variants.length > 0 ? 'multivariate' : 'boolean';
            allFlags.push({
                key: flag.key,
                name: flag.name || flag.key,
                constName: toConstName(flag.key),
                type,
                active: isActive,
                variants,
            });
        }
        url = data.next;
    }
    return allFlags;
}
//# sourceMappingURL=fetcher.js.map