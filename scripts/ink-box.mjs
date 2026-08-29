// The ink box of an SVG path: the rectangle actually inked, not the drawing
// area declared around it.
//
// Simple Icons normalises every mark into a 0 0 24 24 viewBox, but the ink does
// not always fill that square: a logotype such as “vmware” sits on a band 3.8
// units tall. Inscribing that band in a 30 px square writes the name at 4.7 px —
// illegible. To place a mark at a chosen ink height, the ink has to be measured.
//
// The measurement flattens the path: every segment is sampled, arcs included,
// which are first converted to their centre form (SVG 1.1, F.6.5). The error is
// the sampling error, below a hundredth of a unit at the steps used here — of no
// consequence next to the paddings derived from it.

// Parsing runs character by character rather than over pre-split tokens: an
// arc's flags may be written flush (“a1 1 0 010 2” means “a 1 1 0 0 1 0 2”),
// and a naive split reads the number 010 there.
const SPACE = /[\s,]/;

class Cursor {
  constructor(d) { this.d = d; this.i = 0; }
  skip() { while (this.i < this.d.length && SPACE.test(this.d[this.i])) this.i++; }
  done() { this.skip(); return this.i >= this.d.length; }
  command() {
    this.skip();
    const c = this.d[this.i];
    return /[MmLlHhVvCcSsQqTtAaZz]/.test(c) ? (this.i++, c) : null;
  }
  number() {
    this.skip();
    const rest = this.d.slice(this.i);
    const m = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/.exec(rest);
    if (!m) throw new Error(`number expected at “${rest.slice(0, 12)}”`);
    this.i += m[0].length;
    return Number(m[0]);
  }
  flag() {
    this.skip();
    const c = this.d[this.i];
    if (c !== '0' && c !== '1') throw new Error(`arc flag expected, read “${c}”`);
    this.i++;
    return c === '1';
  }
}

const CURVE_STEPS = 24;
const ARC_STEPS = 48;

// Arc endpoint → centre parameterisation (SVG 1.1 F.6.5), then sampling.
function arcPoints(x0, y0, rx, ry, phiDeg, largeArc, sweep, x1, y1, emit) {
  if (rx === 0 || ry === 0) { emit(x1, y1); return; }
  rx = Math.abs(rx); ry = Math.abs(ry);
  const phi = (phiDeg * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (x0 - x1) / 2, dy = (y0 - y1) / 2;
  const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
  // F.6.6: grow the radii if they are too small to join the two points.
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) { const s = Math.sqrt(lambda); rx *= s; ry *= s; }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * y1p) / ry, cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x0 + x1) / 2;
  const cy = sin * cxp + cos * cyp + (y0 + y1) / 2;
  const angle = (ux, uy, vx, vy) => Math.atan2(vy, vx) - Math.atan2(uy, ux);
  const theta = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  delta %= 2 * Math.PI;
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  for (let i = 1; i <= ARC_STEPS; i++) {
    const t = theta + (delta * i) / ARC_STEPS;
    const ct = Math.cos(t), st = Math.sin(t);
    emit(cx + cos * rx * ct - sin * ry * st, cy + sin * rx * ct + cos * ry * st);
  }
}

