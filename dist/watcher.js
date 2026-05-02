"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashFlags = hashFlags;
exports.startWatcher = startWatcher;
function hashFlags(flags) {
    return [...flags]
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((f) => `${f.key}:${f.variants.join(',')}:${f.active}`)
        .join('|');
}
function startWatcher(interval, onTick) {
    const run = async () => {
        try {
            await onTick();
        }
        catch (e) {
            console.error(`[watcher] Error during poll:`, e);
        }
        setTimeout(run, interval * 1000);
    };
    run();
}
//# sourceMappingURL=watcher.js.map