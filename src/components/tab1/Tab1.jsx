import styled from 'styled-components';
import { theme, ColHeader, ColTitle, ColScroll, Btn } from '@/theme';
import CollapsibleCard from '@/components/CollapsibleCard';
import CellCard from './cards/CellCard';
import SurfaceCard from './cards/SurfaceCard';
import DataCard from './cards/DataCard';
import CodePreview from './CodePreview';
import ViewerChat from './ViewerChat';
import SlidePanel from '@/components/slide/SlidePanel';
import { useMCNPStore } from '@/store/mcnpStore';
import { Input } from '@/theme';
import { CARD_TOOLTIPS } from '@/utils/tooltips';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr 320px;
  width: 100%;
  overflow: hidden;
  height: 100%;
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid ${theme.bd};
  &:last-child { border-right: none; }
`;

export default function Tab1() {
  const { title, setTitle, openSlide } = useMCNPStore();

  return (
    <>
      <Grid>
        {/* COL 1: INPUT */}
        <Col>
          <ColHeader>
            <ColTitle>카드 입력</ColTitle>
          </ColHeader>
          <ColScroll>
            {/* TITLE */}
            <CollapsibleCard badge="TITLE" title="문제 제목" tooltip={CARD_TOOLTIPS.TITLE}>
              <Input $w="100%" style={{ width: '100%' }} value={title} onChange={e => setTitle(e.target.value)} placeholder="MCNP Shielding Problem" />
            </CollapsibleCard>

            {/* CELL */}
            <CellCard onDetail={() => openSlide('cell')} />

            {/* SURFACE */}
            <SurfaceCard onDetail={() => openSlide('surf')} />

            {/* DATA */}
            <DataCard onDetail={() => openSlide('data')} />
          </ColScroll>
        </Col>

        {/* COL 2: CODE */}
        <CodePreview />

        {/* COL 3: VIEWER + CHAT */}
        <ViewerChat onApply={() => {}} />
      </Grid>

      <SlidePanel />
    </>
  );
}
