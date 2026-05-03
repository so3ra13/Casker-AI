export function parseMCNP(code) {
  const lines = code.split('\n');
  const title = lines[0]?.trim() || '';
  let section = 0; // 0=cell, 1=surf, 2=data
  let cells = 0, surfs = 0, mats = 0, nps = '—', mode = '—';
  const cellNums = new Set();
  const surfNums = new Set();
  const usedSurfs = new Set();
  let impCount = 0, cellCount = 0;
  const errors = [], warns = [];

  lines.slice(1).forEach((raw, i) => {
    const l = raw.trim();
    const ln = i + 2;
    if ((l === '' || l === 'c') && section < 2) { section++; return; }
    if (l.startsWith('c ') || l === 'c') return;

    if (section === 0 && /^\d/.test(l)) {
      cells++; cellCount++;
      const parts = l.split(/\s+/);
      cellNums.add(+parts[0]);
      const surfRefs = l.match(/[-+]?\d+/g) || [];
      surfRefs.slice(2).forEach(n => { const a = Math.abs(+n); if (a > 0 && a < 99999) usedSurfs.add(a); });
      if (parts[1] && parts[1] !== '0' && parts[2]) {
        const d = parseFloat(parts[2]);
        if (isNaN(d)) errors.push({ ln, msg: `셀 ${parts[0]}: 밀도 값이 유효하지 않음 "${parts[2]}"`, reason: '밀도 필드에 숫자가 아닌 값' });
      }
    }
    if (section === 1 && /^\d/.test(l)) {
      surfs++;
      surfNums.add(+l.split(/\s+/)[0]);
    }
    if (section === 2) {
      if (/^M\d+/i.test(l)) mats++;
      if (/^NPS\b/i.test(l)) nps = l.split(/\s+/)[1] || '—';
      if (/^MODE\b/i.test(l)) mode = l.substring(5).trim();
      if (/^IMP:N\s/i.test(l)) {
        const vals = l.split(/\s+/).slice(1).filter(Boolean);
        impCount = vals.length;
      }
    }
  });

  // cross-checks
  usedSurfs.forEach(n => {
    if (!surfNums.has(n))
      errors.push({ ln: '?', msg: `표면 ${n} 참조됨 → Surface Card에 정의 없음`, reason: 'Cell Card에서 사용한 표면 번호가 Surface Card에 없음' });
  });
  if (impCount > 0 && impCount !== cellCount)
    warns.push({ ln: 'DATA', msg: `IMP:N 값 개수(${impCount}) ≠ 셀 수(${cellCount})`, reason: '모든 셀에 IMP 값이 있어야 함' });
  if (nps === '—')
    warns.push({ ln: 'DATA', msg: 'NPS 카드 없음', reason: '시뮬레이션 종료 조건 미설정' });

  const summary =
    `이 파일은 MODE ${mode || 'N(기본)'} 기반의 MCNP 입력 파일입니다. ` +
    `총 ${cells}개의 셀과 ${surfs}개의 표면으로 차폐 기하학 구조를 정의하고 있으며, ` +
    `${mats}개의 재질이 사용되었습니다. ` +
    (nps !== '—' ? `시뮬레이션은 NPS ${nps} 히스토리로 설정되었습니다.` : 'NPS 카드가 없어 히스토리 수가 미정입니다.') +
    (errors.length === 0 && warns.length === 0 ? ' 주요 오류가 감지되지 않았습니다.' : ` ${errors.length}개의 오류, ${warns.length}개의 경고가 감지되었습니다.`);

  const errorLines = new Set([...errors, ...warns].map(e => e.ln).filter(n => typeof n === 'number'));

  return { title, cells, surfs, mats, nps, mode, errors, warns, summary, errorLines };
}
