import { SURF_PARAMS } from '@/utils/constants';

const GAP = 3;

function padKey(p) {
  return p.replace(/[₀¹²³]/g, '0').replace(/[^a-zA-Z0-9]/g, '_');
}

// ── Surface Lines ──────────────────────────────────────────
export function getSurfLines(surfaces) {
  if (!surfaces.length) return [];
  const rows = surfaces.map(s => {
    const ps = SURF_PARAMS[s.type] || [];
    const vals = ps.map(p => s.params?.[padKey(p)] || '0');
    return { id: s.id, t: s.type, vals };
  });
  const idW = Math.max(...rows.map(r => String(r.id).length)) + GAP;
  const tW  = Math.max(...rows.map(r => r.t.length)) + GAP;
  const maxP = Math.max(0, ...rows.map(r => r.vals.length));
  const colW = Array.from({ length: maxP }, (_, ci) =>
    Math.max(1, ...rows.map(r => String(r.vals[ci] || '0').length)) + GAP
  );
  return rows.map(r => {
    const idStr = String(r.id).padEnd(idW);
    const tStr  = r.t.padEnd(tW);
    const vStr  = r.vals.map((v, ci) => v.padStart(colW[ci])).join('');
    return idStr + tStr + vStr;
  });
}

// ── Cell Lines ─────────────────────────────────────────────
export function getCellLines(cells, latFillRange, latFillVals) {
  if (!cells.length) return [];
  const GAP = 3;
  const cW = Math.max(...cells.map(c => String(c.id).length)) + GAP;
  const mW = Math.max(...cells.map(c => c.type === 'boundary' ? 1 : String(c.mat || '0').length)) + GAP;
  const dW = Math.max(...cells.map(c => c.type === 'boundary' ? 0 : String(c.dens || '').length)) + GAP;
  const sW = Math.max(...cells.map(c => String(c.surf || '').length)) + GAP;
  const contIndent = ' '.repeat(cW + mW + dW);

  const lines = [];
  cells.forEach(c => {
    const cStr = String(c.id).padEnd(cW);
    const sStr = (c.surf || '').padEnd(sW);

    if (c.type === 'boundary') {
      lines.push(cStr + '0'.padEnd(mW) + ' '.repeat(dW) + sStr + 'imp:n=0 $ Boundary');
      return;
    }
    const mStr = String(c.mat || '0').padEnd(mW);
    const dStr = String(c.dens || '').padStart(dW - GAP).padEnd(dW);

    if (c.type === 'lat') {
      const frange = latFillRange || '0:3 0:3 0:0';
      const fvals  = latFillVals  || '';
      let line = cStr + mStr + dStr + sStr + `lat=${c.latType || '1'}  u=${c.u || '2'}  imp:n=1`;
      line += `\n${contIndent}fill=${frange}`;
      fvals.trim().split('\n').forEach(v => { line += `\n${contIndent}     ${v}`; });
      lines.push(line);
      return;
    }
    if (c.type === 'fill') {
      lines.push(cStr + mStr + dStr + sStr + `fill=${c.fillExpr || '2'}  imp:n=1`);
      return;
    }
    const uPart = c.u && c.u !== '0' ? `u=${c.u}  ` : '';
    lines.push(cStr + mStr + dStr + sStr + uPart + 'imp:n=1');
  });
  return lines;
}

// ── IMP Line ───────────────────────────────────────────────
export function getImpLine(par, cells, impOverrides) {
  if (!cells.length) return '';
  const vals = cells.map(c => {
    const ov = impOverrides?.[par]?.[c.id];
    if (ov !== undefined) return String(ov);
    return c.type === 'boundary' ? '0' : '1';
  });
  const colW = vals.map(v => Math.max(1, v.length) + 2);
  return `IMP:${par}  ` + vals.map((v, i) => v.padStart(colW[i])).join('');
}

// ── Material Lines ─────────────────────────────────────────
export function getMatLines(materials) {
  if (!materials.length) return [];

  const lines = [];
  const mW = Math.max(...materials.map(m => `M${m.id}`.length)) + 3;

  materials.forEach(m => {
    const mLabel = `M${m.id}`.padEnd(mW);

    // zaid가 배열 구조 [ [zaid, dens, comment], ... ]
    if (Array.isArray(m.zaid) && m.zaid.length) {
      // 컬럼 폭 계산
      const zW = Math.max(...m.zaid.map(z => String(z[0]).length)) + 3;
      const dW = Math.max(...m.zaid.map(z => String(z[1]).length)) + 3;
      const indent = ' '.repeat(mW);

      m.zaid.forEach((entry, i) => {
        const zaid    = String(entry[0]).padEnd(zW);
        const density = String(entry[1]).padStart(dW);
        const comment = entry[2] ? `    $ ${entry[2]}` : '';
        const prefix  = i === 0 ? mLabel : indent;
        lines.push(`${prefix}${zaid}${density}${comment}`);
      });
    } else if (typeof m.zaid === 'string' && m.zaid.trim()) {
      // 구형 문자열 포맷 fallback
      lines.push(mLabel + m.zaid);
    } else {
      lines.push(mLabel + '$ ZAID 미입력');
    }
  });

  return lines;
}

// ── Tally Lines ────────────────────────────────────────────
function wrapLine(prefix, vals, indent = '         ') {
  const nums = vals.trim().split(/\s+/);
  let cur = prefix; const out = [];
  nums.forEach((v, i) => {
    if (i === 0) { cur += v; }
    else if ((cur + ' ' + v).length > 72) { out.push(cur); cur = indent + v; }
    else cur += ' ' + v;
  });
  out.push(cur);
  return out;
}

