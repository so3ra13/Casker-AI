/**
 * cells, surfaces, materials 상태에서
 * Three.js로 렌더링할 Cask 레이어 배열을 추출합니다.
 *
 * 지원 형상: RCC (원통), SPH (구), RPP (직육면체)
 * 우선순위: boundary가 아닌 일반 셀 + 연결된 RCC/SPH/RPP 서페이스
 */

const MAT_COLORS = [
  '#4f7fff', // blue  - 외부 차폐
  '#1ec8e0', // teal  - 내부 차폐
  '#f0a020', // amber - 선원 영역
  '#28c99a', // green
  '#f56a5a', // coral
  '#9b7ef8', // purple
];

/**
 * 셀의 표면식에서 첫 번째 참조 표면 번호 추출
 * 예: "-1 2 -3" → [1, 2, 3]
 */
function extractSurfNums(surfExpr) {
  if (!surfExpr) return [];
  return (surfExpr.match(/\d+/g) || []).map(Number);
}

/**
 * surfaces 배열에서 id로 서페이스 찾기
 */
function findSurf(surfaces, id) {
  return surfaces.find(s => s.id === id);
}

/**
 * RCC 파라미터에서 반지름과 높이 추출
 * params: { x0, y0, z0, vx, vy, vz, r }
 */
function getRCCDimensions(params) {
  const r = parseFloat(params?.r || params?.r0 || 0);
  // 높이 = 방향벡터 크기
  const vx = parseFloat(params?.vx || 0);
  const vy = parseFloat(params?.vy || 0);
  const vz = parseFloat(params?.vz || 360); // 기본값 360 (MCNP 관례)
  const h = Math.sqrt(vx * vx + vy * vy + vz * vz);
  return { r: isNaN(r) ? 1 : r, h: isNaN(h) || h === 0 ? 5 : h };
}

/**
 * SPH 파라미터에서 반지름 추출
 */
function getSPHDimensions(params) {
  const r = parseFloat(params?.r || 1);
  return { r: isNaN(r) ? 1 : r, h: r * 2 };
}

/**
 * RPP 파라미터에서 크기 추출 (x방향을 반지름으로 근사)
 */
function getRPPDimensions(params) {
  const xmin = parseFloat(params?.xmin || -1);
  const xmax = parseFloat(params?.xmax ||  1);
  const zmin = parseFloat(params?.zmin || -1);
  const zmax = parseFloat(params?.zmax ||  1);
  const r = (xmax - xmin) / 2;
  const h = zmax - zmin;
  return { r: isNaN(r) ? 1 : Math.abs(r), h: isNaN(h) ? 2 : Math.abs(h) };
}

// 파라미터 키 정규화 (₀ → 0 등)
function normalizeParamKey(p) {
  return p.replace(/[₀¹²³]/g, '0').replace(/[^a-zA-Z0-9]/g, '_');
}

function getParams(surf) {
  const raw = surf.params || {};
  const normalized = {};
  Object.entries(raw).forEach(([k, v]) => { normalized[normalizeParamKey(k)] = v; });
  return normalized;
}

/**
 * 메인 함수: cells + surfaces + materials → 렌더링 레이어 배열
 */
export function buildCaskLayers(cells, surfaces, materials) {
  if (!cells.length && !materials.length) return [];

  const layers = [];

  // boundary, lat, fill 제외한 일반 셀만
  const normalCells = cells.filter(c => c.type !== 'boundary');

  normalCells.forEach((cell, ci) => {
    // 연결된 재질 찾기
    const matId = parseInt(cell.mat);
    const mat = materials.find(m => m.id === matId);
    const color = MAT_COLORS[ci % MAT_COLORS.length];

    // 표면 번호들 추출
    const surfNums = extractSurfNums(cell.surf);
    if (!surfNums.length) {
      // 서페이스 정의 없으면 재질만으로 기본 크기 추정
      layers.push({
        type: 'RCC',
        r: Math.max(0.5, 2.5 - ci * 0.5),
        h: 5,
        color,
        label: mat?.name || `셀 ${cell.id}`,
        matName: mat?.name || '',
      });
      return;
    }

    // 첫 번째로 찾은 유효한 서페이스 사용
    let found = false;
    for (const snum of surfNums) {
      const surf = findSurf(surfaces, snum);
      if (!surf) continue;

      const params = getParams(surf);
      let dims = { r: 1, h: 5 };

      if (surf.type === 'RCC') dims = getRCCDimensions(params);
      else if (surf.type === 'SPH' || surf.type === 'SO') dims = getSPHDimensions(params);
      else if (surf.type === 'RPP') dims = getRPPDimensions(params);
      else if (['CZ', 'PZ'].includes(surf.type)) {
        dims = { r: parseFloat(params?.r || params?.d || 1), h: 5 };
      } else continue; // 지원 안 하는 형상은 스킵

      // 단위 변환: MCNP는 cm, Three.js scene은 cm 그대로 (카메라 조정)
      // 단 너무 크면 스케일 다운
      const scale = Math.max(dims.r, dims.h) > 500 ? 0.01 :
                    Math.max(dims.r, dims.h) > 100 ? 0.05 :
                    Math.max(dims.r, dims.h) > 20  ? 0.2  : 1;

      layers.push({
        type: surf.type,
        r: dims.r * scale,
        h: dims.h * scale,
        color,
        label: mat?.name || `셀 ${cell.id}`,
        matName: mat?.name || '',
        surfType: surf.type,
        rawR: dims.r,
        rawH: dims.h,
      });
      found = true;
      break;
    }

    if (!found) {
      // 서페이스 못 찾으면 기본값
      layers.push({
        type: 'RCC',
        r: Math.max(0.5, 2.5 - ci * 0.5),
        h: 5,
        color,
        label: mat?.name || `셀 ${cell.id}`,
        matName: mat?.name || '',
      });
    }
  });

  return layers;
}