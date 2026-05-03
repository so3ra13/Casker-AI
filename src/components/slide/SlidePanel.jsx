import styled from 'styled-components';
import { theme } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import LatticeEditor from './LatticeEditor';
import TallyEditor from './TallyEditor';
import CollapsibleCard from '@/components/CollapsibleCard';
import { Row, Label, Input, Btn } from '@/theme';

const Panel = styled.div`
  position: fixed;
  right: 0;
  top: 44px;
  bottom: 0;
  width: 300px;
  background: ${theme.bg2};
  border-left: 1px solid ${theme.bd};
  display: flex;
  flex-direction: column;
  transform: translateX(${p => p.$open ? '0' : '100%'});
  transition: transform 0.26s cubic-bezier(0.4,0,0.2,1);
  z-index: 25;
  overflow: hidden;
`;

const PanelHd = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid ${theme.bd};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const CloseBtn = styled.button`
  width: 20px;
  height: 20px;
  border: none;
  background: ${theme.bg3};
  border-radius: 3px;
  cursor: pointer;
  color: ${theme.tx2};
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PanelScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 9px;
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const TITLES = {
  surf: 'Surface 세부조정 (TR/TRCL)',
  cell: 'Lattice / Universe 편집',
  data: 'IMP · Tally · FMESH',
};

function SurfDetail() {
  return (
    <CollapsibleCard badge="SURF" title="좌표 변환 (TR / TRCL)">
      <div style={{ fontSize: 9, color: theme.tx3, padding: '3px 6px', background: theme.bg3, borderLeft: `2px solid ${theme.bd2}`, borderRadius: '0 3px 3px 0' }}>
        TR: 표면 변환 / TRCL: 셀 전체 이동·회전
      </div>
      <Row>
        <Label>TR#</Label><Input $w="36px" defaultValue="1" />
        <Label>이동</Label>
        {['x','y','z'].map(ax => (
          <span key={ax} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Label>{ax}</Label><Input $w="36px" placeholder="0" />
          </span>
        ))}
      </Row>
      <div>
        <div style={{ fontSize: 8, color: theme.tx3, marginBottom: 4, letterSpacing: '0.8px', fontWeight: 700 }}>회전 행렬</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
          {["xx′","yx′","zx′","xy′","yy′","zy′","xz′","yz′","zz′"].map(p => (
            <Input key={p} style={{ width: '100%' }} placeholder={p} />
          ))}
        </div>
        <label style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 9, color: theme.tx2, cursor: 'pointer', marginTop: 4 }}>
          <input type="checkbox" /> *TR 각도(°) 직접 입력
        </label>
      </div>
      <Btn $variant="add">+ TR 카드 추가</Btn>
    </CollapsibleCard>
  );
}

export default function SlidePanel() {
  const { slideOpen, slideKey, closeSlide } = useMCNPStore();

  return (
    <Panel $open={slideOpen}>
      <PanelHd>
        <span style={{ fontSize: 11, fontWeight: 700, color: theme.tx2 }}>
          {TITLES[slideKey] || '세부 조정'}
        </span>
        <CloseBtn onClick={closeSlide}>✕</CloseBtn>
      </PanelHd>
      <PanelScroll>
        {slideKey === 'surf' && <SurfDetail />}
        {slideKey === 'cell' && <LatticeEditor />}
        {slideKey === 'data' && <TallyEditor />}
      </PanelScroll>
    </Panel>
  );
}
