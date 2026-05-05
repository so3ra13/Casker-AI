/**
 * buildCaskLayers.js
 * cells + surfaces + materials → Three.js 렌더링 레이어 배열
 *
 * 핵심: 셀 표면식의 여러 서페이스를 조합해서 하나의 유한 형상으로 합성
 *
 * 조합 패턴:
 *   CZ/CX/CY + PZ/PX/PY 두 개 → 유한 원기둥
 *   SO/S/SX/SY/SZ            → 구
 *   RCC, RPP, BOX, TRC 등    → 매크로바디 (단독)
 *   PZ/PX/PY 만 있을 때      → 평면 (얇은 디스크)
 */

const MAT_COLORS = [
  '#4f7fff','#1ec8e0','#f0a020','#28c99a','#f56a5a','#9b7ef8',
];

// 파라미터 키 정규화
function normKey(p) {
  return p
    .replace(/[₀₁₂₃¹²³]/g, c => ({'₀':'0','₁':'1','₂':'2','₃':'3','¹':'1','²':'2','³':'3'}[c]||c))
    .replace(/[^a-zA-Z0-9]/g, '_');
}

function getParams(surf) {
  const raw = surf.params || {};
  const out = {};
  Object.entries(raw).forEach(([k, v]) => {
    const val = parseFloat(v);
    out[normKey(k)] = isNaN(val) ? 0 : val;
  });
  return out;
}

function extractSurfNums(expr) {
  if (!expr) return [];
  return (expr.match(/\d+/g) || []).map(Number);
}

function findSurf(surfaces, id) {
  return surfaces.find(s => s.id === id);
}

// ── 단일 서페이스 치수 ───────────────────────────────────────
function getSingleDims(surf, params) {
  const t = surf.type.toUpperCase();
  switch (t) {
    // ── 매크로바디 ──
    case 'RCC': {
      const vx = params.vx||0, vy = params.vy||0, vz = params.vz||0;
      const h  = Math.sqrt(vx*vx + vy*vy + vz*vz) || 10;
      const r  = Math.abs(params.r || 1);
      const axis = Math.abs(vz) >= Math.abs(vx) && Math.abs(vz) >= Math.abs(vy) ? 'z'
                 : Math.abs(vy) >= Math.abs(vx) ? 'y' : 'x';
      return { shape:'cylinder', r, h, axis };
    }
    case 'RPP': {
      const dx = Math.abs((params.xmax||1) - (params.xmin||0));
      const dy = Math.abs((params.ymax||1) - (params.ymin||0));
      const dz = Math.abs((params.zmax||1) - (params.zmin||0));
      return { shape:'box', r: Math.max(dx,dy)/2, w:dx, d:dy, h:dz };
    }
    case 'BOX': {
      const bx=params.bx||1, by=params.by||0, bz=params.bz||0;
      const cx=params.cx||0, cy=params.cy||1, cz=params.cz||0;
      const dx=params.dx||0, dy=params.dy||0, dz=params.dz||1;
      const w = Math.sqrt(bx*bx+by*by+bz*bz)||1;
      const d = Math.sqrt(cx*cx+cy*cy+cz*cz)||1;
      const h = Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
      return { shape:'box', r:Math.max(w,d)/2, w, d, h };
    }
    case 'SPH':
    case 'S': {
      const r = Math.abs(params.r || 1);
      return { shape:'sphere', r, h:r*2 };
    }
    case 'SO': {
      const r = Math.abs(params.r || params.d || 1);
      return { shape:'sphere', r, h:r*2 };
    }
    case 'SX': case 'SY': case 'SZ': {
      const r = Math.abs(params.r || 1);
      return { shape:'sphere', r, h:r*2 };
    }
    case 'TRC': {
      const vx=params.vx||0, vy=params.vy||0, vz=params.vz||0;
      const h  = Math.sqrt(vx*vx+vy*vy+vz*vz)||5;
      const r1 = Math.abs(params.r1||params.r||2);
      const r2 = Math.abs(params.r2||0);
      return { shape:'cone', r:Math.max(r1,r2), rTop:Math.min(r1,r2), h };
    }
    case 'REC': {
      const vx=params.vx||0, vy=params.vy||0, vz=params.vz||0;
      const ax=params.ax||1, ay=params.ay||0, az=params.az||0;
      const bx=params.bx||0, by=params.by||1, bz=params.bz||0;
      const h  = Math.sqrt(vx*vx+vy*vy+vz*vz)||5;
      const ra = Math.sqrt(ax*ax+ay*ay+az*az)||1;
      const rb = Math.sqrt(bx*bx+by*by+bz*bz)||1;
      return { shape:'cylinder', r:(ra+rb)/2, h, axis:'z' };
    }
    case 'ELL':
    case 'WED':
    case 'RHP':
    case 'HEX': {
      const r = Math.abs(params.r || params.r1 || 1);
      const h = Math.abs(params.vz || params.vy || params.vx || r*4);
      return { shape:'cylinder', r, h, axis:'z' };
    }
    // ── 일반 표면 (단독일 때만 fallback) ──
    case 'CX': return { shape:'cylinder', r:Math.abs(params.r||1), h:(params.r||1)*10, axis:'x' };
    case 'CY': return { shape:'cylinder', r:Math.abs(params.r||1), h:(params.r||1)*10, axis:'y' };
    case 'CZ': return { shape:'cylinder', r:Math.abs(params.r||1), h:(params.r||1)*10, axis:'z' };
    case 'TX': return { shape:'torus', r:Math.abs(params.A||3), tube:Math.abs(params.B||1), h:0, axis:'x' };
    case 'TY': return { shape:'torus', r:Math.abs(params.A||3), tube:Math.abs(params.B||1), h:0, axis:'y' };
    case 'TZ': return { shape:'torus', r:Math.abs(params.A||3), tube:Math.abs(params.B||1), h:0, axis:'z' };
    case 'KX': case 'K/X': { const h=10; return { shape:'cone', r:h*Math.sqrt(Math.abs(params.t2||0.5)), rTop:0, h, axis:'x' }; }
    case 'KY': case 'K/Y': { const h=10; return { shape:'cone', r:h*Math.sqrt(Math.abs(params.t2||0.5)), rTop:0, h, axis:'y' }; }
    case 'KZ': case 'K/Z': { const h=10; return { shape:'cone', r:h*Math.sqrt(Math.abs(params.t2||0.5)), rTop:0, h, axis:'z' }; }
    case 'PX': return { shape:'plane', r:5, h:0.05, w:10, d:10, axis:'x' };
    case 'PY': return { shape:'plane', r:5, h:0.05, w:10, d:10, axis:'y' };
    case 'PZ': return { shape:'plane', r:5, h:0.05, w:10, d:10, axis:'z' };
    case 'P':  return { shape:'plane', r:5, h:0.05, w:10, d:10, axis:'z' };
    case 'GQ': case 'SQ': return { shape:'sphere', r:1, h:2 };
    default:   return null;
  }
}

