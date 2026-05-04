/**
 * buildCaskLayers.js
 * cells + surfaces + materials → Three.js 렌더링 레이어 배열
 *
 * 지원 도형:
 * 매크로바디: RCC, RPP, BOX, SPH, TRC, REC, ELL, WED, RHP/HEX
 * 일반 표면:  CX/CY/CZ, C/X/C/Y/C/Z, SO/S/SX/SY/SZ,
 *            PX/PY/PZ, KX/KY/KZ, TX/TY/TZ, GQ/SQ
 */

const MAT_COLORS = [
  '#4f7fff','#1ec8e0','#f0a020','#28c99a','#f56a5a','#9b7ef8',
];

// 파라미터 키 정규화 (₀→0, 특수문자→_)
function normKey(p) {
  return p.replace(/[₀₁₂₃¹²³]/g, c =>
    ({'₀':'0','₁':'1','₂':'2','₃':'3','¹':'1','²':'2','³':'3'}[c]||c)
  ).replace(/[^a-zA-Z0-9]/g, '_');
}

function getParams(surf) {
  const raw = surf.params || {};
  const out = {};
  Object.entries(raw).forEach(([k, v]) => { out[normKey(k)] = parseFloat(v) || 0; });
  return out;
}

function extractSurfNums(expr) {
  if (!expr) return [];
  return (expr.match(/\d+/g) || []).map(Number);
}

function findSurf(surfaces, id) {
  return surfaces.find(s => s.id === id);
}

// ── 도형별 치수 추출 ────────────────────────────────────────

function dimRCC(p) {
  // RCC: x0 y0 z0  vx vy vz  r
  const vx = p.vx || 0, vy = p.vy || 0, vz = p.vz || 0;
  const h  = Math.sqrt(vx*vx + vy*vy + vz*vz) || 10;
  const r  = Math.abs(p.r || 1);
  return { shape:'cylinder', r, h,
    axis: Math.abs(vz) >= Math.abs(vx) && Math.abs(vz) >= Math.abs(vy) ? 'z'
        : Math.abs(vy) >= Math.abs(vx) ? 'y' : 'x' };
}

function dimRPP(p) {
  // RPP: xmin xmax ymin ymax zmin zmax
  const dx = Math.abs((p.xmax||1) - (p.xmin||0));
  const dy = Math.abs((p.ymax||1) - (p.ymin||0));
  const dz = Math.abs((p.zmax||1) - (p.zmin||0));
  return { shape:'box', w: dx, d: dy, h: dz };
}

function dimBOX(p) {
  // BOX: ax ay az  bx by bz  cx cy cz  (base + 3 edge vectors)
  const bx = p.bx||p.vx||1, by = p.by||p.vy||0, bz = p.bz||p.vz||0;
  const cx = p.cx||0,       cy = p.cy||1,        cz = p.cz||0;
  const dx = p.dx||0,       dy = p.dy||0,        dz = p.dz||1;
  const w = Math.sqrt(bx*bx+by*by+bz*bz)||1;
  const d = Math.sqrt(cx*cx+cy*cy+cz*cz)||1;
  const h = Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
  return { shape:'box', w, d, h };
}

function dimSPH(p) {
  // SPH: vx vy vz r  (center + radius)
  const r = Math.abs(p.r||1);
  return { shape:'sphere', r, h: r*2 };
}

function dimSO(p) {
  // SO: r  (sphere at origin)
  const r = Math.abs(p.r || p.d || 1);
  return { shape:'sphere', r, h: r*2 };
}

function dimS_axis(p, axis) {
  // SX/SY/SZ: pos r
  const r = Math.abs(p.r || 1);
  return { shape:'sphere', r, h: r*2 };
}

