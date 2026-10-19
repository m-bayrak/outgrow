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
  p.studies ??= [];
  const ids = new Set();
  for (const v of p.versions) {
    if (ids.has(v.id)) problems.push(`${p.id}: duplicate version id ${v.id}`);
    ids.add(v.id);
    if (v.parent !== null && !ids.has(v.parent)) problems.push(`${p.id} ${v.id}: parent ${v.parent} must be listed earlier`);
    for (const key of ["video", "poster"]) {
      if (!v[key] || !existsSync(join(docs, v[key]))) problems.push(`${p.id} ${v.id}: missing docs/${v[key]}`);
    }
  }
  // studies may hang off the brief (null), a version or another study, and versions may be based on a study
  const all = new Set([...ids, ...p.studies.map((s) => s.id)]);
  for (const s of p.studies) {
    if (ids.has(s.id)) problems.push(`${p.id} ${s.id}: study id clashes with a version id`);
    if (s.parent !== null && !all.has(s.parent)) problems.push(`${p.id} ${s.id}: unknown parent ${s.parent}`);
    if (!["chosen", "explored", "superseded", "proposed"].includes(s.status)) problems.push(`${p.id} ${s.id}: bad status ${s.status}`);
    if (!existsSync(join(root, s.source))) problems.push(`${p.id} ${s.id}: missing ${s.source}`);
    if (!existsSync(join(docs, s.image))) problems.push(`${p.id} ${s.id}: missing docs/${s.image} (run scripts/encode-studies.mjs)`);
  }
  for (const v of p.versions) {
    if (v.basedOn && !all.has(v.basedOn)) problems.push(`${p.id} ${v.id}: unknown basedOn ${v.basedOn}`);
  }
}

// Prompts: every projects/<p>/prompts/*.md with front matter is attached to the
// versions and studies named in its `used_for`, so nothing is linked by hand.
const parsePrompt = (text, file) => {
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) return null;
  const meta = {};
  for (const line of fm[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  let usedFor = [];
  try {
    usedFor = JSON.parse(meta.used_for ?? "[]");
  } catch {
    problems.push(`${file}: used_for must be a JSON array like ["e1","e2"]`);
  }
  const title = text.match(/^# (.+)$/m)?.[1]?.trim() ?? file;
  const body = text.match(/## Prompt\s+```text\n([\s\S]*?)\n```/)?.[1];
  if (!body) problems.push(`${file}: needs a "## Prompt" section with a \`\`\`text block`);
  return { file, title, date: meta.date, author: meta.author, tool: meta.tool, usedFor, text: body ?? "" };
};

for (const p of projects) {
  const dir = join(root, "projects", p.id, "prompts");
  if (!existsSync(dir)) continue;
  const prompts = readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()
    .map((f) => parsePrompt(readFileSync(join(dir, f), "utf8"), `projects/${p.id}/prompts/${f}`))
    .filter(Boolean);
  const items = new Map([...p.versions, ...p.studies].map((x) => [x.id, x]));
  for (const pr of prompts) {
    for (const id of pr.usedFor) {
      const item = items.get(id);
      if (!item) {
        problems.push(`${pr.file}: used_for names unknown id ${id}`);
        continue;
      }
      (item.prompts ??= []).push({ file: pr.file, title: pr.title, date: pr.date, author: pr.author, tool: pr.tool, text: pr.text });
    }
  }
}

if (problems.length) {
  console.error(problems.map((m) => `✗ ${m}`).join("\n"));
  process.exit(1);
}

mkdirSync(join(docs, "data"), { recursive: true });
writeFileSync(join(docs, "data", "projects.json"), JSON.stringify({ projects }, null, 2) + "\n");
const count = (key) => projects.reduce((n, p) => n + p[key].length, 0);
const linked = projects.reduce((n, p) => n + [...p.versions, ...p.studies].filter((x) => x.prompts).length, 0);
console.log(`docs/data/projects.json: ${projects.length} project(s), ${count("versions")} version(s), ${count("studies")} stud${count("studies") === 1 ? "y" : "ies"}, prompts on ${linked} item(s)`);