// ── 핵심: 여러 서페이스 조합 → 유한 형상 합성 ────────────────
function combineSurfaces(surfs) {
  const types = surfs.map(s => s.type.toUpperCase());

  // ── 매크로바디는 단독 처리 ──
  const MACROBODIES = ['RCC','RPP','BOX','SPH','TRC','REC','ELL','WED','RHP','HEX'];
  const macro = surfs.find(s => MACROBODIES.includes(s.type.toUpperCase()));
  if (macro) return getSingleDims(macro, getParams(macro));

  // ── 구 (SO/S/SX/SY/SZ) ──
  const sphere = surfs.find(s => ['SO','S','SX','SY','SZ'].includes(s.type.toUpperCase()));
  if (sphere) return getSingleDims(sphere, getParams(sphere));

  // ── CZ + PZ 조합 → 유한 원기둥 (z축) ──
  const cyl = surfs.find(s => s.type.toUpperCase() === 'CZ');
  const pzs = surfs.filter(s => s.type.toUpperCase() === 'PZ');
  if (cyl && pzs.length >= 2) {
    const r = Math.abs(getParams(cyl).r || 1);
    const zVals = pzs.map(p => getParams(p).d || 0).sort((a, b) => a - b);
    const h = Math.abs(zVals[zVals.length - 1] - zVals[0]) || r * 4;
    return { shape:'cylinder', r, h, axis:'z' };
  }
  if (cyl && pzs.length === 1) {
    const r = Math.abs(getParams(cyl).r || 1);
    const h = r * 6;
    return { shape:'cylinder', r, h, axis:'z' };
  }

  // ── CX + PX 조합 → 유한 원기둥 (x축) ──
  const cylX = surfs.find(s => s.type.toUpperCase() === 'CX');
  const pxs  = surfs.filter(s => s.type.toUpperCase() === 'PX');
  if (cylX && pxs.length >= 2) {
    const r = Math.abs(getParams(cylX).r || 1);
    const xVals = pxs.map(p => getParams(p).d || 0).sort((a, b) => a - b);
    const h = Math.abs(xVals[xVals.length - 1] - xVals[0]) || r * 4;
    return { shape:'cylinder', r, h, axis:'x' };
  }

  // ── CY + PY 조합 → 유한 원기둥 (y축) ──
  const cylY = surfs.find(s => s.type.toUpperCase() === 'CY');
  const pys  = surfs.filter(s => s.type.toUpperCase() === 'PY');
  if (cylY && pys.length >= 2) {
    const r = Math.abs(getParams(cylY).r || 1);
    const yVals = pys.map(p => getParams(p).d || 0).sort((a, b) => a - b);
    const h = Math.abs(yVals[yVals.length - 1] - yVals[0]) || r * 4;
    return { shape:'cylinder', r, h, axis:'y' };
  }

  // ── C/Z (축 평행 원기둥) + PZ 조합 ──
  const cylPZ = surfs.find(s => ['C/Z','CZ'].includes(s.type.toUpperCase()));
  if (cylPZ) {
    const p = getParams(cylPZ);
    const r = Math.abs(p.r || 1);
    if (pzs.length >= 2) {
      const zVals = pzs.map(pl => getParams(pl).d || 0).sort((a,b) => a-b);
      return { shape:'cylinder', r, h: Math.abs(zVals[zVals.length-1] - zVals[0]) || r*4, axis:'z' };
    }
    return { shape:'cylinder', r, h: r * 6, axis:'z' };
  }

  // ── PZ만 여러 개 → 렌더링 제외 (평면은 셀 형상이 아님) ──
  const onlyPlanes = surfs.every(s => ['PX','PY','PZ','P'].includes(s.type.toUpperCase()));
  if (onlyPlanes) return null;  // ← 평면만 있으면 건너뜀

  // ── 단독 원기둥 (유한 못 구성) ──
  const anyCyl = surfs.find(s => ['CX','CY','CZ','C/X','C/Y','C/Z'].includes(s.type.toUpperCase()));
  if (anyCyl) {
    const r = Math.abs(getParams(anyCyl).r || 1);
    const axis = anyCyl.type.toUpperCase().includes('X') ? 'x'
               : anyCyl.type.toUpperCase().includes('Y') ? 'y' : 'z';
    return { shape:'cylinder', r, h: r * 6, axis };
  }

  // ── 토러스 ──
  const torus = surfs.find(s => ['TX','TY','TZ'].includes(s.type.toUpperCase()));
  if (torus) return getSingleDims(torus, getParams(torus));

  // ── 원뿔 ──
  const cone = surfs.find(s => ['KX','KY','KZ','K/X','K/Y','K/Z'].includes(s.type.toUpperCase()));
  if (cone) return getSingleDims(cone, getParams(cone));

  return null;
}

