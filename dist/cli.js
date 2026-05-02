"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("./config");
const fetcher_1 = require("./fetcher");
const generator_1 = require("./generator");
const override_generator_1 = require("./override-generator");
const writer_1 = require("./writer");
const watcher_1 = require("./watcher");
const program = new commander_1.Command();
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
const config = (0, config_1.loadConfig)({
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
    console.error(chalk_1.default.red('Error: --api-key and --project-id are required.'));
    process.exit(1);
}
let lastHash = '';
async function run() {
    try {
        const flags = await (0, fetcher_1.fetchFlags)({
            apiKey: config.apiKey,
            projectId: config.projectId,
            host: config.host,
            includeInactive: config.includeInactive,
        });
        const currentHash = (0, watcher_1.hashFlags)(flags);
        if (currentHash === lastHash) {
            return;
        }
        lastHash = currentHash;
        const outputContent = (0, generator_1.generateTypeScript)(flags);
        const outputPath = (0, writer_1.resolvedPath)(config.output);
        (0, writer_1.writeFile)(outputPath, outputContent);
        console.log(chalk_1.default.green(`✓ Generated flags at ${config.output}`));
        if (config.overrides) {
            const overridesPath = (0, writer_1.resolvedPath)(config.overridesOutput);
            let existingOverrides = {};
            if ((0, writer_1.fileExists)(overridesPath)) {
                const currentContent = (0, writer_1.readFile)(overridesPath);
                existingOverrides = (0, override_generator_1.parseExistingOverrides)(currentContent);
            }
            const overridesContent = (0, override_generator_1.generateOverridesTemplate)(flags, existingOverrides, config.output);
            (0, writer_1.writeFile)(overridesPath, overridesContent);
            (0, override_generator_1.ensureGitignored)(overridesPath);
            console.log(chalk_1.default.green(`✓ Generated overrides at ${config.overridesOutput}`));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error: ${error.message}`));
        if (!options.watch) {
            process.exit(1);
        }
    }
}
if (options.watch) {
    console.log(chalk_1.default.blue(`Watching PostHog for changes (interval: ${config.watchInterval}s)...`));
    (0, watcher_1.startWatcher)(config.watchInterval, run);
}
else {
    run();
}
//# sourceMappingURL=cli.js.map