export function inkBox(d) {
  const c = new Cursor(d);
  let cmd = '', x = 0, y = 0, sx = 0, sy = 0, cx2 = 0, cy2 = 0, previous = '';
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const see = (px, py) => {
    if (px < x0) x0 = px; if (px > x1) x1 = px;
    if (py < y0) y0 = py; if (py > y1) y1 = py;
  };
  const cubic = (ax, ay, bx2, by2, ccx, ccy, dx, dy) => {
    for (let k = 1; k <= CURVE_STEPS; k++) {
      const u = k / CURVE_STEPS, v = 1 - u;
      see(v * v * v * ax + 3 * v * v * u * bx2 + 3 * v * u * u * ccx + u * u * u * dx,
          v * v * v * ay + 3 * v * v * u * by2 + 3 * v * u * u * ccy + u * u * u * dy);
    }
  };
  while (!c.done()) {
    const read = c.command();
    // Without a letter the previous command repeats — except “moveto”, which
    // continues as “lineto” (SVG 1.1, 8.3.2).
    if (read) cmd = read;
    else if (cmd === 'M') cmd = 'L';
    else if (cmd === 'm') cmd = 'l';
    else if (!cmd) throw new Error('path starting without a command');
    const rel = cmd === cmd.toLowerCase();
    const bx = rel ? x : 0, by = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M': x = bx + c.number(); y = by + c.number(); sx = x; sy = y; see(x, y); break;
      case 'L': x = bx + c.number(); y = by + c.number(); see(x, y); break;
      case 'H': x = bx + c.number(); see(x, y); break;
      case 'V': y = by + c.number(); see(x, y); break;
      case 'C': {
        const px = x, py = y;
        const c1x = bx + c.number(), c1y = by + c.number();
        const c2x = bx + c.number(), c2y = by + c.number();
        x = bx + c.number(); y = by + c.number(); cx2 = c2x; cy2 = c2y;
        cubic(px, py, c1x, c1y, c2x, c2y, x, y); break;
      }
      case 'S': {
        const px = x, py = y;
        const reflect = 'CScs'.includes(previous);
        const c1x = reflect ? 2 * x - cx2 : x, c1y = reflect ? 2 * y - cy2 : y;
        const c2x = bx + c.number(), c2y = by + c.number();
        x = bx + c.number(); y = by + c.number(); cx2 = c2x; cy2 = c2y;
        cubic(px, py, c1x, c1y, c2x, c2y, x, y); break;
      }
      case 'Q': {
        const px = x, py = y;
        const qx = bx + c.number(), qy = by + c.number();
        x = bx + c.number(); y = by + c.number(); cx2 = qx; cy2 = qy;
        cubic(px, py, px + (2 / 3) * (qx - px), py + (2 / 3) * (qy - py),
              x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), x, y); break;
      }
      case 'T': {
        const px = x, py = y;
        const reflect = 'QTqt'.includes(previous);
        const qx = reflect ? 2 * x - cx2 : x, qy = reflect ? 2 * y - cy2 : y;
        x = bx + c.number(); y = by + c.number(); cx2 = qx; cy2 = qy;
        cubic(px, py, px + (2 / 3) * (qx - px), py + (2 / 3) * (qy - py),
              x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), x, y); break;
      }
      case 'A': {
        const px = x, py = y;
        const rx = c.number(), ry = c.number(), rot = c.number();
        const large = c.flag(), sweep = c.flag();
        x = bx + c.number(); y = by + c.number();
        arcPoints(px, py, rx, ry, rot, large, sweep, x, y, see); break;
      }
      case 'Z': x = sx; y = sy; break;
      default: throw new Error(`unknown path command: ${cmd}`);
    }
    previous = cmd;
  }
  if (!Number.isFinite(x0)) throw new Error('path with no point');
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// The ink box of every sub-path of an SVG (Simple Icons lays down only one, but
// nothing obliges us to assume it).
export function svgInkBox(svg) {
  const ds = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
  if (!ds.length) throw new Error('no path in the SVG');
  const b = ds.map(inkBox);
  const x0 = Math.min(...b.map((r) => r.x)), y0 = Math.min(...b.map((r) => r.y));
  const x1 = Math.max(...b.map((r) => r.x + r.w)), y1 = Math.max(...b.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// Place a mark at a chosen INK height, within a maximum width. This is what
// makes a logotype legible: inscribed in a square, a 24 × 3.8 band writes at
// 4.7 px; fitted by its ink to 14 px tall, it writes at the size of the word it
// replaces, and takes whatever width that needs.
export function placeMark(markSvg, { x = 0, yCentre = 0, inkHeight, maxWidth, ink }) {
  const b = svgInkBox(markSvg);
  const e = Math.min(inkHeight / b.h, maxWidth / b.w);
  const w = b.w * e, h = b.h * e;
  const body = markSvg
    .replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '')
    .replace(/<title>[\s\S]*?<\/title>/, '').trim();
  const r = (v) => String(Math.round(v * 100) / 100);
  return {
    w, h,
    svg: `<g transform="translate(${r(x)} ${r(yCentre - h / 2)}) scale(${r(e)})`
      + ` translate(${r(-b.x)} ${r(-b.y)})" fill="${ink}">${body}</g>`,
  };
}

// The same, centred in a known width: measure first, place second.
export function placeMarkCentred(markSvg, width, opts) {
  const m = placeMark(markSvg, { ...opts, x: 0 });
  return placeMark(markSvg, { ...opts, x: (width - m.w) / 2 });
}
