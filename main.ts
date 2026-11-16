// FUNDED — makefun-coin-promo-01 entry program (Node 22, standard library only).
//
// What this program does, and why:
//   The entry itself is the $FUNDED coin on pump.fun. This program's only job
//   is to hand the grader the launch receipt: it reads LAUNCH.json from the
//   repository root, checks that the receipt is well-formed (a Solana mint
//   address and the signature of the transaction that created the coin),
//   and writes it to the output directory the gate reads.
//
//   Validation is deliberate: a malformed LAUNCH.json should fail loudly
//   here, with a clear message, instead of being refused silently by the
//   gate later.
//
// Local run (outside the grader's container):
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Base58 alphabet used by Solana addresses and signatures (no 0, O, I, l).
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

function fail(message: string): never {
  console.error(`FUNDED entry: ${message}`);
  process.exit(1);
}

function checkField(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== 'string') fail(`LAUNCH.json field "${field}" is missing or not a string`);
  if (value.length < min || value.length > max) {
    fail(`LAUNCH.json field "${field}" has length ${value.length}, expected ${min}-${max}`);
  }
  if (!BASE58.test(value)) fail(`LAUNCH.json field "${field}" is not base58: ${value}`);
  return value;
}

const sourcePath = join(BOT_DIR, 'LAUNCH.json');
let raw: string;
try {
  raw = readFileSync(sourcePath, 'utf8');
} catch (err) {
  fail(`cannot read ${sourcePath}: ${(err as Error).message}`);
}

let launch: unknown;
try {
  launch = JSON.parse(raw!);
} catch (err) {
  fail(`LAUNCH.json is not valid JSON: ${(err as Error).message}`);
}

if (typeof launch !== 'object' || launch === null) fail('LAUNCH.json must be a JSON object');
const record = launch as Record<string, unknown>;

// A pump.fun mint address is 32-44 base58 chars; a transaction signature 86-88.
const mint = checkField(record.mint, 'mint', 32, 44);
const createSignature = checkField(record.create_signature, 'create_signature', 80, 90);

const receipt = `${JSON.stringify({ mint, create_signature: createSignature }, null, 2)}\n`;

mkdirSync(OUTPUT_DIR, { recursive: true });
const targetPath = join(OUTPUT_DIR, 'LAUNCH.json');
writeFileSync(targetPath, receipt);
console.log(`FUNDED entry: wrote ${targetPath} (mint ${mint}, create tx ${createSignature})`);
