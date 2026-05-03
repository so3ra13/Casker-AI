import { useState } from 'react';
import styled from 'styled-components';
import { theme, Row, Label, Input, Select, Btn, Textarea, Divider, Info, RowItem, RowHeader, NumBadge } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import { ICRP21, SI_PRESETS, TALLY_TYPES, PARTICLE_TYPES } from '@/utils/constants';
import CollapsibleCard from '@/components/CollapsibleCard';

const OptBtn = styled.button`
  font-size: 8px;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid ${p => p.$on ? theme.pu : theme.bd2};
  background: ${p => p.$on ? 'rgba(155,126,248,0.1)' : 'none'};
  color: ${p => p.$on ? theme.pu : theme.tx3};
  cursor: pointer;
  transition: all 0.15s;
`;

function TallyRow({ t }) {
  const { updateTally, removeTally } = useMCNPStore();
  const up = (k, v) => updateTally(t.id, { [k]: v });

  const applyDEpreset = (val) => {
    if (!val) return;
    const d = val === 'icrp21p' ? ICRP21.p : ICRP21.n;
    up('de', d.de); up('df', d.df);
  };

  return (
    <RowItem>
      <RowHeader>
        <NumBadge $color={theme.pu}>{t.id}</NumBadge>
        <Select $w="60px" value={t.type} onChange={e => up('type', e.target.value)}>
          {TALLY_TYPES.map(ty => <option key={ty}>{ty}</option>)}
        </Select>
        <Select $w="60px" value={t.par} onChange={e => up('par', e.target.value)}>
          {PARTICLE_TYPES.map(p => <option key={p}>{p}</option>)}
        </Select>
        <Btn $variant="del" onClick={() => removeTally(t.id)}>✕</Btn>
      </RowHeader>
      <Row>
        <Label>셀/표면#</Label>
        <Input $w="88px" value={t.cells} onChange={e => up('cells', e.target.value)} placeholder="1 2 3" />
        <Label>FM</Label>
        <Input $w="60px" value={t.fm} onChange={e => up('fm', e.target.value)} placeholder="—" />
      </Row>
      <Row>
        <OptBtn $on={t.eOpen} onClick={() => up('eOpen', !t.eOpen)}>
          {t.eOpen ? '- E빈 ✕' : '+ E빈'}
        </OptBtn>
        <OptBtn $on={t.deOpen} onClick={() => up('deOpen', !t.deOpen)}>
          {t.deOpen ? '- DE/DF ✕' : '+ DE/DF'}
        </OptBtn>
      </Row>
      {t.eOpen && (
        <div>
          <Info style={{ marginBottom: 3 }}>E 카드 — 에너지 구간 (MeV, 공백 구분)</Info>
          <Textarea rows={2} value={t.eBins} onChange={e => up('eBins', e.target.value)}
            placeholder="0.01 0.1 0.5 1.0 2.0 5.0 10.0" />
        </div>
      )}
      {t.deOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Info>DE/DF 카드 — 선량 환산 인자</Info>
          <Row>
            <Label>프리셋</Label>
            <Select $w="110px" onChange={e => applyDEpreset(e.target.value)}>
              <option value="">직접입력</option>
              <option value="icrp21p">ICRP-21 광자</option>
              <option value="icrp21n">ICRP-21 중성자</option>
            </Select>
          </Row>
          <div>
            <Label>DE (에너지, MeV)</Label>
            <Textarea rows={2} style={{ marginTop: 2 }} value={t.de} onChange={e => up('de', e.target.value)}
              placeholder="0.01 0.015 0.02 0.03..." />
          </div>
          <div>
            <Label>DF (pSv·cm²)</Label>
            <Textarea rows={2} style={{ marginTop: 2 }} value={t.df} onChange={e => up('df', e.target.value)}
              placeholder="2.78E-5 1.11E-5..." />
          </div>
        </div>
      )}
    </RowItem>
  );
}

