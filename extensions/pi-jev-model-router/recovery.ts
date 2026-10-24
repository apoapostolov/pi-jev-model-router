import { readFileSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/** Only errors that identify an unavailable model may park it. Auth and quota failures need a different owner. */
export function modelUnavailable(error: string | undefined): boolean {
  if (!error) return false;
  return /(?:\b(?:404|410)\b.{0,180}\b(?:model|deployment)\b|\b(?:model|deployment)\b.{0,180}\b(?:404|410|not found|does not exist|unavailable|removed|withdrawn)\b|\bunknown model\b)/i.test(error);
}

export function retryableProviderFailure(error: string | undefined): boolean {
  return !!error && /(?:\b(?:429|5\d\d)\b|rate limit|temporarily unavailable|service unavailable|overloaded)/i.test(error);
}

export function parkedPath(stateFile: string): string {
  return `${stateFile}.parked.json`;
}

/** A separate expiring overlay leaves the hand-edited route table untouched. */
export function readParked(path: string, now = Date.now()): Record<string, number> {
  try {
    const data: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    return Object.fromEntries(Object.entries(data).filter(([key, expiry]) =>
      key.includes("/") && typeof expiry === "number" && Number.isFinite(expiry) && expiry > now,
    ));
  } catch {
    return {};
  }
}

export function writeParked(path: string, entries: Record<string, number>): void {
  mkdirSync(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(entries, null, 2) + "\n", { mode: 0o600 });
  renameSync(temp, path);
}
