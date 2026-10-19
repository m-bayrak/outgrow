// Makes the web copy of every study image listed in projects/*/project.json:
// a 720 px wide JPEG at docs/<study.image>, made from <study.source>.
// Existing copies are left alone (published files are never replaced).
// Usage: node scripts/encode-studies.mjs        (needs ffmpeg)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let made = 0;

for (const dir of readdirSync(join(root, "projects"))) {
  const manifest = join(root, "projects", dir, "project.json");
  if (!existsSync(manifest)) continue;
  for (const s of JSON.parse(readFileSync(manifest, "utf8")).studies ?? []) {
    const out = join(root, "docs", s.image);
    if (existsSync(out)) continue;
    mkdirSync(dirname(out), { recursive: true });
    execFileSync("ffmpeg", ["-loglevel", "error", "-i", join(root, s.source), "-vf", "scale=720:-2", "-q:v", "4", out]);
    console.log(`made docs/${s.image}`);
    made++;
  }
}
console.log(`${made} new web cop${made === 1 ? "y" : "ies"}`);