export default function TallyEditor() {
  const { cells, tallies, addTally, impOverrides, setImpOverride, si1, setSi1, sp1, setSp1, fmesh, updateFmesh, ksrcPoints, addKsrc, updateKsrc } = useMCNPStore();

  const applySIpreset = (key) => {
    if (!key) { setSi1(''); setSp1(''); return; }
    const d = SI_PRESETS[key];
    if (d) { setSi1(d.si); setSp1(d.sp); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>

      {/* IMP */}
      <CollapsibleCard badge="IMP" title="Importance Card">
        <Info>셀 수 = 값 개수 필수 / 그래이브야드=0</Info>
        {['N', 'P', 'E'].map(par => (
          <RowItem key={par}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Label style={{ width: 44 }}>IMP:{par}</Label>
              {cells.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Label style={{ fontSize: 8 }}>C{c.id}</Label>
                  <Input $w="28px"
                    value={impOverrides?.[par]?.[c.id] ?? (c.type === 'boundary' ? '0' : '1')}
                    onChange={e => setImpOverride(par, c.id, e.target.value)} />
                </div>
              ))}
            </div>
          </RowItem>
        ))}
      </CollapsibleCard>

      {/* SI/SP */}
      <CollapsibleCard badge="SDEF" title="선원 분포 (SI / SP)">
        <Info>ERG=D1 로 설정 시 SI/SP 카드로 에너지 스펙트럼 정의</Info>
        <Row>
          <Label>프리셋</Label>
          <Select $w="130px" onChange={e => applySIpreset(e.target.value)}>
            <option value="">직접입력</option>
            <option value="co60">Co-60 (1.17 + 1.33 MeV)</option>
            <option value="cs137">Cs-137 (0.662 MeV)</option>
            <option value="watt">Watt 핵분열 스펙트럼</option>
          </Select>
        </Row>
        <div>
          <Label>SI1 (에너지 구간, MeV)</Label>
          <Textarea rows={2} style={{ marginTop: 2 }} value={si1} onChange={e => setSi1(e.target.value)}
            placeholder="예) H  1.0  1.17  1.33  1.5" />
        </div>
        <div>
          <Label>SP1 (확률)</Label>
          <Textarea rows={2} style={{ marginTop: 2 }} value={sp1} onChange={e => setSp1(e.target.value)}
            placeholder="예) 0  0.5  0.5  0" />
        </div>
      </CollapsibleCard>

      {/* Tally */}
      <CollapsibleCard badge="TALLY" title="Tally Card (F)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {tallies.map(t => <TallyRow key={t.id} t={t} />)}
        </div>
        <Btn $variant="add" onClick={addTally}>+ Tally 추가</Btn>
      </CollapsibleCard>

      {/* FMESH */}
      <CollapsibleCard badge="FMESH" title="메시 Tally (FMESH)">
        <Info>Cask 외부 선량 분포 시각화 — 기하학과 독립적인 3D 격자</Info>
        <Row>
          <Label>활성화</Label>
          <input type="checkbox" checked={fmesh.enabled} onChange={e => updateFmesh({ enabled: e.target.checked })} />
        </Row>
        {fmesh.enabled && (
          <>
            <Row>
              <Label>GEOM</Label>
              <Select $w="60px" value={fmesh.geom} onChange={e => updateFmesh({ geom: e.target.value })}>
                <option value="xyz">XYZ</option><option value="cyl">CYL</option>
              </Select>
              <Label>번호</Label>
              <Input $w="36px" value={fmesh.num} onChange={e => updateFmesh({ num: e.target.value })} />
              <Label>입자</Label>
              <Select $w="44px" value={fmesh.par} onChange={e => updateFmesh({ par: e.target.value })}>
                <option>p</option><option>n</option>
              </Select>
            </Row>
            <Row>
              <Label>ORIGIN</Label>
              {['ox','oy','oz'].map(k => (
                <Input key={k} $w="36px" value={fmesh[k]} onChange={e => updateFmesh({ [k]: e.target.value })} />
              ))}
            </Row>
            {[['IMESH','imesh','IINTS','iints'],['JMESH','jmesh','JINTS','jints'],['KMESH','kmesh','KINTS','kints']].map(([l1,k1,l2,k2]) => (
              <Row key={k1}>
                <Label>{l1}</Label><Input $w="52px" value={fmesh[k1]} onChange={e => updateFmesh({ [k1]: e.target.value })} />
                <Label>{l2}</Label><Input $w="36px" value={fmesh[k2]} onChange={e => updateFmesh({ [k2]: e.target.value })} />
              </Row>
            ))}
            <Row>
              <Label>OUT</Label>
              <Select $w="70px" value={fmesh.out} onChange={e => updateFmesh({ out: e.target.value })}>
                <option value="xdmf">XDMF</option><option value="ij">IJ</option><option value="none">NONE</option>
              </Select>
              <Label>FACTOR</Label>
              <Input $w="52px" value={fmesh.factor} onChange={e => updateFmesh({ factor: e.target.value })} placeholder="1.0" />
            </Row>
          </>
        )}
      </CollapsibleCard>

      {/* KSRC */}
      <CollapsibleCard badge="DATA" title="초기 중성자 위치 (KSRC)">
        {ksrcPoints.map((p, i) => (
          <Row key={i}>
            {['x','y','z'].map(ax => (
              <span key={ax} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Label>{ax}</Label>
                <Input $w="36px" value={p[ax]} onChange={e => updateKsrc(i, { [ax]: e.target.value })} />
              </span>
            ))}
          </Row>
        ))}
        <Btn $variant="add" onClick={addKsrc}>+ KSRC 포인트</Btn>
      </CollapsibleCard>

    </div>
  );
}
