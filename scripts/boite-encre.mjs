// Boîte d'encre d'un tracé SVG : le rectangle réellement noirci, et non la
// zone de dessin déclarée.
//
// Simple Icons normalise toutes ses marques dans un viewBox 0 0 24 24, mais
// l'encre, elle, n'occupe pas toujours le carré : un logotype comme « vmware »
// tient sur une bande de 3,4 unités de haut. Inscrire cette bande dans un carré
// de 30 px, c'est écrire le nom en 4 px — illisible. Pour poser une marque à une
// hauteur d'encre voulue il faut donc mesurer l'encre.
//
// La mesure se fait par aplatissement : chaque segment est échantillonné, y
// compris les arcs, qu'on ramène d'abord à leur forme centrale (SVG 1.1, F.6.5).
// L'erreur est celle de l'échantillonnage, sous le centième d'unité aux pas
// retenus ici — sans commune mesure avec les paddings qu'on en déduit.

// L'analyse se fait au caractère, et non par découpage en jetons : les drapeaux
// d'un arc s'écrivent collés (« a1 1 0 010 2 » vaut « a 1 1 0 0 1 0 2 »), et un
// découpage naïf y lit le nombre 010.
const ESPACE = /[\s,]/;

class Curseur {
  constructor(d) { this.d = d; this.i = 0; }
  saute() { while (this.i < this.d.length && ESPACE.test(this.d[this.i])) this.i++; }
  fini() { this.saute(); return this.i >= this.d.length; }
  commande() {
    this.saute();
    const c = this.d[this.i];
    return /[MmLlHhVvCcSsQqTtAaZz]/.test(c) ? (this.i++, c) : null;
  }
  nombre() {
    this.saute();
    const reste = this.d.slice(this.i);
    const m = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/.exec(reste);
    if (!m) throw new Error(`nombre attendu à « ${reste.slice(0, 12)} »`);
    this.i += m[0].length;
    return Number(m[0]);
  }
  drapeau() {
    this.saute();
    const c = this.d[this.i];
    if (c !== '0' && c !== '1') throw new Error(`drapeau d'arc attendu, lu « ${c} »`);
    this.i++;
    return c === '1';
  }
}

const PAS_COURBE = 24;
const PAS_ARC = 48;

// Arc endpoint → centre (SVG 1.1 F.6.5), puis échantillonnage.
function pointsArc(x0, y0, rx, ry, phiDeg, grandArc, sens, x1, y1, sortie) {
  if (rx === 0 || ry === 0) { sortie(x1, y1); return; }
  rx = Math.abs(rx); ry = Math.abs(ry);
  const phi = (phiDeg * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (x0 - x1) / 2, dy = (y0 - y1) / 2;
  const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
  // F.6.6 : agrandir les rayons s'ils sont trop petits pour joindre les points.
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) { const s = Math.sqrt(lambda); rx *= s; ry *= s; }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = (grandArc === sens ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * y1p) / ry, cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x0 + x1) / 2;
  const cy = sin * cxp + cos * cyp + (y0 + y1) / 2;
  const ang = (ux, uy, vx, vy) => {
    const a = Math.atan2(uy, ux), b = Math.atan2(vy, vx);
    return b - a;
  };
  let theta = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  delta %= 2 * Math.PI;
  if (!sens && delta > 0) delta -= 2 * Math.PI;
  if (sens && delta < 0) delta += 2 * Math.PI;
  for (let i = 1; i <= PAS_ARC; i++) {
    const t = theta + (delta * i) / PAS_ARC;
    const ct = Math.cos(t), st = Math.sin(t);
    sortie(cx + cos * rx * ct - sin * ry * st, cy + sin * rx * ct + cos * ry * st);
  }
}

