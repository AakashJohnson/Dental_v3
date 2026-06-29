import { customAlphabet } from 'nanoid';

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

export function id(prefix: string): string {
  return `${prefix}_${nano()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function shortCode(prefix: string): string {
  const n = customAlphabet('0123456789', 6)();
  return `${prefix}-${n}`;
}
