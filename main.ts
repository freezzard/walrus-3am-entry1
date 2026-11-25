// The 3 AM Excuse — make.fun entry, program/v1.
// A hardware wallet refuses to sign a transaction at 3 AM, in one line.
// The program writes exactly one line to /output/entry.txt, with no
// trailing newline, then reads it back and proves the bytes it wrote.
// Deterministic: no network, no clock, no randomness, no environment input.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const OUTPUT_PATH = "/output/entry.txt";
const MIN_CHARS = 1;
const MAX_CHARS = 200;
const MAX_WORDS = 40;

// ---------------------------------------------------------------------------
// The excuse, built from fragments so every word is chosen on purpose.
// The wallet speaks in the first person, as a device with its own priorities:
// it is the one sober adult in the relationship, and 3 AM is the hour its
// owner makes the worst decisions. The hour itself carries the joke: the
// refusal only makes sense at 3 AM, when the brain shops for frog coins.
// The line dodges the tired angles on purpose: no battery, no firmware,
// no cold storage, no update. The joke is a relationship, not a spec sheet.
// ---------------------------------------------------------------------------

const FRAGMENTS: readonly string[] = [
  "At 3 AM I sign nothing",
  "— that's the hour your brain buys frog coins,",
  "and somebody in this relationship has to stay sober.",
];

const FORBIDDEN_TOPICS: readonly string[] = [
  "battery",
  "firmware",
  "cold storage",
  "update",
];

const REQUIRED_MARKERS: readonly string[] = [
  "3 AM",
  "sign",
  "sober",
];

function joinFragments(parts: readonly string[]): string {
  const cleaned: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length > 0) {
      cleaned.push(trimmed);
    }
  }
  return cleaned.join(" ");
}

function countWords(line: string): number {
  const words = line.split(/\s+/u).filter((word) => word.length > 0);
  return words.length;
}

function countChars(line: string): number {
  return [...line].length;
}

function hasForbiddenTopic(line: string): boolean {
  const lowered = line.toLowerCase();
  for (const topic of FORBIDDEN_TOPICS) {
    if (lowered.includes(topic)) {
      return true;
    }
  }
  return false;
}

function hasRequiredMarkers(line: string): boolean {
  for (const marker of REQUIRED_MARKERS) {
    if (line.includes(marker) === false) {
      return false;
    }
  }
  return true;
}

function isSingleLine(line: string): boolean {
  if (line.includes("\n")) {
    return false;
  }
  if (line.includes("\r")) {
    return false;
  }
  return true;
}

function isNotBlank(line: string): boolean {
  return line.trim().length > 0;
}

function isWithinGate(line: string): boolean {
  const chars = countChars(line);
  if (chars < MIN_CHARS) {
    return false;
  }
  if (chars > MAX_CHARS) {
    return false;
  }
  return true;
}

function roundTripsUtf8(line: string): boolean {
  const encoded = new TextEncoder().encode(line);
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(encoded);
  return decoded === line;
}

function checkLine(line: string): string[] {
  const failures: string[] = [];
  if (isWithinGate(line) === false) {
    failures.push(
      "length outside gate 1-200: " + String(countChars(line)) + " chars",
    );
  }
  if (isNotBlank(line) === false) {
    failures.push("line is blank or whitespace only");
  }
  if (isSingleLine(line) === false) {
    failures.push("line spans more than one line");
  }
  if (roundTripsUtf8(line) === false) {
    failures.push("line does not round-trip through UTF-8");
  }
  if (hasForbiddenTopic(line)) {
    failures.push("line recycles a banned cliche topic");
  }
  if (hasRequiredMarkers(line) === false) {
    failures.push("line misses a required marker");
  }
  if (countWords(line) > MAX_WORDS) {
    failures.push("line exceeds word budget: " + String(countWords(line)));
  }
  return failures;
}

function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function ensureOutputDir(path: string): void {
  const slash = path.lastIndexOf("/");
  if (slash <= 0) {
    return;
  }
  const dir = path.slice(0, slash);
  try { mkdirSync(dir, { recursive: true }); } catch (caughtFailure) {
    throw new Error("cannot create output dir " + dir + ": " + String(caughtFailure));
  }
}

function writeEntry(path: string, line: string): void {
  ensureOutputDir(path);
  try { writeFileSync(path, line, "utf8"); } catch (caughtFailure) {
    throw new Error("cannot write " + path + ": " + String(caughtFailure));
  }
}

function readEntryBack(path: string): string {
  try { return readFileSync(path, "utf8"); } catch (caughtFailure) {
    throw new Error("cannot read back " + path + ": " + String(caughtFailure));
  }
}

function fail(message: string): never {
  console.error("FAIL: " + message);
  process.exit(1);
}

function main(): void {
  const line = joinFragments(FRAGMENTS);
  const failures = checkLine(line);
  if (failures.length > 0) {
    fail("gate failures: " + failures.join("; "));
  }
  writeEntry(OUTPUT_PATH, line);
  const back = readEntryBack(OUTPUT_PATH);
  if (back !== line) {
    fail("read-back differs from written line");
  }
  const chars = countChars(line);
  const words = countWords(line);
  const hash = sha256Hex(line);
  console.log("ok chars=" + String(chars) + " words=" + String(words));
  console.log("sha256=" + hash);
  console.log("line=" + line);
}

main();