// ── 스케일 자동 조정 ─────────────────────────────────────────
function autoScale(dims) {
  const maxDim = Math.max(dims.r||0, dims.h||0, dims.w||0, dims.d||0);
  if (maxDim > 1000) return 0.005;
  if (maxDim > 500)  return 0.01;
  if (maxDim > 200)  return 0.02;
  if (maxDim > 100)  return 0.05;
  if (maxDim > 50)   return 0.1;
  if (maxDim > 20)   return 0.2;
  return 1;
}

// ── 메인 함수 ────────────────────────────────────────────────
export function buildCaskLayers(cells, surfaces, materials) {
  if (!cells.length) return [];

  const layers = [];
  const normalCells = cells.filter(c => c.type !== 'boundary' && c.type !== 'lat');

  normalCells.forEach((cell, ci) => {
    const matId = parseInt(cell.mat);
    const mat   = materials.find(m => m.id === matId);
    const color = MAT_COLORS[ci % MAT_COLORS.length];
    const label = mat?.name || `셀 ${cell.id}`;

    const surfNums = (cell.surf?.match(/\d+/g) || []).map(Number);
    if (!surfNums.length) {
      layers.push({ shape:'cylinder', r: Math.max(0.5, 2.5 - ci*0.5), h:5, color, label });
      return;
    }

    // 셀에 연결된 모든 서페이스 수집
    const surfs = surfNums.map(n => findSurf(surfaces, n)).filter(Boolean);
    if (!surfs.length) {
      layers.push({ shape:'cylinder', r: Math.max(0.5, 2.5 - ci*0.5), h:5, color, label });
      return;
    }

    // 조합 → 유한 형상
    const dims = combineSurfaces(surfs);
    if (!dims) return;  // 평면만 있는 경우 스킵

    const scale = autoScale(dims);

    layers.push({
      shape:   dims.shape,
      r:       (dims.r    || 1)   * scale,
      h:       (dims.h    || 5)   * scale,
      w:       (dims.w    || dims.r || 1) * scale,
      d:       (dims.d    || dims.r || 1) * scale,
      rTop:    (dims.rTop || 0)   * scale,
      tube:    (dims.tube || (dims.r||1) * 0.25) * scale,
      axis:    dims.axis || 'z',
      color,
      label,
      surfType: surfs[0]?.type,
      rawR:    dims.r,
      rawH:    dims.h,
    });
  });

  return layers;
}
