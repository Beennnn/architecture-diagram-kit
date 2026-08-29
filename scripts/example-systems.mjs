// Several views of one system, at distinct levels of abstraction.
// They are NOT mergeable: mixing hardware, platform and code into a single
// diagram breaks the rule “one level of abstraction per diagram”.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, INK, SOFT, RULE, esc, symbol, box, ACCENT, annotation, label, arrowHead, marker, legend } from './diagram.mjs';

const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'mapping.json'), 'utf8'));
const LAYERS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/layers.json'), 'utf8')).layers;
const FAM = {}; for (const [k, c] of Object.entries(LAYERS)) for (const f of c.families) FAM[f] = k;
const BY_SLUG = Object.fromEntries(MAP.map((e) => [e.slug, e]));

const T = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}"${o.a ? ` text-anchor="${o.a}"` : ''} font-size="${o.f || 11}"${o.g ? ` font-weight="600"` : ''} fill="${o.c || SOFT}"${o.m ? ` font-family="'IBM Plex Mono',monospace"` : ''}>${esc(s)}</text>`;

// The zone goes through box(): it used to have its own geometry, hence its own
// fill, which survived the scale change of ADR 0007 without following it.
// A zone gets a symbol when it IS a product or a platform (“Production
// cluster” is Kubernetes). An abstract boundary — a network segment, an
// architectural layer — does not: giving it one would suggest a component where
// there is only a perimeter.
const zone = (z) => {
  const right = z.x + z.w - 14;
  const textEnd = z.ico ? right - 28 : right;
  return box({ x: z.x, y: z.y, w: z.w, h: z.h, shape: 'boundary', nested: z.nested })
    + (z.ico ? symbol(z.ico, right - 22, z.y + 12, 22) : '')
    + T(textEnd, z.y + 22, z.t, { a: 'end', f: 12, g: 1 })
    + (z.s ? T(textEnd, z.y + 38, z.s, { a: 'end', f: 10, c: RULE }) : '');
};

// The subtitle carries the technology and, when the box designates something
// that really exists — a database, a bucket, a topic, a machine —, its
// identifier. A bucket is called “voltis-invoices”, not “S3”: without it the
// diagram describes a category and not a system. The monospaced face separates
// the two registers.
// Approximate widths: 0.48 em in Plex Sans, 0.60 em in Plex Mono. The margin of
// error is absorbed by the 10 px of box ground held in reserve.
const subtitleWidth = (n, size) =>
  n.s.length * size * 0.48 + (n.id ? (3 * size * 0.48 + n.id.length * size * 0.60) : 0);

const subtitle = (x, y, n, size) => {
  const room = n.x + n.w - x - 10;
  if (!n.id) return T(x, y, n.s, { f: size });
  // Inline when it fits, on its own line otherwise: a narrow box must not force
  // an identifier to be shortened, and an identifier is not negotiable.
  if (subtitleWidth(n, size) <= room) {
    return T(x, y, n.s, { f: size })
      .replace('</text>', ` · <tspan font-family="'IBM Plex Mono',monospace">${esc(n.id)}</tspan></text>`);
  }
  const idWidth = n.id.length * (size - 1) * 0.60;
  if (idWidth > room) {
    throw new Error(`“${n.t}”: the identifier “${n.id}” is ${Math.round(idWidth)} px `
      + `for ${Math.round(room)} px available, even alone on its line.`);
  }
  if (n.y + n.h - (y + 13) < 6) {
    throw new Error(`“${n.t}”: no room for a third line (${n.h} px tall).`);
  }
  return T(x, y - 6, n.s, { f: size })
    + T(x, y + 8, n.id, { f: size - 1, m: 1, c: RULE });
};

// A DESCRIPTION — the third field C4 requires, alongside the name and the type.
// Our runtime views carry none: at twelve or seventeen nodes, a sentence per box
// would make them unreadable. It has its place at the context level, where the
// boxes can be counted on one hand. See docs/conventions-audit.md.
function wrap(text, charWidth) {
  const lines = [];
  let current = '';
  for (const w of text.split(' ')) {
    if (current && (current + ' ' + w).length > charWidth) { lines.push(current); current = w; }
    else current = current ? current + ' ' + w : w;
  }
  if (current) lines.push(current);
  return lines;
}

