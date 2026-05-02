"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExistingOverrides = parseExistingOverrides;
exports.generateOverridesTemplate = generateOverridesTemplate;
exports.ensureGitignored = ensureGitignored;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function parseExistingOverrides(content) {
    const overrides = {};
    // Match lines like: 'new-dashboard': true, or 'checkout-experiment': 'variant-a',
    // and capture the value. We handle booleans, strings, and undefined.
    const regex = /['"]([^'"]+)['"]\s*:\s*([^,\s]+)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        const value = match[2];
        if (value === 'undefined') {
            overrides[key] = undefined;
        }
        else {
            overrides[key] = value;
        }
    }
    return overrides;
}
function generateOverridesTemplate(flags, existingOverrides = {}, flagsFilePath = './posthog-flags') {
    const importPath = flagsFilePath.replace(/\.ts$/, '');
    const entries = flags.map(flag => {
        const existingValue = existingOverrides[flag.key];
        const value = existingValue !== undefined ? existingValue : 'undefined';
        const hint = flag.type === 'multivariate'
            ? `// ${flag.variants.map(v => `'${v}'`).join(' | ')}`
            : `// true | false`;
        return `  '${flag.key}': ${value}, ${' '.repeat(Math.max(0, 20 - value.length))}${hint}`;
    }).join('\n');
    return `/**
 * LOCAL DEVELOPMENT OVERRIDES — DO NOT COMMIT
 * This file is gitignored and personal to you.
 * Set any flag to a value to override PostHog in development.
 */

import type { FlagOverrides } from '${importPath}';

const overrides: FlagOverrides = {
${entries}
};

export default overrides;
`;
}
function ensureGitignored(filePath) {
    const gitignorePath = path.resolve(process.cwd(), '.gitignore');
    const relativePath = path.relative(process.cwd(), filePath);
    if (!fs.existsSync(gitignorePath)) {
        fs.writeFileSync(gitignorePath, `${relativePath}\n`);
        return;
    }
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const lines = content.split('\n');
    if (!lines.includes(relativePath)) {
        fs.appendFileSync(gitignorePath, `\n${relativePath}\n`);
    }
}
//# sourceMappingURL=override-generator.js.map