export function boiteEncre(d) {
  const c = new Curseur(d);
  let cmd = '', x = 0, y = 0, sx = 0, sy = 0, cx2 = 0, cy2 = 0, dernier = '';
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const voir = (px, py) => {
    if (px < x0) x0 = px; if (px > x1) x1 = px;
    if (py < y0) y0 = py; if (py > y1) y1 = py;
  };
  const cubique = (ax, ay, bx2, by2, ccx, ccy, dx, dy) => {
    for (let k = 1; k <= PAS_COURBE; k++) {
      const u = k / PAS_COURBE, v = 1 - u;
      voir(v * v * v * ax + 3 * v * v * u * bx2 + 3 * v * u * u * ccx + u * u * u * dx,
           v * v * v * ay + 3 * v * v * u * by2 + 3 * v * u * u * ccy + u * u * u * dy);
    }
  };
  while (!c.fini()) {
    const lu = c.commande();
    // Sans lettre, la commande précédente se répète — sauf « moveto », qui
    // enchaîne en « lineto » (SVG 1.1, 8.3.2).
    if (lu) cmd = lu;
    else if (cmd === 'M') cmd = 'L';
    else if (cmd === 'm') cmd = 'l';
    else if (!cmd) throw new Error('tracé commençant sans commande');
    const rel = cmd === cmd.toLowerCase();
    const bx = rel ? x : 0, by = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M': x = bx + c.nombre(); y = by + c.nombre(); sx = x; sy = y; voir(x, y); break;
      case 'L': x = bx + c.nombre(); y = by + c.nombre(); voir(x, y); break;
      case 'H': x = bx + c.nombre(); voir(x, y); break;
      case 'V': y = by + c.nombre(); voir(x, y); break;
      case 'C': {
        const px = x, py = y;
        const c1x = bx + c.nombre(), c1y = by + c.nombre();
        const c2x = bx + c.nombre(), c2y = by + c.nombre();
        x = bx + c.nombre(); y = by + c.nombre(); cx2 = c2x; cy2 = c2y;
        cubique(px, py, c1x, c1y, c2x, c2y, x, y); break;
      }
      case 'S': {
        const px = x, py = y;
        const refl = 'CScs'.includes(dernier);
        const c1x = refl ? 2 * x - cx2 : x, c1y = refl ? 2 * y - cy2 : y;
        const c2x = bx + c.nombre(), c2y = by + c.nombre();
        x = bx + c.nombre(); y = by + c.nombre(); cx2 = c2x; cy2 = c2y;
        cubique(px, py, c1x, c1y, c2x, c2y, x, y); break;
      }
      case 'Q': {
        const px = x, py = y;
        const qx = bx + c.nombre(), qy = by + c.nombre();
        x = bx + c.nombre(); y = by + c.nombre(); cx2 = qx; cy2 = qy;
        cubique(px, py, px + (2 / 3) * (qx - px), py + (2 / 3) * (qy - py),
                x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), x, y); break;
      }
      case 'T': {
        const px = x, py = y;
        const refl = 'QTqt'.includes(dernier);
        const qx = refl ? 2 * x - cx2 : x, qy = refl ? 2 * y - cy2 : y;
        x = bx + c.nombre(); y = by + c.nombre(); cx2 = qx; cy2 = qy;
        cubique(px, py, px + (2 / 3) * (qx - px), py + (2 / 3) * (qy - py),
                x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), x, y); break;
      }
      case 'A': {
        const px = x, py = y;
        const rx = c.nombre(), ry = c.nombre(), rot = c.nombre();
        const grand = c.drapeau(), sens = c.drapeau();
        x = bx + c.nombre(); y = by + c.nombre();
        pointsArc(px, py, rx, ry, rot, grand, sens, x, y, voir); break;
      }
      case 'Z': x = sx; y = sy; break;
      default: throw new Error(`commande de tracé inconnue : ${cmd}`);
    }
    dernier = cmd;
  }
  if (!Number.isFinite(x0)) throw new Error('tracé sans point');
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// La boîte d'encre de toutes les sous-marques d'un SVG (Simple Icons n'en pose
// qu'une, mais rien n'oblige à le supposer).
export function boiteEncreSvg(svg) {
  const ds = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
  if (!ds.length) throw new Error('aucun tracé dans le SVG');
  const b = ds.map(boiteEncre);
  const x0 = Math.min(...b.map((r) => r.x)), y0 = Math.min(...b.map((r) => r.y));
  const x1 = Math.max(...b.map((r) => r.x + r.w)), y1 = Math.max(...b.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// Poser une marque à une hauteur d'ENCRE voulue, sans dépasser une largeur.
// C'est ce qui rend un logotype lisible : inscrite dans un carré, une bande de
// 24 × 3,8 s'écrit en 4,7 px ; ajustée par son encre à 14 px de haut, elle
// s'écrit à la taille du mot qu'elle remplace, et prend la largeur qu'il faut.
export function poserMarque(svgMarque, { x = 0, yCentre = 0, hauteurEncre, largeurMax, encre }) {
  const b = boiteEncreSvg(svgMarque);
  const e = Math.min(hauteurEncre / b.h, largeurMax / b.w);
  const w = b.w * e, h = b.h * e;
  const corps = svgMarque
    .replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '')
    .replace(/<title>[\s\S]*?<\/title>/, '').trim();
  const r = (v) => String(Math.round(v * 100) / 100);
  return {
    w, h,
    svg: `<g transform="translate(${r(x)} ${r(yCentre - h / 2)}) scale(${r(e)})`
      + ` translate(${r(-b.x)} ${r(-b.y)})" fill="${encre}">${corps}</g>`,
  };
}

// La même, centrée dans une largeur connue : on mesure d'abord, on pose ensuite.
export function poserMarqueCentree(svgMarque, largeur, opts) {
  const m = poserMarque(svgMarque, { ...opts, x: 0 });
  return poserMarque(svgMarque, { ...opts, x: (largeur - m.w) / 2 });
}