// A node: title + subtitle, badge on the left, two sizes depending on height
const node = (n) => {
  const ft = n.featured ? ACCENT : null;
  // A tall node hosts other boxes: its label goes at the top, otherwise the
  // children cover it. Found in the exercise, recorded in ADR 0005.
  if (n.shape === 'node' && n.h > 100) {
    return `<g>${box({ ...n, featured: ft })}`
      + (n.ico ? symbol(n.ico, n.x + 12, n.y + 12, 26) : '')
      + T(n.x + 46, n.y + 24, n.t, { f: 13, g: 1, c: ft || INK })
      + (n.s ? subtitle(n.x + 46, n.y + 39, n, 10.5) : '') + `</g>`;
  }
  const small = n.h <= 58;
  const drop = n.shape === 'store' ? 6 : 0;
  const cy = n.y + n.h / 2 + drop;
  const it = small ? 24 : 30, tx = n.x + (small ? 40 : 50);
  if (n.d) {
    // With a description the block anchors at the top: the text runs downwards,
    // it does not centre on a point that would move with the number of lines.
    const lines = wrap(n.d, Math.floor((n.w - 24) / 5.2));
    if (n.y + 62 + lines.length * 14 > n.y + n.h - 6) {
      throw new Error(`“${n.t}”: ${lines.length} lines of description do not fit in ${n.h} px.`);
    }
    return `<g>${box({ ...n, featured: ft })}`
      + (n.ico ? symbol(n.ico, n.x + 12, n.y + 14, 30) : '')
      + T(n.x + 50, n.y + 28, n.t, { f: 13.5, g: 1, c: ft || INK })
      + T(n.x + 50, n.y + 43, n.s, { f: 10.5 })
      + lines.map((l, i) => T(n.x + 12, n.y + 68 + i * 14, l, { f: 10.5 })).join('')
      + `</g>`;
  }
  return `<g>${box({ ...n, featured: ft })}`
    + (n.ico ? symbol(n.ico, n.x + (small ? 10 : 12), cy - it / 2, it) : '')
    + T(tx, n.s ? cy - 2 : cy + 4, n.t, { f: small ? 12 : 13.5, g: 1, c: ft || INK })
    + (n.s ? subtitle(tx, cy + 14, n, small ? 9.5 : 10.5) : '') + `</g>`;
};

const link = (e) => `<path d="${e.d}" fill="none" stroke="${RULE}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#fl)"/>`;

