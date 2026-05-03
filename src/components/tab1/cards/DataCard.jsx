import CollapsibleCard from '@/components/CollapsibleCard';
import { Row, Label, Btn, Select, Input, Divider, ModeChip, Info } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import { MAT_DB } from '@/utils/constants';
import { theme } from '@/theme';
import { useState } from 'react';
import styled from 'styled-components';

const MatItem = styled.div`
  background: ${theme.bg3};
  border: 1px solid ${theme.bd};
  border-radius: 5px;
  padding: 6px 9px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export default function DataCard({ onDetail }) {
  const {
    modes, toggleParticleMode, materials, addMaterial, removeMaterial,
    appMode, setAppMode, sdef, updateSdef, kcode, updateKcode, nps, setNps,
  } = useMCNPStore();

  const [matKey, setMatKey] = useState('');

  const handleAddMat = () => {
    if (!matKey) return;
    addMaterial(matKey);
    setMatKey('');
  };

  return (
    <CollapsibleCard badge="DATA" title="Data Card" onDetail={onDetail}>

      {/* MODE */}
      <Divider><span>MODE</span></Divider>
      <div style={{ display: 'flex', gap: 4 }}>
        {['N', 'P', 'E'].map(p => (
          <ModeChip key={p} $on={modes.has(p)} onClick={() => toggleParticleMode(p)} title={{ N: '중성자', P: '광자', E: '전자' }[p]}>
            {p}
          </ModeChip>
        ))}
      </div>

      {/* MATERIAL */}
      <Divider><span>MATERIAL (M)</span></Divider>
      <Row>
        <Select $w="auto" style={{ flex: 1 }} value={matKey} onChange={e => setMatKey(e.target.value)}>
          <option value="">-- 재질 선택 --</option>
          <option value="uo2">UO₂ (-10.176 g/cc)</option>
          <option value="zircaloy">Zircaloy-4 (-6.56 g/cc)</option>
          <option value="water">물 H₂O (-1.0 g/cc)</option>
          <option value="lead">납 Pb (-11.35 g/cc)</option>
          <option value="concrete">콘크리트 (-2.3 g/cc)</option>
          <option value="steel">강철 SS316 (-7.99 g/cc)</option>
          <option value="hdpe">HDPE (-0.97 g/cc)</option>
          <option value="boron">붕소강 (-7.8 g/cc)</option>
          <option value="custom">+ 사용자정의...</option>
        </Select>
        <Btn $variant="green" onClick={handleAddMat}>추가</Btn>
      </Row>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {materials.map(m => (
          <MatItem key={m.id}>
            <span style={{ fontFamily: theme.mn, fontSize: 10, color: theme.gn, width: 24 }}>M{m.id}</span>
            <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>{m.name}</span>
            <span style={{ fontFamily: theme.mn, fontSize: 9, color: theme.tx2 }}>{m.dens} g/cc</span>
            <Btn $variant="del" onClick={() => removeMaterial(m.id)}>✕</Btn>
          </MatItem>
        ))}
      </div>

      {/* SOURCE */}
      <Divider><span>SOURCE</span></Divider>
      <Row style={{ marginBottom: 4 }}>
        <Btn $variant={appMode === 'shield' ? 'primary' : 'ghost'} style={{ fontSize: 9, padding: '2px 8px' }} onClick={() => setAppMode('shield')}>차폐</Btn>
        <Btn $variant={appMode === 'crit' ? 'primary' : 'ghost'} style={{ fontSize: 9, padding: '2px 8px' }} onClick={() => setAppMode('crit')}>임계</Btn>
      </Row>

      {appMode === 'shield' ? (
        <>
          <Row>
            <Label>PAR</Label>
            <Select $w="52px" value={sdef.par} onChange={e => updateSdef({ par: e.target.value })}>
              <option>P</option><option>N</option>
            </Select>
            <Label>ERG</Label>
            <Select $w="130px" value={sdef.erg} onChange={e => updateSdef({ erg: e.target.value, ergMode: e.target.value === 'custom' ? 'custom' : 'preset' })}>
              <option value="1.25">Co-60 (1.25MeV)</option>
              <option value="0.662">Cs-137 (0.662)</option>
              <option value="custom">직접입력</option>
            </Select>
            {sdef.erg === 'custom' && <Input $w="50px" value={sdef.ergCustom} onChange={e => updateSdef({ ergCustom: e.target.value })} placeholder="MeV" />}
          </Row>
          <Row>
            <Label>POS x</Label>
            <Input $w="36px" value={sdef.x} onChange={e => updateSdef({ x: e.target.value })} />
            <Label>y</Label>
            <Input $w="36px" value={sdef.y} onChange={e => updateSdef({ y: e.target.value })} />
            <Label>z</Label>
            <Input $w="36px" value={sdef.z} onChange={e => updateSdef({ z: e.target.value })} />
          </Row>
        </>
      ) : (
        <Row style={{ flexWrap: 'wrap', gap: 6 }}>
          {[['N/cyc', 'n', '10000'], ['keff₀', 'k', '1.0'], ['Ic', 'ic', '50'], ['It', 'it', '250']].map(([lbl, key, ph]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Label>{lbl}</Label>
              <Input $w="52px" value={kcode[key]} onChange={e => updateKcode({ [key]: e.target.value })} placeholder={ph} />
            </span>
          ))}
        </Row>
      )}

      {/* NPS */}
      <Divider><span>NPS</span></Divider>
      <Row>
        <Input $w="100px" value={nps} onChange={e => setNps(e.target.value)} />
        <Label>histories</Label>
      </Row>

    </CollapsibleCard>
  );
}
