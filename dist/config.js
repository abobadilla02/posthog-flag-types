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
exports.loadConfig = loadConfig;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function loadConfig(cliArgs = {}) {
    const configPath = path.resolve(process.cwd(), 'posthog-flags.config.ts');
    const jsConfigPath = path.resolve(process.cwd(), 'posthog-flags.config.js');
    let fileConfig = {};
    if (fs.existsSync(configPath)) {
        // Basic support for TS config via ts-node or just reading as text and eval-ing 
        // but better to just use require if it was JS. 
        // For this CLI, we'll assume the user provides it or we use env vars.
        try {
            // In a real world scenario, we'd use something like 'cosmiconfig' or 'jiti'
            // but to keep dependencies low, we'll try a simple require for JS.
        }
        catch (e) { }
    }
    else if (fs.existsSync(jsConfigPath)) {
        try {
            fileConfig = require(jsConfigPath);
        }
        catch (e) { }
    }
    const envConfig = {
        apiKey: process.env.POSTHOG_API_KEY,
        projectId: process.env.POSTHOG_PROJECT_ID,
        host: process.env.POSTHOG_HOST,
    };
    const config = {
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
//# sourceMappingURL=config.js.map