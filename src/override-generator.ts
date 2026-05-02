import * as fs from 'fs';
import * as path from 'path';
import { ParsedFlag } from './types';

export function parseExistingOverrides(content: string): Record<string, string | undefined> {
  const overrides: Record<string, string | undefined> = {};
  // Match lines like: 'new-dashboard': true, or 'checkout-experiment': 'variant-a',
  // and capture the value. We handle booleans, strings, and undefined.
  const regex = /['"]([^'"]+)['"]\s*:\s*([^,\s]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const value = match[2];
    if (value === 'undefined') {
      overrides[key] = undefined;
    } else {
      overrides[key] = value;
    }
  }
  return overrides;
}

export function generateOverridesTemplate(
  flags: ParsedFlag[],
  existingOverrides: Record<string, string | undefined> = {},
  flagsFilePath: string = './posthog-flags'
): string {
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

export function ensureGitignored(filePath: string): void {
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
