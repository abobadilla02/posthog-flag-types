import { ParsedFlag } from './types';
export declare function hashFlags(flags: ParsedFlag[]): string;
export declare function startWatcher(interval: number, onTick: () => Promise<void>): void;
