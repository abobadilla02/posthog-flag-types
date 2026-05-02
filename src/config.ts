import * as path from 'path';
import * as fs from 'fs';
import { PostHogFlagTypesConfig } from './types';

export function loadConfig(cliArgs: Partial<PostHogFlagTypesConfig> = {}): PostHogFlagTypesConfig {
  const configPath = path.resolve(process.cwd(), 'posthog-flags.config.ts');
  const jsConfigPath = path.resolve(process.cwd(), 'posthog-flags.config.js');
  
  let fileConfig: Partial<PostHogFlagTypesConfig> = {};

  if (fs.existsSync(configPath)) {
    // Basic support for TS config via ts-node or just reading as text and eval-ing 
    // but better to just use require if it was JS. 
    // For this CLI, we'll assume the user provides it or we use env vars.
    try {
      // In a real world scenario, we'd use something like 'cosmiconfig' or 'jiti'
      // but to keep dependencies low, we'll try a simple require for JS.
    } catch (e) {}
  } else if (fs.existsSync(jsConfigPath)) {
    try {
      fileConfig = require(jsConfigPath);
    } catch (e) {}
  }

  const envConfig: Partial<PostHogFlagTypesConfig> = {
    apiKey: process.env.POSTHOG_API_KEY,
    projectId: process.env.POSTHOG_PROJECT_ID,
    host: process.env.POSTHOG_HOST,
  };

  const config: PostHogFlagTypesConfig = {
    apiKey: cliArgs.apiKey || envConfig.apiKey || fileConfig.apiKey || '',
    projectId: cliArgs.projectId || envConfig.projectId || fileConfig.projectId || '',
    output: cliArgs.output || fileConfig.output || './posthog-flags.ts',
    overridesOutput: cliArgs.overridesOutput || fileConfig.overridesOutput || './posthog-flags.overrides.ts',
    host: cliArgs.host || envConfig.host || fileConfig.host || 'https://us.posthog.com',
    includeInactive: cliArgs.includeInactive ?? fileConfig.includeInactive ?? false,
    watchInterval: cliArgs.watchInterval ?? fileConfig.watchInterval ?? 30,
    overrides: cliArgs.overrides ?? fileConfig.overrides ?? true,
  };

  return config;
}
