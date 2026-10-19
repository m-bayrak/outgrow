// Builds a project page from data/projects.json. The chosen version or study is
// shown large; everything sits on one lineage tree that grows upward from the
// brief: versions (videos) as large dots, studies (stills) as small ones.
// The chosen item's ancestry is drawn as an orange trace, like the films' own.

const SVG = "http://www.w3.org/2000/svg";
const ROW_VERSION = 88; // vertical step for a version row
const ROW_STUDY = 58; // vertical step for a study row
const ROOT_GAP = 64; // space between the brief and the first row
const REPO = "https://github.com/m-bayrak/outgrow";

const narrow = window.matchMedia("(max-width: 600px)");
const column = () => (narrow.matches ? 72 : 160); // horizontal distance between lineages
const fan = () => (narrow.matches ? 15 : 22); // spacing of studies that share a row
const labelGap = () => (narrow.matches ? 26 : 40);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const byId = (id) => document.getElementById(id);
const el = (tag, attrs = {}, text) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text) node.textContent = text;
  return node;
};
const svgEl = (tag, attrs) => {
  const node = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

const formatDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: narrow.matches ? "short" : "long",
    year: "numeric",
  });
const authorName = (a) => a.charAt(0).toUpperCase() + a.slice(1);

/** Versions and studies as one list of nodes; `link` is the edge drawn into a node. */
const nodesOf = (project) => {
  const versions = project.versions.map((v, i) => ({ ...v, kind: "version", seq: i, link: v.basedOn ?? v.parent }));
  const studies = (project.studies ?? []).map((s, i) => ({ ...s, kind: "study", seq: i, link: s.parent }));
  return [...versions, ...studies];
};

/**
 * Rows from bottom to top: a node is placed only after the node it grows from;
 * among the ready ones the earliest date goes first, studies before versions,
 * then manifest order. Studies sharing a group and a parent share a row.
 */
const rowsOf = (nodes) => {
  const placed = new Set();
  const rows = [];
  const rank = (n) => [n.date, n.kind === "study" ? 0 : 1, n.seq];
  const before = (a, b) => {
    const [x, y] = [rank(a), rank(b)];
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
    return 0;
  };
  while (placed.size < nodes.length) {
    const ready = nodes.filter((n) => !placed.has(n.id) && (n.link === null || placed.has(n.link))).sort(before);
    if (!ready.length) break; // broken manifest; build-site-data.mjs reports it
    const first = ready[0];
    const row = first.group ? ready.filter((n) => n.group === first.group && n.link === first.link) : [first];
    row.forEach((n) => placed.add(n.id));
    rows.push(row);
  }
  return rows;
};

const layout = (nodes) => {
  const rows = rowsOf(nodes);
  const authors = [...new Set(nodes.filter((n) => n.kind === "version").map((n) => n.author))];
  const width = Math.max(1, authors.length - 1) * column();
  const step = (row) => (row[0].kind === "version" ? ROW_VERSION : ROW_STUDY);
  const height = ROOT_GAP + rows.reduce((h, r) => h + step(r), 0) - step(rows[rows.length - 1]);
  const root = { x: width / 2, y: height };
  const pos = new Map();
  let y = height - ROOT_GAP;
  for (const row of rows) {
    const anchor = (n) =>
      n.kind === "version" ? authors.indexOf(n.author) * column() : n.link ? pos.get(n.link).x : root.x;
    row.forEach((n, k) => pos.set(n.id, { x: anchor(n) + (k - (row.length - 1) / 2) * fan(), y }));
    y -= step(row);
  }
  return { rows, pos, root, height, width };
};

/** An S-shaped stroke from a lower point up to a higher one. */
const sCurve = (a, b) => {
  const k = (a.y - b.y) * 0.55;
  return `M${a.x} ${a.y} C${a.x} ${a.y - k} ${b.x} ${b.y + k} ${b.x} ${b.y}`;
};

const ancestry = (nodes, id) => {
  const map = new Map(nodes.map((n) => [n.id, n]));
  const chain = [];
  for (let n = map.get(id); n; n = n.link ? map.get(n.link) : null) chain.unshift(n);
  return chain;
};