export function getTallyLines(tallies) {
  const lines = [];
  tallies.forEach(t => {
    const tNum = t.type.replace('F', '');
    const kw = `${t.type}:${t.par}`;
    lines.push(kw.padEnd(kw.length + GAP) + (t.cells || ''));
    if (t.fm && t.fm !== '—') lines.push(`FM${tNum}`.padEnd(6) + t.fm);
    if (t.eOpen && t.eBins?.trim())
      wrapLine(`E${tNum}    `, t.eBins).forEach(l => lines.push(l));
    if (t.deOpen && t.de?.trim() && t.df?.trim()) {
      wrapLine(`DE${tNum}   `, t.de).forEach(l => lines.push(l));
      wrapLine(`DF${tNum}   `, t.df).forEach(l => lines.push(l));
    }
  });
  return lines;
}

// ── SI/SP Lines ────────────────────────────────────────────
export function getSISPLines(si1, sp1) {
  const lines = [];
  if (si1?.trim()) lines.push('SI1    ' + si1.trim());
  if (sp1?.trim()) lines.push('SP1    ' + sp1.trim());
  return lines;
}

// ── FMESH Lines ────────────────────────────────────────────
export function getFMESHLines(fm) {
  if (!fm?.enabled) return [];
  const p12 = s => s.padEnd(14);
  return [
    `FMESH${fm.num}:${fm.par}  ${p12('geom=' + fm.geom)}origin=${fm.ox} ${fm.oy} ${fm.oz}`,
    `          ${p12('imesh=' + fm.imesh)}iints=${fm.iints}`,
    `          ${p12('jmesh=' + fm.jmesh)}jints=${fm.jints}`,
    `          ${p12('kmesh=' + fm.kmesh)}kints=${fm.kints}`,
    `          out=${fm.out}` + (fm.factor ? `    factor=${fm.factor}` : ''),
  ];
}

// ── KSRC Lines ─────────────────────────────────────────────
export function getKsrcLines(ksrcPoints) {
  if (!ksrcPoints?.length) return [];
  const pts = ksrcPoints.map(p => `${p.x || 0}  ${p.y || 0}  ${p.z || 0}`).join('     ');
  return ['KSRC   ' + pts];
}

// ── Main Generator ─────────────────────────────────────────
export function generateMCNP(state) {
  const {
    title, modes, cells, surfaces, materials,
    impOverrides, appMode,
    sdef, kcode, ksrcPoints,
    tallies, si1, sp1, fmesh,
    nps, latFillRange, latFillVals,
  } = state;

  const L = [];
  L.push(title || 'MCNP Problem');
  L.push('c');
  L.push('MODE ' + [...modes].join(' '));
  L.push('c');

  L.push('c ==== CELL CARD ====');
  getCellLines(cells, latFillRange, latFillVals).forEach(l => L.push(l));
  L.push('c');

  L.push('c ==== SURFACE CARD ====');
  getSurfLines(surfaces).forEach(l => L.push(l));
  L.push('c');

  L.push('c ==== DATA CARD ====');
  const impN = getImpLine('N', cells, impOverrides);
  if (impN) L.push(impN);
  if (modes.has('P')) { const impP = getImpLine('P', cells, impOverrides); if (impP) L.push(impP); }
  if (modes.has('E')) { const impE = getImpLine('E', cells, impOverrides); if (impE) L.push(impE); }

  const matLines = getMatLines(materials);
  if (matLines.length) { L.push('c --- Materials ---'); matLines.forEach(l => L.push(l)); }

  if (appMode === 'crit') {
    L.push('c --- Criticality ---');
    L.push(`KCODE  ${kcode?.n || '10000'}  ${kcode?.k || '1.0'}  ${kcode?.ic || '50'}  ${kcode?.it || '250'}`);
    getKsrcLines(ksrcPoints).forEach(l => L.push(l));
  } else {
    L.push('c --- Source ---');
    const erg = sdef?.ergMode === 'custom' ? (sdef?.ergCustom || '1.25') : (sdef?.erg || '1.25');
    L.push(`SDEF   POS=${sdef?.x || 0} ${sdef?.y || 0} ${sdef?.z || 0}  ERG=${erg}  PAR=${sdef?.par || 'P'}`);
    getSISPLines(si1, sp1).forEach(l => L.push(l));
  }

  const tallyLines = getTallyLines(tallies || []);
  if (tallyLines.length) { L.push('c --- Tallies ---'); tallyLines.forEach(l => L.push(l)); }

  const fmLines = getFMESHLines(fmesh);
  if (fmLines.length) { L.push('c --- Mesh Tally ---'); fmLines.forEach(l => L.push(l)); }

  L.push(`NPS    ${nps || '1000000'}`);
  return L;
}

// ── Syntax Highlight ───────────────────────────────────────
export function highlightLine(l) {
  const t = l.trimStart();
  if (t.startsWith('c ') || t === 'c') return 'comment';
  if (/^(MODE|IMP|SDEF|KCODE|KSRC|NPS|SI|SP|DE\d|DF\d|FMESH|FM\d)\b/.test(t)) return 'keyword';
  if (/^M\d+/.test(t)) return 'material';
  if (/^F[0-9]/.test(t)) return 'tally';
  if (/^\d/.test(t)) {
    if (t.includes('lat=') || t.includes('fill=')) return 'lat';
    if (t.includes('imp:n=0')) return 'boundary';
    if (t.includes('u=')) return 'universe';
    return 'cell';
  }
  if (/^\s+(fill=|[0-9])/.test(l)) return 'lat';
  return 'default';
}
