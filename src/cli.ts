import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from './config';
import { fetchFlags } from './fetcher';
import { generateTypeScript } from './generator';
import { 
  generateOverridesTemplate, 
  parseExistingOverrides, 
  ensureGitignored 
} from './override-generator';
import { writeFile, fileExists, readFile, resolvedPath } from './writer';
import { hashFlags, startWatcher } from './watcher';

const program = new Command();

program
  .name('posthog-flag-types')
  .description('Generate type-safe TypeScript constants from PostHog feature flags')
  .version('0.1.0')
  .option('--api-key <key>', 'PostHog personal API key')
  .option('--project-id <id>', 'PostHog project ID')
  .option('--output <path>', 'Flags output file', './posthog-flags.ts')
  .option('--overrides-output <path>', 'Overrides output file', './posthog-flags.overrides.ts')
  .option('--host <url>', 'PostHog host', 'https://us.posthog.com')
  .option('--include-inactive', 'Include inactive/deleted flags', false)
  .option('--no-overrides', 'Skip generating the overrides file')
  .option('--watch', 'Watch mode — poll and regenerate on change')
  .option('--watch-interval <secs>', 'Polling interval', '30');

program.parse();

const options = program.opts();
const config = loadConfig({
  apiKey: options.apiKey,
  projectId: options.projectId,
  output: options.output,
  overridesOutput: options.overridesOutput,
  host: options.host,
  includeInactive: options.includeInactive,
  watchInterval: options.watchInterval ? parseInt(options.watchInterval, 10) : undefined,
  overrides: options.overrides,
});

if (!config.apiKey || !config.projectId) {
  console.error(chalk.red('Error: --api-key and --project-id are required.'));
  process.exit(1);
}

let lastHash = '';

async function run() {
  try {
    const flags = await fetchFlags({
      apiKey: config.apiKey,
      projectId: config.projectId,
      host: config.host,
      includeInactive: config.includeInactive,
    });

    const currentHash = hashFlags(flags);
    if (currentHash === lastHash) {
      return;
    }
    lastHash = currentHash;

    const outputContent = generateTypeScript(flags);
    const outputPath = resolvedPath(config.output!);
    writeFile(outputPath, outputContent);
    console.log(chalk.green(`✓ Generated flags at ${config.output}`));

    if (config.overrides) {
      const overridesPath = resolvedPath(config.overridesOutput!);
      let existingOverrides = {};
      
      if (fileExists(overridesPath)) {
        const currentContent = readFile(overridesPath);
        existingOverrides = parseExistingOverrides(currentContent);
      }

      const overridesContent = generateOverridesTemplate(
        flags,
        existingOverrides,
        config.output!
      );
      writeFile(overridesPath, overridesContent);
      ensureGitignored(overridesPath);
      console.log(chalk.green(`✓ Generated overrides at ${config.overridesOutput}`));
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    if (!options.watch) {
      process.exit(1);
    }
  }
}

if (options.watch) {
  console.log(chalk.blue(`Watching PostHog for changes (interval: ${config.watchInterval}s)...`));
  startWatcher(config.watchInterval!, run);
} else {
  run();
}
