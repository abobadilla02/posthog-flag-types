import { ParsedFlag } from './types';

export function hashFlags(flags: ParsedFlag[]): string {
  return [...flags]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((f) => `${f.key}:${f.variants.join(',')}:${f.active}`)
    .join('|');
}

export function startWatcher(
  interval: number,
  onTick: () => Promise<void>
): void {
  const run = async () => {
    try {
      await onTick();
    } catch (e) {
      console.error(`[watcher] Error during poll:`, e);
    }
    setTimeout(run, interval * 1000);
  };
  
  run();
}
