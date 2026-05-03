import CollapsibleCard from '@/components/CollapsibleCard';
import { RowItem, RowHeader, NumBadge, Row, Label, Info, Btn, Select, Input } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import { theme } from '@/theme';
import { CELL_TYPES } from '@/utils/constants';

function CellFields({ cell }) {
  const { updateCell, materials } = useMCNPStore();
  const up = (k, v) => updateCell(cell.id, { [k]: v });

  const matOptions = materials.map(m => (
    <option key={m.id} value={m.id}>{m.id} — {m.name} ({m.dens})</option>
  ));

  const handleMatChange = (val) => {
    const found = materials.find(m => String(m.id) === String(val));
    up('mat', val);
    if (found) up('dens', found.dens);
  };

  const commonFields = (
    <Row>
      <Label>M#</Label>
      <Select $w="150px" value={cell.mat} onChange={e => handleMatChange(e.target.value)}>
        <option value="">-- 재질 선택 --</option>
        {matOptions}
      </Select>
      <Label>ρ</Label>
      <Input $w="72px" value={cell.dens} onChange={e => up('dens', e.target.value)}
        placeholder="-10.176" title="음수=질량밀도" />
      <Label>표면</Label>
      <Input $w="80px" value={cell.surf} onChange={e => up('surf', e.target.value)} placeholder="-1" />
    </Row>
  );

  if (cell.type === 'boundary') return (
    <Row>
      <Label>표면식</Label>
      <Input $w="80px" value={cell.surf} onChange={e => up('surf', e.target.value)} placeholder="99" />
      <Info style={{ fontSize: 8 }}>IMP=0 자동</Info>
    </Row>
  );

  if (cell.type === 'lat') return (
    <>
      {commonFields}
      <Row>
        <Label>LAT=</Label>
        <Select $w="78px" value={cell.latType || '1'} onChange={e => up('latType', e.target.value)}>
          <option value="1">1 사각형</option>
          <option value="2">2 육각형</option>
        </Select>
        <Label>U=</Label>
        <Input $w="36px" value={cell.u} onChange={e => up('u', e.target.value)} placeholder="2" />
      </Row>
      <Info style={{ fontSize: 8 }}>격자 편집 → ⟫ 세부조정</Info>
    </>
  );

  if (cell.type === 'fill') return (
    <>
      {commonFields}
      <Row>
        <Label>FILL=</Label>
        <Input $w="130px" value={cell.fillExpr} onChange={e => up('fillExpr', e.target.value)} placeholder="2(-0.6 -0.6)" />
      </Row>
    </>
  );

  return (
    <>
      {commonFields}
      <Row>
        <Label>U=</Label>
        <Input $w="36px" value={cell.u} onChange={e => up('u', e.target.value)} placeholder="0" title="소속 Universe" />
      </Row>
    </>
  );
}

export default function CellCard({ onDetail }) {
  const { cells, addCell, removeCell, changeCellType } = useMCNPStore();

  return (
    <CollapsibleCard badge="CELL" title="Cell Card" count={cells.length} onDetail={onDetail}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {cells.map(c => (
          <RowItem key={c.id}>
            <RowHeader>
              <NumBadge>{c.id}</NumBadge>
              <Select
                $w="90px"
                value={c.type}
                onChange={e => changeCellType(c.id, e.target.value)}
              >
                {CELL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
              <Btn $variant="del" onClick={() => removeCell(c.id)}>✕</Btn>
            </RowHeader>
            <CellFields cell={c} />
          </RowItem>
        ))}
      </div>
      <Btn $variant="add" onClick={() => addCell()}>+ 셀 추가</Btn>
    </CollapsibleCard>
  );
}
