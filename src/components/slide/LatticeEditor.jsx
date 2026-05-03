import { useEffect } from 'react';
import styled from 'styled-components';
import { theme, Row, Label, Input, Btn, Info } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import { UCLS } from '@/utils/constants';

const GridWrap = styled.div`
  display: inline-grid;
  gap: 1px;
`;
const LC = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid ${theme.bd2};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6px;
  font-family: ${theme.mn};
  cursor: pointer;
  transition: all 0.08s;
  background: ${p => ({ u1:'rgba(79,127,255,.22)', u2:'rgba(245,106,90,.22)', u3:'rgba(40,201,154,.18)', u0:theme.bg4 })[p.$ucls] || theme.bg4};
  border-color: ${p => ({ u1:theme.ac, u2:theme.co, u3:theme.gn, u0:theme.bd2 })[p.$ucls] || theme.bd2};
  color: ${p => ({ u1:theme.ac, u2:theme.co, u3:theme.gn, u0:theme.tx3 })[p.$ucls] || theme.tx3};
`;
const PalChip = styled.div`
  padding: 2px 7px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
  outline: ${p => p.$selected ? '2px solid #fff' : 'none'};
  background: ${p => ({ u1:'rgba(79,127,255,.22)', u2:'rgba(245,106,90,.22)', u3:'rgba(40,201,154,.18)', u0:theme.bg4 })[p.$ucls] || theme.bg4};
  color: ${p => ({ u1:theme.ac, u2:theme.co, u3:theme.gn, u0:theme.tx3 })[p.$ucls] || theme.tx3};
`;
const FillPrev = styled.div`
  font-family: ${theme.mn};
  font-size: 8px;
  color: ${theme.co};
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.5;
  padding: 4px 6px;
  background: ${theme.bg3};
  border-left: 2px solid ${theme.co};
  border-radius: 0 3px 3px 0;
`;

const UNIVS = [1, 2, 3];

export default function LatticeEditor() {
  const {
    latGrid, latNx, latNy, paintU, setPaintU,
    paintLatCell, setLatSize, initLatGrid, latFillRange, latFillVals,
  } = useMCNPStore();

  useEffect(() => {
    if (!latGrid.length) initLatGrid(latNx, latNy);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Row>
        <Label>크기</Label>
        <Input $w="36px" type="number" min="1" max="20" value={latNx}
          onChange={e => setLatSize(+e.target.value, latNy)} />
        <span style={{ color: theme.tx3, fontSize: 10 }}>×</span>
        <Input $w="36px" type="number" min="1" max="20" value={latNy}
          onChange={e => setLatSize(latNx, +e.target.value)} />
      </Row>

      {/* Palette */}
      <Row style={{ gap: 4, flexWrap: 'wrap' }}>
        <Label>페인트</Label>
        {UNIVS.map(u => (
          <PalChip key={u} $ucls={`u${u}`} $selected={paintU === u} onClick={() => setPaintU(u)}>
            U{u}
          </PalChip>
        ))}
        <PalChip $ucls="u0" $selected={paintU === 0} onClick={() => setPaintU(0)}>void(0)</PalChip>
      </Row>

      {/* Grid */}
      <div style={{ overflowX: 'auto', padding: '3px 0' }}>
        <GridWrap style={{ gridTemplateColumns: `repeat(${latNx}, 16px)` }}>
          {latGrid.map((row, r) =>
            row.map((u, c) => (
              <LC key={`${r}-${c}`} $ucls={UCLS[u] || 'u1'} onClick={() => paintLatCell(r, c)}>
                {u}
              </LC>
            ))
          )}
        </GridWrap>
      </div>

      {/* Fill preview */}
      <FillPrev>
        {`fill=${latFillRange}\n     ` + latFillVals.split('\n').join('\n          ')}
      </FillPrev>

      <Btn $variant="ghost" style={{ fontSize: 9 }} onClick={() => initLatGrid(latNx, latNy)}>
        초기화
      </Btn>
    </div>
  );
}
