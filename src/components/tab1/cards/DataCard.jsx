import CollapsibleCard from '@/components/CollapsibleCard';
import { Row, Label, Btn, Select, Input, Divider, ModeChip } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import { MAT_DB, MAT_CATEGORIES } from '@/utils/constants';
import { theme } from '@/theme';
import { useState } from 'react';
import styled from 'styled-components';
import { CARD_TOOLTIPS, DATA_TOOLTIPS } from '@/utils/tooltips';
import Tooltip from '@/components/Tooltip';

const MatItem = styled.div`
  background: ${theme.bg3};
  border: 1px solid ${theme.bd};
  border-radius: 5px;
  padding: 6px 9px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: ${theme.tx3};
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
    <CollapsibleCard badge="DATA" title="Data Card" onDetail={onDetail} tooltip={CARD_TOOLTIPS.DATA}>

      {/* MODE */}
      <Divider>
        <SectionLabel>
          MODE
          <Tooltip title={DATA_TOOLTIPS.MODE.title} desc={DATA_TOOLTIPS.MODE.desc} code={DATA_TOOLTIPS.MODE.code} badge="MODE" />
        </SectionLabel>
      </Divider>
      <div style={{ display: 'flex', gap: 4 }}>
        {['N', 'P', 'E'].map(p => (
          <ModeChip key={p} $on={modes.has(p)} onClick={() => toggleParticleMode(p)} title={{ N: '중성자', P: '광자', E: '전자' }[p]}>
            {p}
          </ModeChip>
        ))}
      </div>

      {/* MATERIAL */}
      <Divider>
        <SectionLabel>
          MATERIAL (M)
          <Tooltip title={DATA_TOOLTIPS.MATERIAL.title} desc={DATA_TOOLTIPS.MATERIAL.desc} code={DATA_TOOLTIPS.MATERIAL.code} badge="M" />
        </SectionLabel>
      </Divider>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <Select $w="auto" value={matKey} onChange={e => setMatKey(e.target.value)} style={{ flex: 1, minWidth: 0 }}>
          <option value="">-- 재질 선택 --</option>
          {MAT_CATEGORIES.map(cat => {
            const items = Object.entries(MAT_DB).filter(([, v]) => v.category === cat && v.name !== '사용자정의');
            if (!items.length) return null;
            return (
              <optgroup key={cat} label={`── ${cat} ──`}>
                {items.map(([key, mat]) => (
                  <option key={key} value={key}>{mat.name} ({mat.dens} g/cc)</option>
                ))}
              </optgroup>
            );
          })}
          <optgroup label="── 기타 ──">
            <option value="custom">+ 사용자정의</option>
          </optgroup>
        </Select>
        <Btn $variant="green" onClick={handleAddMat} style={{ flexShrink: 0, padding: '3px 10px', fontSize: 10 }}>추가</Btn>
      </div>
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
      <Divider>
        <SectionLabel>
          SOURCE
          <Tooltip
            title={appMode === 'shield' ? DATA_TOOLTIPS.SHIELD_MODE.title : DATA_TOOLTIPS.CRIT_MODE.title}
            desc={appMode === 'shield' ? DATA_TOOLTIPS.SHIELD_MODE.desc : DATA_TOOLTIPS.CRIT_MODE.desc}
            code={appMode === 'shield' ? DATA_TOOLTIPS.SHIELD_MODE.code : DATA_TOOLTIPS.CRIT_MODE.code}
            badge="SDEF"
          />
        </SectionLabel>
      </Divider>
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
            <Tooltip title={DATA_TOOLTIPS.PAR.title} desc={DATA_TOOLTIPS.PAR.desc} code={DATA_TOOLTIPS.PAR.code} />
            <Label>ERG</Label>
            <Select $w="120px" value={sdef.erg} onChange={e => updateSdef({ erg: e.target.value, ergMode: e.target.value === 'custom' ? 'custom' : 'preset' })}>
              <option value="1.25">Co-60 (1.25MeV)</option>
              <option value="0.662">Cs-137 (0.662)</option>
              <option value="custom">직접입력</option>
            </Select>
            <Tooltip title={DATA_TOOLTIPS.ERG.title} desc={DATA_TOOLTIPS.ERG.desc} code={DATA_TOOLTIPS.ERG.code} />
            {sdef.erg === 'custom' && <Input $w="50px" value={sdef.ergCustom} onChange={e => updateSdef({ ergCustom: e.target.value })} placeholder="MeV" />}
          </Row>
          <Row>
            <Label>POS x</Label>
            <Input $w="36px" value={sdef.x} onChange={e => updateSdef({ x: e.target.value })} />
            <Label>y</Label>
            <Input $w="36px" value={sdef.y} onChange={e => updateSdef({ y: e.target.value })} />
            <Label>z</Label>
            <Input $w="36px" value={sdef.z} onChange={e => updateSdef({ z: e.target.value })} />
            <Tooltip title={DATA_TOOLTIPS.POS.title} desc={DATA_TOOLTIPS.POS.desc} code={DATA_TOOLTIPS.POS.code} />
          </Row>
        </>
      ) : (
        <Row style={{ flexWrap: 'wrap', gap: 6 }}>
          {[
            ['N/cyc', 'n', '10000', DATA_TOOLTIPS.KCODE_N],
            ['keff₀',  'k', '1.0',   DATA_TOOLTIPS.KCODE_K],
            ['Ic',     'ic','50',    DATA_TOOLTIPS.KCODE_IC],
            ['It',     'it','250',   DATA_TOOLTIPS.KCODE_IT],
          ].map(([lbl, key, ph, tip]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Label>{lbl}</Label>
              <Input $w="52px" value={kcode[key]} onChange={e => updateKcode({ [key]: e.target.value })} placeholder={ph} />
              <Tooltip title={tip.title} desc={tip.desc} code={tip.code} />
            </span>
          ))}
        </Row>
      )}

      {/* NPS */}
      <Divider>
        <SectionLabel>
          NPS
          <Tooltip title={DATA_TOOLTIPS.NPS.title} desc={DATA_TOOLTIPS.NPS.desc} code={DATA_TOOLTIPS.NPS.code} badge="NPS" />
        </SectionLabel>
      </Divider>
      <Row>
        <Input $w="100px" value={nps} onChange={e => setNps(e.target.value)} />
        <Label>histories</Label>
      </Row>

    </CollapsibleCard>
  );
}
