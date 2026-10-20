// Render the Outgrow sound effects to a WAV.
//   node audio/render.mjs                        → public/outgrow-sfx.wav (the whole film)
//   node audio/render.mjs out/x.wav strike,bed   → only those cue groups, same loudness
//   node audio/render.mjs --map                  → print the sound map as a Markdown table
// Deterministic: the same code always writes the same bytes.

import { registerHooks } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// the film's sources import without extensions (bundler style); resolve them to .ts for Node
registerHooks({
  resolve(spec, ctx, next) {
    try {
      return next(spec, ctx);
    } catch (e) {
      if (spec.startsWith(".")) return next(`${spec}.ts`, ctx);
      throw e;
    }
  },
});

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { DURATION } = await import("../src/timeline.ts");
const { buildScore } = await import("./score.ts");
const { reverb, master, limit, fadeOut, wav, integratedLoudness } = await import("./master.ts");
const { db } = await import("./dsp.ts");

const args = process.argv.slice(2);
const TARGET = -14;
const CEILING = -2.5; // sample peak; leaves room for inter-sample peaks and AAC encoding
const WET = db(-6); // close and fairly dry: the room is only a hint

const mixdown = (only) => {
  const { dry, send, cues } = buildScore(DURATION, only);
  dry.add(reverb(send, { size: 0.84, damp: 0.35, predelay: 0.02 }), WET);
  fadeOut(dry, 0.25);
  return { bus: dry, cues };
};

if (args[0] === "--map") {
  console.log("| Time (s) | Event | Sound |\n| ---: | --- | --- |");
  for (const c of buildScore(DURATION).cues) console.log(`| ${c.t.toFixed(2)} | ${c.event} | ${c.sound} |`);
  process.exit(0);
}

const out = resolve(root, args[0] ?? "public/outgrow-sfx.wav");
const groups = args[1]?.split(",");
const full = mixdown();
// a partial render keeps the full mix's gain, so sketches sound as they will in the film
const before = integratedLoudness(full.bus);
const stats = master(full.bus, TARGET, CEILING);
let bus = full.bus;
if (groups) {
  const part = mixdown((e) => groups.includes(e));
  const g = db(TARGET - before);
  for (let i = 0; i < part.bus.length; i++) {
    part.bus.L[i] *= g;
    part.bus.R[i] *= g;
  }
  limit(part.bus, CEILING);
  bus = part.bus;
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, wav(bus));
console.log(`${out}\n  full mix: ${stats.lufs.toFixed(2)} LUFS, peak ${stats.peak.toFixed(2)} dBFS`);
