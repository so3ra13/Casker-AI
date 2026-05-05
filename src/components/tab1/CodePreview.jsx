import { useMemo } from 'react';
import styled from 'styled-components';
import { theme, ColHeader, ColTitle, Btn, PulseDot } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import { generateMCNP, highlightLine } from '@/utils/codeGen';

const ColWrap = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid ${theme.bd};
  background: ${theme.bg};
`;

const CodeArea = styled.div`
  flex: 1;
  overflow: auto;
  padding: 6px 0;
  font-family: ${theme.mn};
  font-size: 10px;
  line-height: 1.65;
`;

const CodeLine = styled.div`
  display: flex;
  align-items: baseline;
  white-space: pre;
  &:hover { background: rgba(255,255,255,0.025); }
`;

const LineNum = styled.span`
  width: 34px;
  text-align: right;
  padding: 0 8px;
  color: ${theme.tx3};
  font-size: 9px;
  flex-shrink: 0;
  user-select: none;
`;

const COLOR_MAP = {
  comment:  theme.tx3,
  keyword:  theme.am,
  material: theme.gn,
  tally:    theme.pu,
  cell:     theme.ac,
  universe: theme.tl,
  lat:      theme.co,
  boundary: theme.rd,
  default:  theme.tx2,
};

function RenderedCode({ lines }) {
  let lineNum = 0;
  const rendered = [];
  lines.forEach(raw => {
    raw.split('\n').forEach(l => {
      lineNum++;
      const cls = highlightLine(l);
      rendered.push(
        <CodeLine key={lineNum}>
          <LineNum>{lineNum}</LineNum>
          <span style={{ color: COLOR_MAP[cls] || theme.tx2 }}>{l}</span>
        </CodeLine>
      );
    });
  });
  return <>{rendered}</>;
}

export default function CodePreview() {
  const state = useMCNPStore();

  const lines = useMemo(() => generateMCNP(state), [
    state.title, state.modes, state.cells, state.surfaces, state.materials,
    state.impOverrides, state.appMode, state.sdef, state.kcode, state.ksrcPoints,
    state.tallies, state.si1, state.sp1, state.fmesh, state.nps,
    state.latFillRange, state.latFillVals,
  ]);

  const codeText = lines.join('\n');

  const handleExport = () => {
    const blob = new Blob([codeText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mcnp_input.i';
    a.click();
  };

  const handleCopy = () => navigator.clipboard.writeText(codeText);

  return (
    <ColWrap>
      <ColHeader>
        <ColTitle>코드 미리보기</ColTitle>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: theme.gn, display: 'flex', alignItems: 'center', gap: 3 }}>
            <PulseDot />실시간
          </span>
          <Btn $variant="ghost" style={{ fontSize: 9, padding: '2px 6px' }} onClick={handleCopy}>복사</Btn>
          <Btn $variant="green" style={{ fontSize: 9, padding: '2px 6px' }} onClick={handleExport}>↓ .i</Btn>
        </div>
      </ColHeader>

      <CodeArea>
        <RenderedCode lines={lines} />
      </CodeArea>
    </ColWrap>
  );
}