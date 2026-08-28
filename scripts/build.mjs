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
const { produits } = JSON.parse(fs.readFileSync(path.join(ROOT, 'produits.json'), 'utf8'));
const { roles } = JSON.parse(fs.readFileSync(path.join(ROOT, 'roles.json'), 'utf8'));
const { formes } = JSON.parse(fs.readFileSync(path.join(ROOT, 'formes.json'), 'utf8'));

// Un picto ne peut servir qu'à une seule entrée. Deux concepts derrière un même
// symbole, c'est la « surcharge » que la clarté sémiotique interdit — règle R2
// de l'ADR 0003 : le lecteur ne peut plus savoir ce que le signe désigne.
{
  const par = {};
  for (const e of [...protocoles, ...produits, ...roles]) {
    const signe = e.marqueOfficielle && e.simpleIcons ? `si:${e.simpleIcons}` : e.tabler ? `tb:${e.tabler}` : null;
    if (signe) (par[signe] ||= []).push(e.slug);
  }
  const partages = Object.entries(par).filter(([, v]) => v.length > 1);
  if (partages.length) {
    throw new Error(`Picto partagé par plusieurs entrées (surcharge de symbole) :\n  `
      + partages.map(([k, v]) => `${k} → ${v.join(', ')}`).join('\n  '));
  }
}

// La grammaire de formes est normative : une forme inconnue arrête le build.
for (const e of [...produits, ...roles]) {
  if (e.forme && !formes[e.forme]) throw new Error(`Forme inconnue pour « ${e.slug} » : « ${e.forme} ». Voir formes.json.`);
}

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

const OUT = path.join(ROOT, 'sources');  // glyphes bruts, tels que publiés en amont
fs.rmSync(OUT, { recursive: true, force: true });
for (const d of ['tabler', 'lucide', 'marques']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const rows = protocoles.map((p) => {
  p = { ...p, type: 'protocole' };
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
    fs.writeFileSync(path.join(OUT, 'marques', `${p.slug}.svg`), `${sSvg}\n`);
  }
  return { ...p, hex, marque, source, tSvg, lSvg, sSvg };
});

// Les produits n'ont qu'un signe : leur logo officiel, ou un picto en repli
// quand la marque n'est pas redistribuable (S3, Java).
const rowsProduits = produits.map((p) => {
  let sSvg = null, hex = p.couleur ? p.couleur.replace('#', '') : null, marque = null, source = null;
  if (p.simpleIcons) {
    sSvg = readIcon(SRC.simple, p.simpleIcons, 'Simple Icons');
    const meta = siBySlug[p.simpleIcons] || {};
    hex = meta.hex || hex;
    marque = meta.title || p.simpleIcons;
    source = meta.source || null;
    fs.writeFileSync(path.join(OUT, 'marques', `${p.slug}.svg`), `${sSvg}\n`);
  }
  const tSvg = p.tabler ? readIcon(SRC.tabler, p.tabler, 'Tabler') : null;
  if (!sSvg && !tSvg) throw new Error(`Le produit « ${p.slug} » n'a ni logo ni picto de repli.`);
  if (tSvg) fs.writeFileSync(path.join(OUT, 'tabler', `${p.slug}.svg`), `${tSvg}\n`);
  return { ...p, type: 'produit', marqueOfficielle: Boolean(sSvg), famille: p.categorie, hex, marque, source, tSvg, lSvg: null, sSvg };
});

// Les rôles n'ont jamais de marque : ils décrivent une fonction, pas un produit.
const rowsRoles = roles.map((r) => {
  const tSvg = readIcon(SRC.tabler, r.tabler, 'Tabler');
  fs.writeFileSync(path.join(OUT, 'tabler', `${r.slug}.svg`), `${tSvg}\n`);
  return { ...r, type: 'role', marqueOfficielle: false, hex: null, marque: null, source: null, tSvg, lSvg: null, sSvg: null };
});

const tout = [...rows, ...rowsProduits, ...rowsRoles];

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
fs.writeFileSync(
  path.join(ROOT, 'mapping.csv'),
  ['nom,type,famille,tabler_mit,lucide_isc,logo_officiel_cc0,marque,couleur']
    .concat(tout.map((r) => [r.label, r.type, r.famille, r.tabler || '', r.lucide || '', r.simpleIcons || '', r.marque || '', r.hex ? (r.hex.startsWith('#') ? r.hex : `#${r.hex}`) : ''].map(csvCell).join(',')))
    .join('\n') + '\n'
);

fs.writeFileSync(
  path.join(ROOT, 'mapping.json'),
  JSON.stringify(tout.map(({ tSvg, lSvg, sSvg, ...r }) => ({ ...r, hex: r.hex ? (r.hex.startsWith('#') ? r.hex : `#${r.hex}`) : null })), null, 2) + '\n'
);

// Réutilisé par specimen.mjs, hors du dépôt.
fs.mkdirSync(path.join(ROOT, '.cache'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '.cache/rows.json'), JSON.stringify(tout));

const avecLogo = rows.filter((r) => r.simpleIcons).length;
const officiels = rows.filter((r) => r.marqueOfficielle).length;
console.log(`  ${rows.length} protocoles · ${avecLogo} logos au catalogue, dont ${officiels} désignent le protocole lui-même`);
console.log(`  ${rowsProduits.length} produits · ${rowsProduits.filter((r) => r.marqueOfficielle).length} portent leur logo officiel, ${rowsProduits.filter((r) => !r.marqueOfficielle).length} en repli picto`);
console.log(`  ${rowsRoles.length} rôles d'infrastructure · picto générique, couleur de couche`);
