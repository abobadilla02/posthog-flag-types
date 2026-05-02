import { ParsedFlag } from './types';
export declare function parseExistingOverrides(content: string): Record<string, string | undefined>;
export declare function generateOverridesTemplate(flags: ParsedFlag[], existingOverrides?: Record<string, string | undefined>, flagsFilePath?: string): string;
export declare function ensureGitignored(filePath: string): void;