function dimTRC(p) {
  // TRC: x0 y0 z0  vx vy vz  r1 r2
  const vx = p.vx||0, vy = p.vy||0, vz = p.vz||0;
  const h  = Math.sqrt(vx*vx+vy*vy+vz*vz)||5;
  const r1 = Math.abs(p.r1||p.r||2);
  const r2 = Math.abs(p.r2||0);
  return { shape:'cone', r: Math.max(r1,r2), rTop: Math.min(r1,r2), h };
}

function dimREC(p) {
  // REC: x0 y0 z0  vx vy vz  ax ay az  bx by bz
  const vx=p.vx||0, vy=p.vy||0, vz=p.vz||0;
  const ax=p.ax||1, ay=p.ay||0, az=p.az||0;
  const bx=p.bx||0, by=p.by||1, bz=p.bz||0;
  const h  = Math.sqrt(vx*vx+vy*vy+vz*vz)||5;
  const ra = Math.sqrt(ax*ax+ay*ay+az*az)||1;
  const rb = Math.sqrt(bx*bx+by*by+bz*bz)||1;
  return { shape:'cylinder', r: (ra+rb)/2, h };
}

function dimELL(p) {
  // ELL: vx vy vz  ax ay az  r  (focus1, focus2, major axis length)
  const r = Math.abs(p.r||p.r0||1);
  return { shape:'sphere', r, h: r*2 };
}

function dimWED(p) {
  // WED: 삼각기둥 → box로 근사
  const h = Math.abs(p.vz||p.vy||p.vx||5);
  const r = Math.abs(p.r||1);
  return { shape:'box', w: r*2, d: r, h };
}

function dimRHP(p) {
  // RHP/HEX: 육각기둥
  const vx=p.vx||0, vy=p.vy||0, vz=p.vz||0;
  const h = Math.sqrt(vx*vx+vy*vy+vz*vz)||5;
  const r = Math.abs(p.r1||p.r||1);
  return { shape:'cylinder', r, h };  // cylinder로 근사
}

function dimCylAxis(p, axis) {
  // CX/CY/CZ: r  (infinite cylinder, finite로 근사)
  const r = Math.abs(p.r || p.d || 1);
  return { shape:'cylinder', r, h: r*10, axis };
}

function dimCylParallel(p, axis) {
  // C/X C/Y C/Z: y0 z0 r (or x0 z0 r or x0 y0 r)
  const r = Math.abs(p.r || 1);
  return { shape:'cylinder', r, h: r*10, axis };
}

function dimKone(p, axis) {
  // KX/KY/KZ: x0 t2  (무한 원뿔 → cone으로 근사)
  const t = Math.sqrt(Math.abs(p.t2 || 1));
  const h = Math.abs(p.x0 || p.y0 || p.z0 || 5) * 2;
  return { shape:'cone', r: h * t / 2, rTop: 0, h, axis };
}

function dimTorus(p, axis) {
  // TX/TY/TZ: x0 y0 z0  A B C
  const A = Math.abs(p.A || 3);  // major radius
  const B = Math.abs(p.B || 1);  // minor radius (ellipse semi-axis 1)
  const C = Math.abs(p.C || 1);  // minor radius (ellipse semi-axis 2)
  return { shape:'torus', r: A, tube: (B+C)/2, h: (A+(B+C)/2)*2, axis };
}

function dimGQ(p) {
  // GQ: 일반 2차 곡면 → sphere로 근사
  const r = 1;
  return { shape:'sphere', r, h: r*2 };
}

function dimPlane(p, axis) {
  // PX/PY/PZ: 무한 평면 → 얇은 box로 표현
  return { shape:'box', w: 10, d: 10, h: 0.05 };
}