const render = (project, nodes, selectedId) => {
  const tree = byId("tree");
  const { rows, pos, root, height, width } = layout(nodes);
  const xs = [...pos.values()].map((p) => p.x);
  const left = 12 - Math.min(0, ...xs); // room for fanned studies left of the first lineage
  const P = (p) => ({ x: p.x + left, y: p.y });
  const labelX = Math.max(width, ...xs) + left + labelGap();
  const top = 14; // room above the highest dot

  tree.replaceChildren();
  tree.style.height = `${height + top + 14}px`;
  const T = (p) => ({ x: P(p).x, y: P(p).y + top });

  const svg = svgEl("svg", { width: "100%", height: height + top + 14, "aria-hidden": "true" });
  for (const n of nodes) {
    const from = n.link ? pos.get(n.link) : root;
    svg.append(svgEl("path", { class: n.kind === "study" ? "branch twig" : "branch", d: sCurve(T(from), T(pos.get(n.id))) }));
  }
  let d = "";
  let prev = root;
  for (const n of ancestry(nodes, selectedId)) {
    const seg = sCurve(T(prev), T(pos.get(n.id)));
    d += d ? seg.replace(/^M[^C]+/, "") : seg;
    prev = pos.get(n.id);
  }
  const trace = svgEl("path", { class: "trace", d });
  svg.append(trace);
  svg.append(svgEl("circle", { class: "root-ring", cx: T(root).x, cy: T(root).y, r: 9 }));
  tree.append(svg);

  const rootLabel = el("span", { class: "root-label" }, "Brief");
  rootLabel.style.left = `${T(root).x}px`;
  rootLabel.style.top = `${T(root).y}px`;
  tree.append(rootLabel);

  // dots: one button per version or study
  for (const n of nodes) {
    const p = T(pos.get(n.id));
    const dot = el("button", {
      class: `dot ${n.kind} ${n.status ?? ""}`.trim(),
      type: "button",
      "aria-label": n.kind === "version" ? `Version ${n.id}: ${n.title}` : `Study: ${n.title}`,
      "aria-current": String(n.id === selectedId),
      title: n.title,
    });
    dot.style.left = `${p.x}px`;
    dot.style.top = `${p.y}px`;
    dot.addEventListener("click", () => select(project, nodes, n.id, true));
    tree.append(dot);
  }

  // one label per row, in a column right of the tree so branches never cross text
  for (const row of rows) {
    const first = row[0];
    const p = T(pos.get(first.id));
    const selectedInRow = row.find((n) => n.id === selectedId);
    const target = selectedInRow ?? row.find((n) => n.status === "chosen") ?? first;
    const label = el("button", {
      class: `label ${first.kind}`,
      type: "button",
      "aria-current": String(Boolean(selectedInRow)),
    });
    label.style.left = `${labelX}px`;
    label.style.top = `${p.y}px`;
    const name = el("span", { class: "name" });
    if (first.kind === "version") name.append(el("span", { class: "number" }, first.id));
    name.append(document.createTextNode(row.length > 1 ? first.group : first.title));
    const extra =
      first.kind === "version"
        ? `, ${first.duration} s`
        : row.length > 1
          ? `, ${row.length} stills`
          : first.status === "chosen" || first.status === "explored"
            ? ""
            : `, ${first.status}`;
    label.append(name, el("span", { class: "meta" }, `${authorName(first.author)}, ${formatDate(first.date)}${extra}`));
    label.addEventListener("click", () => select(project, nodes, target.id, true));
    tree.append(label);
  }

  // the one orchestrated motion: the trace grows from the brief to the chosen item
  if (!reducedMotion) {
    const length = trace.getTotalLength();
    trace.style.strokeDasharray = `${length}`;
    trace.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
      duration: 900,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
      fill: "forwards",
    });
  }
};

/** The words behind an item: the owner's requests first, then the exact tool prompts. */
const renderPrompts = (item) => {
  const box = byId("prompts");
  box.replaceChildren();
  const prompts = [...(item.prompts ?? [])].sort((a, b) => (a.author === "owner" ? 0 : 1) - (b.author === "owner" ? 0 : 1));
  for (const p of prompts) {
    const details = el("details", { class: "prompt" });
    const label = p.author === "owner" ? "Owner's request" : `Prompt for ${p.tool}`;
    const summary = el("summary", {}, label);
    summary.append(el("span", { class: "prompt-title" }, p.title.replace(/^Owner('s)? /i, "")));
    details.append(summary);
    details.append(el("pre", { class: "prompt-text" }, p.text));
    const link = el("a", { class: "prompt-file", href: `${REPO}/blob/main/${p.file}` }, "Prompt file");
    details.append(link);
    box.append(details);
  }
};

let current = "";

const select = (project, nodes, id, fromClick = false) => {
  const latest = project.versions[project.versions.length - 1];
  const n = nodes.find((x) => x.id === id) ?? nodes.find((x) => x.id === latest.id);
  const player = byId("player");
  const still = byId("still");
  const source = byId("source");

  if (n.kind === "version") {
    still.hidden = true;
    player.hidden = false;
    player.poster = n.poster;
    if (!player.src.endsWith(n.video)) player.src = n.video;
    player.setAttribute("aria-label", `${project.title}, version ${n.id}: ${n.title}`);
    player.play().catch(() => {});
    byId("detail-title").textContent = `${n.id} ${n.title}`;
    byId("summary").textContent = n.summary;
    source.href = `${REPO}/tree/main/${n.source}`;
    source.textContent = `Code for version ${n.id}`;
  } else {
    player.pause();
    player.hidden = true;
    still.hidden = false;
    still.src = n.image;
    still.alt = `${n.title}. ${n.note}`;
    byId("detail-title").textContent = n.title;
    byId("summary").textContent = n.note;
    source.href = `${REPO}/blob/main/${encodeURI(n.source)}`;
    source.textContent = "Original image";
  }

  renderPrompts(n);
  current = n.id;
  render(project, nodes, n.id);
  if (fromClick) history.replaceState(null, "", `#${n.id}`);
};

const main = async () => {
  const data = await fetch("data/projects.json", { cache: "no-cache" }).then((r) => r.json()); // always revalidate, so new versions show up at once
  const wanted = new URLSearchParams(location.search).get("p");
  const project = data.projects.find((p) => p.id === wanted) ?? data.projects[0];
  const nodes = nodesOf(project);
  document.title = project.title;
  byId("title").textContent = project.title;
  byId("statement").textContent = project.statement;
  select(project, nodes, location.hash.slice(1));
  narrow.addEventListener("change", () => render(project, nodes, current));
};

main();
