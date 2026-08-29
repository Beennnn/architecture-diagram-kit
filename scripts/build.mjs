// Extracts the SVGs from the cached packages into sources/, and writes the
// correspondence tables. Driven by protocols.json, products.json and roles.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = {
  tabler: path.join(ROOT, '.cache/tabler/package/icons/outline'),
  lucide: path.join(ROOT, '.cache/lucide/package/icons'),
  simple: path.join(ROOT, '.cache/simple-icons/package/icons'),
};
const SI_DATA = path.join(ROOT, '.cache/simple-icons/package/data/simple-icons.json');

for (const [name, dir] of Object.entries(SRC)) {
  if (!fs.existsSync(dir)) {
    console.error(`Cache missing for “${name}” (${dir}). Run ./regenerate.sh.`);
    process.exit(1);
  }
}

const { protocols } = JSON.parse(fs.readFileSync(path.join(ROOT, 'protocols.json'), 'utf8'));
const { products } = JSON.parse(fs.readFileSync(path.join(ROOT, 'products.json'), 'utf8'));
const { roles } = JSON.parse(fs.readFileSync(path.join(ROOT, 'roles.json'), 'utf8'));
const { shapes } = JSON.parse(fs.readFileSync(path.join(ROOT, 'shapes.json'), 'utf8'));

// A pictogram may serve one entry and one only. Two concepts behind the same
// symbol is the “overload” that semiotic clarity forbids — rule R2 of ADR
// 0003: the reader can no longer tell what the sign designates.
{
  const by = {};
  for (const e of [...protocols, ...products, ...roles]) {
    const sign = e.officialMark && e.simpleIcons ? `si:${e.simpleIcons}` : e.tabler ? `tb:${e.tabler}` : null;
    if (sign) (by[sign] ||= []).push(e.slug);
  }
  const shared = Object.entries(by).filter(([, v]) => v.length > 1);
  if (shared.length) {
    throw new Error(`Pictogram shared by several entries (symbol overload):\n  `
      + shared.map(([k, v]) => `${k} → ${v.join(', ')}`).join('\n  '));
  }
}

// A logotype is a mark that WRITES the name and shows nothing else: the lockup
// would only add a duplicate. Declaring one therefore assumes an official mark
// to speak with; without it there is nothing not to repeat.
for (const e of [...protocols, ...products, ...roles]) {
  if (e.logotype && !e.simpleIcons) {
    throw new Error(`“${e.slug}” is declared a logotype but has no official mark.`);
  }
}

// The shape grammar is normative: an unknown shape stops the build.
for (const e of [...products, ...roles]) {
  if (e.shape && !shapes[e.shape]) throw new Error(`Unknown shape for “${e.slug}”: “${e.shape}”. See shapes.json.`);
}

// Simple Icons indexes by title; we recover the slug the way their SDK does.
const siRaw = JSON.parse(fs.readFileSync(SI_DATA, 'utf8'));
const siList = Array.isArray(siRaw) ? siRaw : siRaw.icons;
const slugify = (s) => s.toLowerCase().replace(/\+/g, 'plus').replace(/\./g, 'dot').replace(/[^a-z0-9]/g, '');
const siBySlug = Object.fromEntries(siList.map((i) => [slugify(i.title), i]));

const readIcon = (dir, name, origin) => {
  const p = path.join(dir, `${name}.svg`);
  if (!fs.existsSync(p)) throw new Error(`Icon not found in ${origin}: “${name}”. Fix the source JSON.`);
  return fs.readFileSync(p, 'utf8').trim();
};

