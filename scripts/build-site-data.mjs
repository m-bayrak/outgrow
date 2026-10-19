// Collects every projects/*/project.json into docs/data/projects.json for the site.
// Checks that each version's video and poster exist under docs/. No dependencies.
// Usage: node scripts/build-site-data.mjs
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const docs = join(root, "docs");
const problems = [];

const projects = readdirSync(join(root, "projects"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(root, "projects", d.name, "project.json")))
  .map((d) => JSON.parse(readFileSync(join(root, "projects", d.name, "project.json"), "utf8")))
  .sort((a, b) => a.id.localeCompare(b.id));

for (const p of projects) {
  const ids = new Set();
  for (const v of p.versions) {
    if (ids.has(v.id)) problems.push(`${p.id}: duplicate version id ${v.id}`);
    ids.add(v.id);
    if (v.parent !== null && !ids.has(v.parent)) problems.push(`${p.id} ${v.id}: parent ${v.parent} must be listed earlier`);
    for (const key of ["video", "poster"]) {
      if (!v[key] || !existsSync(join(docs, v[key]))) problems.push(`${p.id} ${v.id}: missing docs/${v[key]}`);
    }
  }
}

if (problems.length) {
  console.error(problems.map((m) => `✗ ${m}`).join("\n"));
  process.exit(1);
}

mkdirSync(join(docs, "data"), { recursive: true });
writeFileSync(join(docs, "data", "projects.json"), JSON.stringify({ projects }, null, 2) + "\n");
console.log(`docs/data/projects.json: ${projects.length} project(s), ${projects.reduce((n, p) => n + p.versions.length, 0)} version(s)`);
