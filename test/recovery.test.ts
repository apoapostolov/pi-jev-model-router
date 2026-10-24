import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { modelUnavailable, readParked, writeParked } from "../extensions/pi-jev-model-router/recovery";

describe("model recovery", () => {
  test("only model-specific unavailability parks a route", () => {
    for (const error of ["404 model deepseek-v4-flash not found", "model is unavailable (404)", "unknown model", "deployment removed"]) {
      expect(modelUnavailable(error)).toBe(true);
    }
    for (const error of ["401 invalid API key", "429 quota exhausted", "503 upstream unavailable", "404 endpoint not found", "context overflow", "request aborted"]) {
      expect(modelUnavailable(error)).toBe(false);
    }
  });

  test("drops expired and malformed parks without deleting user config", () => {
    const dir = mkdtempSync(join(tmpdir(), "jev-parks-"));
    const path = join(dir, "state.parked.json");
    try {
      writeParked(path, { "test/expired": 100, "test/active": 1000, "bad": 1000 });
      expect(readParked(path, 500)).toEqual({ "test/active": 1000 });
      expect(readParked(path, 1000)).toEqual({});
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