const OUT = path.join(ROOT, 'sources');  // raw glyphs, as published upstream
fs.rmSync(OUT, { recursive: true, force: true });
for (const d of ['tabler', 'lucide', 'marks']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const rows = protocols.map((p) => {
  p = { ...p, type: 'protocol' };
  const tSvg = readIcon(SRC.tabler, p.tabler, 'Tabler');
  const lSvg = readIcon(SRC.lucide, p.lucide, 'Lucide');
  fs.writeFileSync(path.join(OUT, 'tabler', `${p.slug}.svg`), `${tSvg}\n`);
  fs.writeFileSync(path.join(OUT, 'lucide', `${p.slug}.svg`), `${lSvg}\n`);

  let sSvg = null, hex = null, mark = null, source = null;
  if (p.simpleIcons) {
    sSvg = readIcon(SRC.simple, p.simpleIcons, 'Simple Icons');
    const meta = siBySlug[p.simpleIcons] || {};
    hex = meta.hex || null;
    mark = meta.title || p.simpleIcons;
    source = meta.source || null;
    fs.writeFileSync(path.join(OUT, 'marks', `${p.slug}.svg`), `${sSvg}\n`);
  }
  return { ...p, hex, mark, source, tSvg, lSvg, sSvg };
});

// Products have a single sign: their official logo, or a fallback pictogram
// when the mark is not redistributable (S3, Java).
const rowsProducts = products.map((p) => {
  let sSvg = null, hex = p.color ? p.color.replace('#', '') : null, mark = null, source = null;
  if (p.simpleIcons) {
    sSvg = readIcon(SRC.simple, p.simpleIcons, 'Simple Icons');
    const meta = siBySlug[p.simpleIcons] || {};
    hex = meta.hex || hex;
    mark = meta.title || p.simpleIcons;
    source = meta.source || null;
    fs.writeFileSync(path.join(OUT, 'marks', `${p.slug}.svg`), `${sSvg}\n`);
  }
  const tSvg = p.tabler ? readIcon(SRC.tabler, p.tabler, 'Tabler') : null;
  if (!sSvg && !tSvg) throw new Error(`Product “${p.slug}” has neither a logo nor a fallback pictogram.`);
  if (tSvg) fs.writeFileSync(path.join(OUT, 'tabler', `${p.slug}.svg`), `${tSvg}\n`);
  return { ...p, type: 'product', officialMark: Boolean(sSvg), hex, mark, source, tSvg, lSvg: null, sSvg };
});

// Roles never have a mark: they describe a function, not a product.
const rowsRoles = roles.map((r) => {
  const tSvg = readIcon(SRC.tabler, r.tabler, 'Tabler');
  fs.writeFileSync(path.join(OUT, 'tabler', `${r.slug}.svg`), `${tSvg}\n`);
  return { ...r, type: 'role', officialMark: false, hex: null, mark: null, source: null, tSvg, lSvg: null, sSvg: null };
});

const all = [...rows, ...rowsProducts, ...rowsRoles];

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
fs.writeFileSync(
  path.join(ROOT, 'mapping.csv'),
  ['name,type,family,tabler_mit,lucide_isc,official_logo_cc0,mark,color']
    .concat(all.map((r) => [r.label, r.type, r.family, r.tabler || '', r.lucide || '', r.simpleIcons || '', r.mark || '', r.hex ? (r.hex.startsWith('#') ? r.hex : `#${r.hex}`) : ''].map(csvCell).join(',')))
    .join('\n') + '\n'
);

fs.writeFileSync(
  path.join(ROOT, 'mapping.json'),
  JSON.stringify(all.map(({ tSvg, lSvg, sSvg, ...r }) => ({ ...r, hex: r.hex ? (r.hex.startsWith('#') ? r.hex : `#${r.hex}`) : null })), null, 2) + '\n'
);

// Reused by specimen.mjs, outside the repository.
fs.mkdirSync(path.join(ROOT, '.cache'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '.cache/rows.json'), JSON.stringify(all));

const withLogo = rows.filter((r) => r.simpleIcons).length;
const official = rows.filter((r) => r.officialMark).length;
console.log(`  ${rows.length} protocols · ${withLogo} logos catalogued, of which ${official} designate the protocol itself`);
console.log(`  ${rowsProducts.length} products · ${rowsProducts.filter((r) => r.officialMark).length} carry their official logo, ${rowsProducts.filter((r) => !r.officialMark).length} fall back to a pictogram`);
console.log(`  ${rowsRoles.length} infrastructure roles · generic pictogram, layer colour`);
