import CollapsibleCard from '@/components/CollapsibleCard';
import { RowItem, RowHeader, NumBadge, Row, Label, Btn, Select, Input } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import { SURF_PARAMS } from '@/utils/constants';
import { theme } from '@/theme';
import { CARD_TOOLTIPS, SURF_TOOLTIPS } from '@/utils/tooltips';
import Tooltip from '@/components/Tooltip';

function paramKey(p) {
  return p.replace(/[₀¹²³]/g, '0').replace(/[^a-zA-Z0-9]/g, '_');
}

function SurfParams({ surf }) {
  const { updateSurfaceParam } = useMCNPStore();
  const ps = SURF_PARAMS[surf.type] || [];
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {ps.map(p => (
        <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 8, color: theme.tx3 }}>{p}</span>
          <Input
            $w="34px"
            value={surf.params?.[paramKey(p)] || ''}
            onChange={e => updateSurfaceParam(surf.id, paramKey(p), e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export default function SurfaceCard({ onDetail }) {
  const { surfaces, addSurface, removeSurface, updateSurface } = useMCNPStore();

  return (
    <CollapsibleCard badge="SURF" title="Surface Card" count={surfaces.length} onDetail={onDetail} tooltip={CARD_TOOLTIPS.SURF}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {surfaces.map(s => (
          <RowItem key={s.id}>
            <RowHeader>
              <NumBadge $color={theme.tl}>{s.id}</NumBadge>
              <Select
                $w="72px"
                value={s.type}
                onChange={e => updateSurface(s.id, { type: e.target.value, params: {} })}
              >
                {Object.keys(SURF_PARAMS).map(k => <option key={k}>{k}</option>)}
              </Select>
              <Tooltip
                title={SURF_TOOLTIPS[s.type]?.title}
                desc={SURF_TOOLTIPS[s.type]?.desc}
                code={SURF_TOOLTIPS[s.type]?.code}
                badge={s.type}
              />
              <Btn $variant="del" onClick={() => removeSurface(s.id)}>✕</Btn>
            </RowHeader>
            <SurfParams surf={s} />
          </RowItem>
        ))}
      </div>
      <Btn $variant="add" onClick={() => addSurface()}>+ 표면 추가</Btn>
    </CollapsibleCard>
  );
}