// ── 타입 → 치수 디스패처 ───────────────────────────────────
function getDims(surf, params) {
  const t = surf.type.toUpperCase();
  switch(t) {
    // 매크로바디
    case 'RCC':  return dimRCC(params);
    case 'RPP':  return dimRPP(params);
    case 'BOX':  return dimBOX(params);
    case 'SPH':  return dimSPH(params);
    case 'TRC':  return dimTRC(params);
    case 'REC':  return dimREC(params);
    case 'ELL':  return dimELL(params);
    case 'WED':  return dimWED(params);
    case 'RHP':
    case 'HEX':  return dimRHP(params);
    // 구
    case 'SO':   return dimSO(params);
    case 'S':    return dimSPH(params);
    case 'SX':   return dimS_axis(params, 'x');
    case 'SY':   return dimS_axis(params, 'y');
    case 'SZ':   return dimS_axis(params, 'z');
    // 원기둥 (축 중심)
    case 'CX':   return dimCylAxis(params, 'x');
    case 'CY':   return dimCylAxis(params, 'y');
    case 'CZ':   return dimCylAxis(params, 'z');
    // 원기둥 (축 평행)
    case 'C/X':  return dimCylParallel(params, 'x');
    case 'C/Y':  return dimCylParallel(params, 'y');
    case 'C/Z':  return dimCylParallel(params, 'z');
    // 원뿔
    case 'KX':   return dimKone(params, 'x');
    case 'KY':   return dimKone(params, 'y');
    case 'KZ':   return dimKone(params, 'z');
    case 'K/X':  return dimKone(params, 'x');
    case 'K/Y':  return dimKone(params, 'y');
    case 'K/Z':  return dimKone(params, 'z');
    // 토러스
    case 'TX':   return dimTorus(params, 'x');
    case 'TY':   return dimTorus(params, 'y');
    case 'TZ':   return dimTorus(params, 'z');
    // 평면
    case 'PX':   return dimPlane(params, 'x');
    case 'PY':   return dimPlane(params, 'y');
    case 'PZ':   return dimPlane(params, 'z');
    case 'P':    return dimPlane(params, 'z');
    // 2차 곡면
    case 'GQ':
    case 'SQ':   return dimGQ(params);
    default:     return null;
  }
}

// ── 스케일 자동 조정 ─────────────────────────────────────────
function autoScale(dims) {
  const maxDim = Math.max(
    dims.r || 0, dims.h || 0,
    dims.w || 0, dims.d || 0,
    dims.tube || 0,
  );
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
  const normalCells = cells.filter(c => c.type !== 'boundary');

  normalCells.forEach((cell, ci) => {
    const matId = parseInt(cell.mat);
    const mat   = materials.find(m => m.id === matId);
    const color = MAT_COLORS[ci % MAT_COLORS.length];
    const label = mat?.name || `셀 ${cell.id}`;

    const surfNums = extractSurfNums(cell.surf);

    // 표면 번호 없으면 기본 원통
    if (!surfNums.length) {
      layers.push({ type:'RCC', shape:'cylinder', r: Math.max(0.5, 2.5 - ci*0.5), h: 5, color, label });
      return;
    }

    // 표면 번호들 중 첫 번째로 유효한 것 사용
    let pushed = false;
    for (const snum of surfNums) {
      const surf = findSurf(surfaces, snum);
      if (!surf) continue;

      const params = getParams(surf);
      const dims   = getDims(surf, params);
      if (!dims) continue;

      const scale  = autoScale(dims);

      layers.push({
        type:    surf.type,
        shape:   dims.shape,
        r:       (dims.r    || 1) * scale,
        h:       (dims.h    || 5) * scale,
        w:       (dims.w    || dims.r || 1) * scale,
        d:       (dims.d    || dims.r || 1) * scale,
        rTop:    (dims.rTop || 0) * scale,
        tube:    (dims.tube || 0.3) * scale,
        axis:    dims.axis || 'z',
        color,
        label,
        surfType: surf.type,
        rawR:    dims.r,
        rawH:    dims.h,
      });
      pushed = true;
      break;
    }

    if (!pushed) {
      layers.push({ type:'RCC', shape:'cylinder', r: Math.max(0.5, 2.5 - ci*0.5), h: 5, color, label });
    }
  });

  return layers;
}
