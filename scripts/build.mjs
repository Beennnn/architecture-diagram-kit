// Extrait les SVG des paquets en cache vers icons/, et écrit les tables
// de correspondance. Piloté par protocoles.json.
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
    console.error(`Cache manquant pour « ${name} » (${dir}). Lancez ./regenerer.sh.`);
    process.exit(1);
  }
}

const { protocoles } = JSON.parse(fs.readFileSync(path.join(ROOT, 'protocoles.json'), 'utf8'));

// Simple Icons indexe par titre ; on retrouve le slug comme le fait leur SDK.
const siRaw = JSON.parse(fs.readFileSync(SI_DATA, 'utf8'));
const siList = Array.isArray(siRaw) ? siRaw : siRaw.icons;
const slugify = (s) => s.toLowerCase().replace(/\+/g, 'plus').replace(/\./g, 'dot').replace(/[^a-z0-9]/g, '');
const siBySlug = Object.fromEntries(siList.map((i) => [slugify(i.title), i]));

const readIcon = (dir, name, origine) => {
  const p = path.join(dir, `${name}.svg`);
  if (!fs.existsSync(p)) throw new Error(`Icône introuvable dans ${origine} : « ${name} ». Corrigez protocoles.json.`);
  return fs.readFileSync(p, 'utf8').trim();
};

const OUT = path.join(ROOT, 'icons');
fs.rmSync(OUT, { recursive: true, force: true });
for (const d of ['tabler', 'lucide', 'logos-officiels']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const rows = protocoles.map((p) => {
  const tSvg = readIcon(SRC.tabler, p.tabler, 'Tabler');
  const lSvg = readIcon(SRC.lucide, p.lucide, 'Lucide');
  fs.writeFileSync(path.join(OUT, 'tabler', `${p.slug}.svg`), `${tSvg}\n`);
  fs.writeFileSync(path.join(OUT, 'lucide', `${p.slug}.svg`), `${lSvg}\n`);

  let sSvg = null, hex = null, marque = null, source = null;
  if (p.simpleIcons) {
    sSvg = readIcon(SRC.simple, p.simpleIcons, 'Simple Icons');
    const meta = siBySlug[p.simpleIcons] || {};
    hex = meta.hex || null;
    marque = meta.title || p.simpleIcons;
    source = meta.source || null;
    fs.writeFileSync(path.join(OUT, 'logos-officiels', `${p.slug}.svg`), `${sSvg}\n`);
  }
  return { ...p, hex, marque, source, tSvg, lSvg, sSvg };
});

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
fs.writeFileSync(
  path.join(ROOT, 'mapping.csv'),
  ['protocole,famille,tabler_mit,lucide_isc,logo_officiel_cc0,marque,couleur_marque']
    .concat(rows.map((r) => [r.label, r.famille, r.tabler, r.lucide, r.simpleIcons || '', r.marque || '', r.hex ? `#${r.hex}` : ''].map(csvCell).join(',')))
    .join('\n') + '\n'
);

fs.writeFileSync(
  path.join(ROOT, 'mapping.json'),
  JSON.stringify(rows.map(({ tSvg, lSvg, sSvg, ...r }) => ({ ...r, hex: r.hex ? `#${r.hex}` : null })), null, 2) + '\n'
);

// Réutilisé par specimen.mjs, hors du dépôt.
fs.mkdirSync(path.join(ROOT, '.cache'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '.cache/rows.json'), JSON.stringify(rows));

const avecLogo = rows.filter((r) => r.simpleIcons).length;
console.log(`  ${rows.length} protocoles · ${rows.length * 2 + avecLogo} fichiers SVG · ${avecLogo} logos de marque`);