function render({ f, w, h, title, sub, zones = [], nodes = [], links = [], marks = [], notes = [], after = '' }) {
  // The legend follows from the content: it cannot announce a shape that is
  // absent, nor forget a colour that is used.
  const shapesUsed = [...new Set(nodes.map((n) => n.shape || 'service'))].concat(zones.length ? ['boundary'] : []);
  const layersUsed = [...new Set(nodes.map((n) => BY_SLUG[n.ico]).filter((e) => e && !e.officialMark)
    .map((e) => FAM[e.family]).filter(Boolean))]
    .map((k) => [LAYERS[k].label, LAYERS[k].light]);
  // An arrow label must not cover any box. Mechanical check: at the scale of the
  // diagram ten pixels of overlap go unseen, and show up plainly in print.
  const frames = marks.map((m) => {
    const proto = BY_SLUG[m[0]].label;
    const lw = Math.max(17 + 5 + proto.length * 6.6, m[3] ? m[3].length * 5.3 : 0) + 10;
    const lh = m[3] ? 36 : 22;
    return { t: `${proto}${m[3] ? ' / ' + m[3] : ''}`, x: m[1] - lw / 2, y: m[2] - lh / 2, w: lw, h: lh };
  }).concat(notes.map((n) => {
    const lw = n[2].length * 5.3;
    const x = n[3] === 'middle' ? n[0] - lw / 2 : n[3] === 'end' ? n[0] - lw : n[0];
    return { t: n[2], x, y: n[1] - 11, w: lw, h: 14 };
  }));
  const clashes = [];
  for (const c of frames) {
    for (const n of nodes) {
      if (c.x < n.x + n.w + 6 && c.x + c.w > n.x - 6 && c.y < n.y + n.h + 6 && c.y + c.h > n.y - 6) {
        clashes.push(`  “${c.t}” covers “${n.t}” (label ${Math.round(c.x)}..${Math.round(c.x + c.w)} × ${Math.round(c.y)}..${Math.round(c.y + c.h)})`);
      }
    }
  }
  // The legend is a label like any other: it occupies two rows from h - 46, and
  // until now nothing stopped it from landing on a box.
  for (const n of nodes) {
    if (n.y + n.h + 6 > h - 58) {
      clashes.push(`  the legend (from ${h - 58}) lands on “${n.t}” (down to ${n.y + n.h})`);
    }
  }
  if (clashes.length) throw new Error(`${f}: labels in collision:\n${clashes.join('\n')}`);
  const leg = legend(40, h - 46, shapesUsed, layersUsed, nodes.some((n) => n.featured));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif" role="img" aria-label="${esc(title)}">
  <title>${esc(title)}</title>
  <defs>${arrowHead()}</defs>
  <rect width="${w}" height="${h}" fill="#FFFFFF"/>
  ${T(40, 44, title, { f: 18, g: 1, c: INK })}
  ${T(40, 66, sub, { f: 12.5 })}
  ${zones.map(zone).join('\n  ')}
  ${links.map(link).join('\n  ')}
  ${nodes.map(node).join('\n  ')}
  ${notes.map((n) => label(n[2], n[0], n[1], zones, n[3] || 'start', n[4] || 10.5)).join('\n  ')}
  ${marks.map((m) => annotation(m[0], m[1], m[2], zones, m[3])).join('\n  ')}
  ${after}
  ${leg}
</svg>
`;
  fs.writeFileSync(path.join(ROOT, 'docs', f), svg);
  console.log(`  docs/${f} · ${(svg.length / 1024).toFixed(0)} kB · ${nodes.length} nodes · ${zones.length} zones`);
}

/* ══════════════ 1 · hardware and network ══════════════ */
const vmA = (x, y, ico, t, s) => ({ x, y, w: 128, h: 54, t, s, ico, shape: 'node' });
render({
  f: 'example-infra.svg', w: 1340, h: 760,
  title: 'Foundation — machines, network, virtualisation',
  sub: 'Hardware level · this diagram contains no application component',
  zones: [
    { x: 288, y: 100, w: 250, h: 200, t: 'DMZ', s: 'exposed' },
    { x: 578, y: 100, w: 718, h: 520, t: 'Production LAN', s: 'VLAN 20 · not routed outwards' },
  ],
  nodes: [
    { x: 40, y: 150, w: 150, h: 64, t: 'Internet', s: 'out of scope', ico: 'cdn', shape: 'external' },
    { x: 318, y: 170, w: 190, h: 70, t: 'Firewall', s: 'pfSense', ico: 'pfsense', id: 'fw-edge-01', shape: 'service' },
    { x: 608, y: 150, w: 190, h: 66, t: 'Switch', s: '48 ports', ico: 'switch', shape: 'service' },
    { x: 846, y: 150, w: 190, h: 66, t: 'Router', s: 'BGP', ico: 'router', shape: 'service' },
    { x: 1084, y: 150, w: 190, h: 66, t: 'DNS resolver', s: 'internal', ico: 'dns', id: 'ns1.internal', shape: 'service' },

    { x: 608, y: 280, w: 320, h: 180, t: 'Server A', s: '2 × Xeon · 256 GiB', ico: 'physical-server', id: 'srv-a', shape: 'node', featured: true },
    { x: 628, y: 336, w: 280, h: 44, t: 'Proxmox VE', s: 'hypervisor', ico: 'proxmox', shape: 'service' },
    vmA(572, 392, 'ubuntu', 'vm-app-1', 'Ubuntu 24.04'),
    vmA(724, 392, 'ubuntu', 'vm-app-2', 'Ubuntu 24.04'),

    { x: 956, y: 280, w: 320, h: 180, t: 'Server B', s: '2 × Xeon · 256 GiB', ico: 'physical-server', id: 'srv-b', shape: 'node' },
    { x: 976, y: 336, w: 280, h: 44, t: 'Hypervisor', s: 'KVM', ico: 'hypervisor', shape: 'service' },
    vmA(920, 392, 'linux', 'vm-data-1', 'Debian 12'),
    vmA(1072, 392, 'linux', 'vm-data-2', 'Debian 12'),

    { x: 608, y: 500, w: 320, h: 78, t: 'Disk array', s: 'RAID 10 · 12 TB', ico: 'volume', id: 'array-01', shape: 'store' },
    { x: 956, y: 500, w: 320, h: 78, t: 'Backup', s: 'off site · daily', ico: 'object-storage', id: 'backup-remote', shape: 'store' },
  ],
  links: [
    { d: 'M190,182 H310' },
    { d: 'M508,205 H566 V183 H600' },
    { d: 'M798,183 H838' },
    { d: 'M1036,183 H1076' },
    { d: 'M703,216 V272' },
    { d: 'M1051,216 V272' },
    { d: 'M768,460 V492' },
    { d: 'M1116,460 V492' },
  ],
  marks: [['https', 250, 182]],
  notes: [[558, 176, 'filtered traffic', 'middle'], [756, 246, 'VLAN 20', 'middle'], [1104, 246, 'VLAN 20', 'middle'],
          [801, 480, 'iSCSI', 'middle'], [1149, 480, 'replication', 'middle']],
});

/* ══════════════ 2 · Kubernetes platform ══════════════ */
const pod = (x, y, t, s, ico) => ({ x, y, w: 132, h: 52, t, s, ico, shape: 'service' });
const clusterip = (x, y) => ({ x, y, w: 268, h: 48, t: 'ClusterIP service', ico: 'cluster-service', shape: 'service' });
render({
  f: 'example-k8s.svg', w: 1280, h: 780,
  title: 'Platform — Kubernetes cluster',
  sub: 'Platform level · the VMs of the previous diagram are the cluster nodes here',
  zones: [{ x: 40, y: 100, w: 1000, h: 540, t: 'Production cluster', s: '3 nodes · Istio mesh', ico: 'kubernetes' }],
  nodes: [
    { x: 400, y: 150, w: 280, h: 62, t: 'Ingress', s: 'TLS termination', ico: 'api-gateway', shape: 'service' },

    { x: 60, y: 262, w: 300, h: 196, t: 'node-1', s: 'vm-app-1', ico: 'cluster-node', shape: 'node' },
    pod(78, 322, 'orders', '2 replicas', 'pod'), pod(214, 322, 'basket', '2 replicas', 'pod'),
    clusterip(78, 388),

    { x: 390, y: 262, w: 300, h: 196, t: 'node-2', s: 'vm-app-2', ico: 'cluster-node', shape: 'node', featured: true },
    pod(408, 322, 'payment', '2 replicas', 'pod'), pod(544, 322, 'notifs', '2 replicas', 'pod'),
    clusterip(408, 388),

    { x: 720, y: 262, w: 300, h: 196, t: 'node-3', s: 'vm-data-1', ico: 'cluster-node', shape: 'node' },
    pod(738, 322, 'mesh', 'Istio', 'istio'), pod(874, 322, 'secrets', 'Vault', 'vault'),
    clusterip(738, 388),

    { x: 60, y: 490, w: 300, h: 66, t: 'Image registry', s: 'pulled by the nodes', ico: 'image-registry', id: 'registry.internal', shape: 'store' },
    { x: 400, y: 490, w: 300, h: 66, t: 'Persistent volume', s: 'mounted by the pods', ico: 'volume', id: 'pvc-data', shape: 'store' },

    { x: 1080, y: 262, w: 170, h: 92, t: 'Relational', s: 'PostgreSQL 16', id: 'voltis-orders', ico: 'postgresql', shape: 'store' },
    { x: 1080, y: 392, w: 170, h: 92, t: 'Objects', s: 'S3', id: 'voltis-invoices', ico: 's3', shape: 'store' },
  ],
  links: [
    { d: 'M540,212 V240 H210 V254' }, { d: 'M540,240 V254' }, { d: 'M540,240 H870 V254' },
    // store access starts from the edge of the cluster: an arrow crossing a node
    // box would be saying that it enters it
    { d: 'M1020,300 H1072' }, { d: 'M1020,420 H1072' },
    { d: 'M210,458 V482' }, { d: 'M540,458 V482' },
  ],
  marks: [['grpc', 610, 237, 'routes to the pods']],
  notes: [[1046, 292, 'SQL', 'middle'], [1046, 412, 'objects', 'middle'],
          [246, 478, 'docker pull', 'middle'], [578, 478, 'mounts', 'middle']],
});

/* ══════════════ 3 · inside one service ══════════════ */
// In a code view, “store” is not used: an entity or a configuration file does
// not survive a restart, it is a piece of code. The real stores are outside.
// Likewise, no protocol badge inside: a protocol marks the crossing of a
// boundary, not a method call.
render({
  f: 'example-component.svg', w: 1400, h: 660,
  title: 'Component — inside the Orders service',
  sub: 'Code level · one of the pods of the previous diagram, opened up',
  zones: [
    { x: 210, y: 100, w: 900, h: 420, t: 'Orders service', s: 'Spring Boot · one container', ico: 'springboot' },
    { x: 234, y: 148, w: 258, h: 262, t: 'Inbound', s: 'adapters', nested: true },
    { x: 514, y: 148, w: 258, h: 262, t: 'Domain', s: 'no dependency', nested: true },
    { x: 794, y: 148, w: 296, h: 262, t: 'Outbound', s: 'adapters', nested: true },
  ],
  nodes: [
    { x: 30, y: 258, w: 150, h: 70, t: 'Bus', s: 'Kafka', id: 'readings.v1', ico: 'kafka', shape: 'stream' },

    { x: 252, y: 200, w: 222, h: 54, t: 'REST controller', s: '/v2/orders', ico: 'controller', shape: 'service' },
    { x: 252, y: 266, w: 222, h: 54, t: 'Consumer', s: 'readings topic', ico: 'worker', shape: 'service' },
    { x: 532, y: 200, w: 222, h: 54, t: 'Domain service', s: 'business rules', ico: 'application-service', shape: 'service', featured: true },
    { x: 532, y: 266, w: 222, h: 54, t: 'Order', s: 'domain entity', ico: 'entity', shape: 'service' },
    { x: 812, y: 200, w: 260, h: 54, t: 'JPA repository', s: 'Hibernate', ico: 'hibernate', shape: 'service' },
    { x: 812, y: 266, w: 260, h: 54, t: 'Migrations', s: 'Flyway', ico: 'flyway', shape: 'service' },
    { x: 812, y: 332, w: 260, h: 54, t: 'Object client', s: 'S3 SDK', ico: 'repository', shape: 'service' },

    { x: 234, y: 436, w: 378, h: 54, t: 'Configuration', s: 'profiles · variables', ico: 'configuration', shape: 'service' },
    { x: 632, y: 436, w: 458, h: 54, t: 'Security', s: 'Spring Security · token filter', ico: 'springsecurity', shape: 'service' },

    { x: 1150, y: 190, w: 220, h: 86, t: 'Relational', s: 'PostgreSQL 16', id: 'voltis-orders', ico: 'postgresql', shape: 'store' },
    { x: 1150, y: 316, w: 220, h: 86, t: 'Objects', s: 'S3', id: 'voltis-invoices', ico: 's3', shape: 'store' },
  ],
  links: [
    { d: 'M180,293 H244' },
    { d: 'M180,227 H244' },
    { d: 'M474,227 H524' },
    { d: 'M474,293 H500 V240 H524' },
    { d: 'M643,254 V258' },
    { d: 'M754,227 H804' },
    { d: 'M754,240 H780 V293 H804' },
    { d: 'M754,240 H780 V359 H804' },
    { d: 'M1072,227 H1142' },
    { d: 'M1072,293 H1110 V240 H1142' },
    { d: 'M1072,359 H1142' },
  ],
  marks: [['rest', 216, 227]],
  notes: [[246, 282, 'consumes', 'end'], [1106, 218, 'SQL', 'middle'], [1106, 350, 'PUT', 'middle'],
          [499, 218, 'calls', 'middle'], [784, 218, 'persists', 'middle']],
});

/* ══════════════ 4 · delivery chain ══════════════ */
// This is where half of the “candidate concepts” live: a formatter, an
// analyser, a coverage tool are not components of the system — they are steps
// that produce it. Putting them in a runtime view would mix levels of
// abstraction.

const step = (x, t, s, ico) => ({ x, y: 180, w: 170, h: 64, t, s, ico, shape: 'service' });
const tool = (x, y, t, s, ico, shape = 'service') => ({ x, y, w: 190, h: shape === 'store' ? 66 : 48, t, s, ico, shape });

const M = [
  marker(790, 168, 'immutable'),
  marker(990, 168, 'SemVer'),
  marker(586, 380, 'contract-first'),
  marker(1216, 168, 'least privilege', '#C0392F'),
];

render({
  f: 'example-delivery.svg', w: 1400, h: 760,
  title: 'Delivery — from change to deployment',
  sub: 'Pipeline level · none of these boxes exists at runtime',
  zones: [{ x: 40, y: 120, w: 1030, h: 360, t: 'Continuous integration', s: 'triggered on every push', ico: 'gitlab' }],
  nodes: [
    step(64, 'Build', 'Maven', 'maven'),
    step(264, 'Quality', 'Spotless · format', 'formatter'),
    step(464, 'Tests', 'JUnit 5', 'junit'),
    step(664, 'Packaging', 'OCI image', 'oci'),
    step(864, 'Publication', 'registry', 'image-registry'),

    tool(264, 272, 'Static analysis', 'Error Prone · NullAway', 'static-analysis'),
    tool(264, 330, 'Architecture test', 'ArchUnit', 'architecture-test'),
    tool(464, 272, 'Coverage', 'JaCoCo', 'coverage'),
    tool(464, 330, 'Mutation test', 'PIT', 'mutation-test'),
    tool(464, 388, 'Contract test', 'OpenAPI · AsyncAPI', 'contract-test'),
    tool(664, 266, 'SBOM', 'SPDX', 'sbom', 'store'),

    { x: 1160, y: 180, w: 200, h: 64, t: 'Deployment', s: 'Kubernetes', ico: 'kubernetes', id: 'voltis-prod', shape: 'service', featured: true },
    { x: 1160, y: 300, w: 200, h: 64, t: 'Decisions', s: 'versioned ADRs', ico: 'architecture-decision', shape: 'service' },
    { x: 1160, y: 400, w: 200, h: 64, t: 'Diagrams', s: 'versioned draw.io', ico: 'drawio', shape: 'service' },
  ],
  links: [
    { d: 'M234,212 H256' }, { d: 'M434,212 H456' }, { d: 'M634,212 H656' }, { d: 'M834,212 H856' },
    { d: 'M1034,212 H1152' },
    { d: 'M359,244 V264' }, { d: 'M359,320 V322' },
    { d: 'M559,244 V264' }, { d: 'M559,320 V322' }, { d: 'M559,378 V380' },
    { d: 'M749,244 V258' },
  ],
  marks: [],
  notes: [[1088, 202, 'signed artefact', 'middle']],
  after: M.join(''),
});

// ─── Full view ────────────────────────────────────────────────────────────
// It has two jobs. Showing the nine shapes, the nested zones, the accent, the
// instance identifiers and the three arrow-label regimes on a single page. And
// serving as a regression test: it is the only view that exercises the whole
// grammar, so the first place a broken rule shows up.
render({
  f: 'example-full.svg', w: 1500, h: 900,
  title: 'Charging record — from the charge point to the billed statement',
  sub: 'Full view · it exercises the nine shapes, zone nesting and the three label regimes',
  zones: [
    { x: 40, y: 110, w: 420, h: 460, t: 'Industrial site', s: 'isolated network' },
    { x: 520, y: 110, w: 640, h: 690, t: 'Production cluster', s: '3 nodes', ico: 'kubernetes' },
    { x: 544, y: 180, w: 592, h: 340, t: 'voltis namespace', s: 'quotas enforced', nested: true },
  ],
  nodes: [
    { x: 64, y: 170, w: 180, h: 92, t: 'Charge point', s: 'AC 22 kW', id: 'cp-0421', ico: 'connected-device', shape: 'device' },
    { x: 264, y: 170, w: 172, h: 92, t: 'Technician', s: 'on call', ico: 'team', shape: 'actor' },
    { x: 64, y: 320, w: 372, h: 228, t: 'Field gateway', s: 'Debian 12', id: 'gw-site-03', ico: 'physical-server', shape: 'node' },
    { x: 88, y: 392, w: 196, h: 92, t: 'Collection agent', s: 'Spring Boot', id: 'collect', ico: 'springboot', shape: 'application' },
    { x: 300, y: 392, w: 120, h: 92, t: 'Buffer', s: 'local', id: 'spool', ico: 'cache', shape: 'service' },

    { x: 568, y: 250, w: 200, h: 92, t: 'Billing', s: 'Spring Boot', id: 'svc-billing', ico: 'springboot', shape: 'application' },
    { x: 812, y: 250, w: 200, h: 92, t: 'Readings bus', s: '3 partitions', id: 'readings.v1', ico: 'kafka', shape: 'stream', featured: true },
    { x: 568, y: 390, w: 200, h: 92, t: 'API gateway', s: 'OpenAPI contract', id: 'gw-public', ico: 'api-gateway', shape: 'service' },
    { x: 812, y: 390, w: 200, h: 92, t: 'Scheduler', s: 'nightly statement', id: 'cron-night', ico: 'scheduled-job', shape: 'service' },

    { x: 544, y: 560, w: 592, h: 210, t: 'Data node', s: 'vm-data-1', id: 'node-data-1', ico: 'cluster-node', shape: 'node' },
    { x: 576, y: 640, w: 230, h: 100, t: 'Readings', s: 'PostgreSQL 16', id: 'voltis-readings', ico: 'postgresql', shape: 'store' },
    { x: 850, y: 640, w: 230, h: 100, t: 'Statements', s: 'S3', id: 'voltis-invoices', ico: 's3', shape: 'store' },

    { x: 1220, y: 390, w: 200, h: 92, t: 'Energy supplier', s: 'hourly tariffs', id: 'api.supplier', ico: 'webhook', shape: 'external' },
  ],
  links: [
    { d: 'M154,262 V314' },
    { d: 'M350,262 V314' },
    { d: 'M436,436 H562' },
    { d: 'M668,390 V348' },
    { d: 'M768,296 H806' },
    { d: 'M880,342 V554' },
    { d: 'M944,482 V554' },
    { d: 'M1012,436 H1214' },
    { d: 'M691,342 V384' },
  ],
  // Three regimes: intent and transport; transport alone, when the topology says
  // the intent; intent alone, when the receiving box names the transport.
  marks: [
    ['mqtt', 154, 291, 'reports readings'],
    ['ssh', 350, 291],
    ['https', 502, 436, 'pushes the readings'],
    ['rest', 1150, 436, 'queries the tariffs'],
  ],
  notes: [
    [700, 380, 'calls', 'middle'],
    [787, 236, 'publishes the readings', 'middle'],
    [960, 524, 'persists the statements', 'start'],
    [844, 524, 'writes the readings', 'end'],
  ],
  after: [
    marker(300, 150, 'offline tolerated'),
    marker(1024, 236, 'idempotent'),
    marker(576, 610, 'RLS per site', '#C0392F'),
    marker(850, 610, 'immutable'),
  ].join(''),
});

// ─── Analytics and machine learning ───────────────────────────────────────
// A deliberately different architectural style from the other views: no
// cluster, no long-running service, no JVM. Everything is managed or runs on
// demand. It exists to prove that the vocabulary is not moulded on one
// architecture — see docs/scope-audit.md.
render({
  f: 'example-analytics.svg', w: 1440, h: 700,
  title: 'Analytics — from raw event to a served model',
  sub: 'Cloud level · nothing here runs permanently: every box is managed or on demand',
  zones: [
    { x: 250, y: 110, w: 1150, h: 500, t: 'Cloud provider', s: 'one region', ico: 'cloud-provider' },
  ],
  nodes: [
    { x: 30, y: 150, w: 160, h: 92, t: 'Charge points', s: 'fleet', ico: 'connected-device', shape: 'device' },
    { x: 30, y: 300, w: 160, h: 92, t: 'Web portal', s: 'customers', ico: 'web-app', shape: 'application' },

    { x: 280, y: 150, w: 180, h: 92, t: 'Ingestion', s: 'on demand', id: 'ingest-fn', ico: 'ingestion-job', shape: 'service' },
    { x: 570, y: 150, w: 190, h: 92, t: 'Raw events', s: '12 partitions', id: 'events.raw', ico: 'topic', shape: 'stream' },
    { x: 870, y: 150, w: 180, h: 92, t: 'Enrichment', s: 'windowed', ico: 'stream-processor', shape: 'service' },
    { x: 1160, y: 150, w: 180, h: 92, t: 'Weather API', s: 'hourly quota', ico: 'third-party-api', shape: 'external' },

    { x: 280, y: 300, w: 180, h: 100, t: 'Data lake', s: 'Parquet', id: 'lake-raw', ico: 'data-lake', shape: 'store' },
    { x: 570, y: 304, w: 190, h: 92, t: 'Nightly ETL', s: 'partitioned', ico: 'etl-job', shape: 'service' },
    { x: 870, y: 300, w: 180, h: 100, t: 'Warehouse', s: 'ClickHouse', id: 'analytics', ico: 'clickhouse', shape: 'store' },
    { x: 1160, y: 304, w: 180, h: 92, t: 'Dashboards', s: 'Grafana', ico: 'dashboard', shape: 'application' },

    { x: 280, y: 460, w: 180, h: 100, t: 'Feature store', s: 'offline + online', ico: 'feature-store', shape: 'store' },
    { x: 570, y: 464, w: 190, h: 92, t: 'Training', s: 'PyTorch', ico: 'training-job', shape: 'service' },
    { x: 870, y: 460, w: 180, h: 100, t: 'Model registry', s: 'versioned', ico: 'model-registry', shape: 'store' },
    { x: 1160, y: 464, w: 180, h: 92, t: 'Inference', s: 'autoscaled', id: 'predict-v3', ico: 'model-serving', shape: 'service', featured: true },
  ],
  links: [
    { d: 'M190,196 H272' },
    { d: 'M190,346 H240 V196 H272' },
    { d: 'M460,196 H562' },
    { d: 'M760,196 H862' },
    { d: 'M1050,196 H1152' },
    { d: 'M370,242 V292' },
    { d: 'M960,242 V292' },
    { d: 'M460,350 H562' },
    { d: 'M760,350 H862' },
    { d: 'M1050,350 H1152' },
    { d: 'M370,400 V452' },
    { d: 'M460,510 H562' },
    { d: 'M760,510 H862' },
    { d: 'M1050,510 H1152' },
  ],
  marks: [
    ['mqtt', 235, 196, 'pushes'],
    ['https', 240, 271],
    ['rest', 1105, 196, 'reads tariffs'],
  ],
  notes: [
    [515, 186, 'writes', 'middle'],
    [815, 186, 'enriches', 'middle'],
    [370, 274, 'archives', 'middle'],
    [960, 274, 'loads', 'middle'],
    [515, 340, 'reads', 'middle'],
    [815, 340, 'loads', 'middle'],
    [1105, 340, 'queries', 'middle'],
    [370, 432, 'builds features', 'middle'],
    [515, 500, 'trains on', 'middle'],
    [815, 500, 'publishes', 'middle'],
    [1105, 500, 'loads', 'middle'],
  ],
  after: [
    marker(1160, 262, 'rate limited', '#C0392F'),
    marker(280, 574, 'point-in-time correct'),
    marker(1160, 574, 'A/B by version'),
  ].join(''),
});

// ─── Context view ─────────────────────────────────────────────────────────
// Level 1 of C4, which we were missing: who uses the system, and what it talks
// to. It is the only view sparse enough to carry the description C4 requires —
// name, type and description — without becoming unreadable. Seven boxes.
render({
  f: 'example-context.svg', w: 1240, h: 760,
  title: 'Voltis — context',
  sub: 'Context level · who uses the system, and what it talks to',
  nodes: [
    { x: 40, y: 120, w: 250, h: 150, t: 'Driver', s: 'person', ico: 'user', shape: 'actor',
      d: 'Charges their vehicle, reviews their history and receives a monthly invoice.' },
    { x: 40, y: 330, w: 250, h: 150, t: 'Network operator', s: 'person', ico: 'team', shape: 'actor',
      d: 'Supervises the estate, handles incidents and checks statements before issue.' },
    { x: 40, y: 540, w: 250, h: 130, t: 'Charge point', s: 'hardware · 2,400 units', ico: 'connected-device', shape: 'device',
      d: 'Measures the energy delivered and reports one record per session.' },

    { x: 420, y: 250, w: 320, h: 180, t: 'Voltis', s: 'the system described here', ico: 'springboot', shape: 'service', featured: true,
      d: 'Collects the records from the charge points, computes consumption statements and issues the monthly invoices.' },

    { x: 880, y: 120, w: 300, h: 150, t: 'Energy supplier', s: 'external system', ico: 'webhook', shape: 'external',
      d: 'Publishes the hourly tariffs Voltis applies when computing statements.' },
    { x: 880, y: 330, w: 300, h: 150, t: 'Mail relay', s: 'external system', ico: 'smtp', shape: 'external',
      d: 'Carries the invoices and the operating alerts to their recipients.' },
    { x: 880, y: 540, w: 300, h: 130, t: 'Bank', s: 'external system', ico: 'oauth', shape: 'external',
      d: 'Debits the invoiced amount against the driver mandate.' },
  ],
  links: [
    { d: 'M290,195 H414 V320' },
    { d: 'M290,405 H414' },
    { d: 'M290,605 H414 V436' },
    { d: 'M740,320 H874' },
    { d: 'M740,405 H874' },
    { d: 'M740,436 H806 V605 H874' },
  ],
  marks: [
    ['https', 352, 195, 'browses and pays'],
    ['mqtt', 352, 605, 'reports readings'],
    ['rest', 807, 320, 'queries the tariffs'],
    ['smtp', 807, 405, 'sends the invoices'],
  ],
  notes: [
    [352, 400, 'supervises', 'middle'],
    [807, 600, 'debits', 'middle'],
  ],
});
