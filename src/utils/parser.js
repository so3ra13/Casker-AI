export function parseMCNP(code) {
  const lines = code.split('\n');
  const title = lines[0]?.trim() || '';
  let section = 0;
  let cellCount = 0, surfCount = 0, matCount = 0, nps = '—', mode = '—';
  let impCount = 0;
  const errors = [], warns = [];

  // 렌더링용 구조체
  const parsedCells = [];
  const parsedSurfs = [];

  // 연속행 처리 (& 또는 5열 들여쓰기)
  const joined = [];
  let buf = '';
  lines.slice(1).forEach(raw => {
    const l = raw.trimEnd();
    if (/^\s{5,}/.test(l) && buf) {
      buf += ' ' + l.trim();
    } else {
      if (buf) joined.push(buf);
      buf = l;
    }
  });
  if (buf) joined.push(buf);

  joined.forEach((raw, i) => {
    const l = raw.trim();
    const ln = i + 2;
    if ((l === '' || l === 'c') && section < 2) { section++; return; }
    if (l.startsWith('c ') || l === 'c') return;

    // ── Cell Card ──
    if (section === 0 && /^\d/.test(l)) {
      cellCount++;
      const parts = l.split(/\s+/);
      const cellId = parseInt(parts[0]);
      const matId  = parseInt(parts[1]);
      const dens   = parts[2];
      // 표면식: mat=0이면 3번째부터, 아니면 4번째부터 키워드 전까지
      const surfExprParts = [];
      let ki = matId === 0 ? 2 : 3;
      for (; ki < parts.length; ki++) {
        if (/^(imp|u=|lat=|fill=|trcl=|tmp=)/i.test(parts[ki])) break;
        surfExprParts.push(parts[ki]);
      }
      const surfExpr = surfExprParts.join(' ');
      const isBoundary = parts.slice(ki).some(p => /imp:n=0/i.test(p)) || matId === 0;
      if (!isNaN(d = parseFloat(dens)) || true) {
        parsedCells.push({
          id: cellId,
          mat: matId === 0 ? '' : String(matId),
          dens: dens || '',
          surf: surfExpr,
          type: isBoundary ? 'boundary' : 'normal',
        });
      }
      if (parts[1] && parts[1] !== '0' && parts[2]) {
        const d = parseFloat(parts[2]);
        if (isNaN(d)) errors.push({ ln, msg: `셀 ${parts[0]}: 밀도 값이 유효하지 않음 "${parts[2]}"`, reason: '밀도 필드에 숫자가 아닌 값' });
      }
    }

    // ── Surface Card ──
    if (section === 1 && /^\d/.test(l)) {
      surfCount++;
      const parts = l.split(/\s+/);
      const surfId = parseInt(parts[0]);
      const type   = parts[1]?.toUpperCase() || 'RCC';
      const vals   = parts.slice(2).map(Number);

      // 파라미터 키 매핑 (주요 타입)
      const PARAM_KEYS = {
        RCC: ['x_0','y_0','z_0','vx','vy','vz','r'],
        RPP: ['xmin','xmax','ymin','ymax','zmin','zmax'],
        SPH: ['x_0','y_0','z_0','r'],
        BOX: ['ax','ay','az','bx','by','bz','cx','cy','cz'],
        TRC: ['x_0','y_0','z_0','vx','vy','vz','r1','r2'],
        REC: ['x_0','y_0','z_0','vx','vy','vz','ax','ay','az','bx','by','bz'],
        CX: ['r'], CY: ['r'], CZ: ['r'],
        SO: ['r'], SX: ['x_0','r'], SY: ['y_0','r'], SZ: ['z_0','r'],
        S:  ['x_0','y_0','z_0','r'],
        PX: ['d'], PY: ['d'], PZ: ['d'],
        KX: ['x_0','t2'], KY: ['y_0','t2'], KZ: ['z_0','t2'],
        TX: ['x_0','y_0','z_0','A','B','C'],
        TY: ['x_0','y_0','z_0','A','B','C'],
        TZ: ['x_0','y_0','z_0','A','B','C'],
      };
      const keys   = PARAM_KEYS[type] || [];
      const params = {};
      keys.forEach((k, i) => { if (vals[i] !== undefined) params[k] = vals[i]; });

      parsedSurfs.push({ id: surfId, type, params });
      if (!surfId) errors.push({ ln, msg: `표면 ${parts[0]}: 번호 파싱 실패`, reason: '숫자가 아닌 번호' });
    }

    // ── Data Card ──
    if (section === 2) {
      if (/^M\d+/i.test(l)) matCount++;
      if (/^NPS\b/i.test(l)) nps = l.split(/\s+/)[1] || '—';
      if (/^MODE\b/i.test(l)) mode = l.substring(5).trim();
      if (/^IMP:N\s/i.test(l)) {
        const vals = l.split(/\s+/).slice(1).filter(Boolean);
        impCount = vals.length;
      }
    }
  });

  // cross-checks
  const surfIds = new Set(parsedSurfs.map(s => s.id));
  parsedCells.forEach(c => {
    const nums = (c.surf?.match(/\d+/g) || []).map(Number);
    nums.forEach(n => {
      if (n > 0 && !surfIds.has(n))
        errors.push({ ln: '?', msg: `표면 ${n} 참조됨 → Surface Card에 정의 없음`, reason: 'Cell Card에서 사용한 표면 번호가 Surface Card에 없음' });
    });
  });
  if (impCount > 0 && impCount !== cellCount)
    warns.push({ ln: 'DATA', msg: `IMP:N 값 개수(${impCount}) ≠ 셀 수(${cellCount})`, reason: '모든 셀에 IMP 값이 있어야 함' });
  if (nps === '—')
    warns.push({ ln: 'DATA', msg: 'NPS 카드 없음', reason: '시뮬레이션 종료 조건 미설정' });

  const summary =
    `이 파일은 MODE ${mode || 'N(기본)'} 기반의 MCNP 입력 파일입니다. ` +
    `총 ${cellCount}개의 셀과 ${surfCount}개의 표면으로 차폐 기하학 구조를 정의하고 있으며, ` +
    `${matCount}개의 재질이 사용되었습니다. ` +
    (nps !== '—' ? `시뮬레이션은 NPS ${nps} 히스토리로 설정되었습니다.` : 'NPS 카드가 없어 히스토리 수가 미정입니다.') +
    (errors.length === 0 && warns.length === 0 ? ' 주요 오류가 감지되지 않았습니다.' : ` ${errors.length}개의 오류, ${warns.length}개의 경고가 감지되었습니다.`);

  return {
    title,
    cells: cellCount, surfs: surfCount, mats: matCount, nps, mode,
    errors, warns, summary,
    // 렌더링용
    parsedCells, parsedSurfs,
  };
}

// undefined 참조 방지
let d = 0;
