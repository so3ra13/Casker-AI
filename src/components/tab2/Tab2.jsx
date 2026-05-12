import { useState, useRef } from 'react';
import styled from 'styled-components';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { theme, ColHeader, ColTitle, Btn, PulseDot, Info, Select, Input } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import { parseMCNP } from '@/utils/parser';
import { buildCaskLayers } from '@/utils/buildCaskLayers';
import CollapsibleCard from '@/components/CollapsibleCard';

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

const ColScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 9px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

// ── Upload Zone ───────────────────────────────────────────
const UploadZone = styled.div`
  border: 2px dashed ${p => p.$hasFile ? theme.gn : p.$drag ? theme.ac : theme.bd2};
  border-radius: 9px;
  padding: 22px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: ${p => p.$hasFile ? 'rgba(40,201,154,0.06)' : p.$drag ? theme.acg : 'none'};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const FileInfoRow = styled.div`
  background: ${theme.bg3};
  border: 1px solid ${theme.gn};
  border-radius: 5px;
  padding: 7px 9px;
  display: flex;
  align-items: center;
  gap: 7px;
`;

// ── Stat Grid ─────────────────────────────────────────────
const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
`;

const StatBox = styled.div`
  background: ${theme.bg4};
  border: 1px solid ${theme.bd};
  border-radius: 5px;
  padding: 6px 8px;
  text-align: center;
`;

// ── Code View ─────────────────────────────────────────────
const CodeViewLine = styled.div`
  display: flex;
  align-items: baseline;
  white-space: pre;
  background: ${p => p.$err ? 'rgba(217,79,79,0.1)' : p.$warn ? 'rgba(240,160,32,0.07)' : 'none'};
  border-left: ${p => p.$err ? `2px solid ${theme.rd}` : p.$warn ? `2px solid ${theme.am}` : '2px solid transparent'};
  &:hover { background: rgba(255,255,255,0.02); }
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

// ── Chat ──────────────────────────────────────────────────
const ChatWrap = styled.div`
  border: 1px solid ${theme.bd};
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
  min-height: 0;
`;
const ChatMsgs = styled.div`flex:1;overflow-y:auto;padding:7px 9px;display:flex;flex-direction:column;gap:6px;`;
const Msg = styled.div`
  max-width: 92%;
  padding: 6px 9px;
  font-size: 10px;
  line-height: 1.6;
  align-self: ${p => p.$user ? 'flex-end' : 'flex-start'};
  background: ${p => p.$user ? theme.ac2 : theme.bg3};
  color: ${p => p.$user ? '#fff' : theme.tx};
  border: ${p => p.$user ? 'none' : `1px solid ${theme.bd}`};
  border-radius: ${p => p.$user ? '6px 6px 2px 6px' : '6px 6px 6px 2px'};
  white-space: pre-wrap;
  word-break: break-word;

  code {
    font-family: ${theme.mn};
    font-size: 9.5px;
    background: #0d1117;
    color: #79c0ff;
    padding: 0 3px;
    border-radius: 3px;
  }
  pre {
    margin: 5px 0;
    padding: 8px 10px;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 5px;
    overflow-x: auto;
    font-family: ${theme.mn};
    font-size: 9.5px;
    color: #e6edf3;
    line-height: 1.55;
    white-space: pre;
  }
  strong { color: #79c0ff; font-weight: 700; }
  ul, ol { margin: 3px 0 3px 14px; padding: 0; }
  li { margin: 1px 0; }
  p { margin: 2px 0; }
`;
const ChatInputRow = styled.div`padding:6px 9px;border-top:1px solid ${theme.bd};display:flex;gap:4px;flex-shrink:0;`;
const ChatInput = styled.textarea`flex:1;background:${theme.bg3};border:1px solid ${theme.bd2};border-radius:4px;color:${theme.tx};font-size:10px;padding:5px 8px;outline:none;resize:none;font-family:${theme.sf};&:focus{border-color:${theme.ac};}`;
const SendBtn = styled.button`width:28px;height:28px;background:${theme.ac};border:none;border-radius:4px;cursor:pointer;color:#fff;font-size:12px;&:hover{background:${theme.ac2};}`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ModalBox = styled.div`
  background: ${theme.bg2};
  border: 1px solid ${theme.bd};
  border-radius: 8px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.55);
  width: 62%;
  height: 58%;
  min-width: 340px;
  min-height: 260px;
  max-width: 860px;
  max-height: 72vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  resize: both;
`;
const ModalHd = styled.div`
  height: 36px;
  padding: 0 12px;
  background: ${theme.bg3};
  border-bottom: 1px solid ${theme.bd};
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;
const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 14px 16px;
  font-size: 11px;
  line-height: 1.7;
  color: ${theme.tx};
`;
const ExpandBtn = styled.button`
  margin-left: auto;
  width: 22px;
  height: 22px;
  background: none;
  border: 1px solid ${theme.bd2};
  border-radius: 4px;
  color: ${theme.tx3};
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: ${theme.bg4}; color: ${theme.tx}; border-color: ${theme.bd}; }
`;

function MsgContent({ text }) {
  const parts = [];
  const codeBlockRe = /```(?:\w+)?\n?([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = codeBlockRe.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', content: text.slice(last, m.index) });
    parts.push({ type: 'code', content: m[1].trimEnd() });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });

  // 수식처럼 보이는 줄 감지 (= 포함 + 수식 기호)
  const isFormula = line =>
    /[=×÷·μρ]/.test(line) && /\d/.test(line) && !line.trimStart().startsWith('#');

  function renderSegments(line) {
    return line.split(/(\*\*[^*]+\*\*)/).map((seg, j) =>
      seg.startsWith('**') && seg.endsWith('**')
        ? <strong key={j}>{seg.slice(2, -2)}</strong>
        : seg
    );
  }

  function renderText(raw) {
    return raw.split('\n').map((line, i) => {
      const trimmed = line.trimStart();
      const isBullet  = trimmed.startsWith('- ') || trimmed.startsWith('• ');
      const isHeading = trimmed.startsWith('## ') || trimmed.startsWith('# ');
      const formula   = isFormula(line);

      if (isHeading) {
        const txt = trimmed.replace(/^#+\s*/, '');
        return <div key={i} style={{ fontWeight: 700, color: '#79c0ff', marginTop: 6, marginBottom: 2 }}>{txt}</div>;
      }
      if (isBullet) {
        return (
          <div key={i} style={{ paddingLeft: 10, textIndent: -10, marginLeft: 10 }}>
            {'• '}{renderSegments(trimmed.replace(/^[-•]\s*/, ''))}
          </div>
        );
      }
      if (formula) {
        return (
          <div key={i} style={{
            fontFamily: 'monospace', fontSize: 9.5,
            background: 'rgba(121,192,255,0.07)', borderLeft: '2px solid #304060',
            padding: '1px 8px', margin: '2px 0', letterSpacing: '0.3px',
          }}>
            {renderSegments(line)}
          </div>
        );
      }
      return <div key={i}>{renderSegments(line)}</div>;
    });
  }

  return (
    <>
      {parts.map((p, i) =>
        p.type === 'code'
          ? <pre key={i}>{p.content}</pre>
          : <span key={i}>{renderText(p.content)}</span>
      )}
    </>
  );
}

// ── Tab2 전용 3D 씬 ──────────────────────────────────────
function CaskLayer2({ layer, index, total, wireframe }) {
  const op = wireframe ? 0.08 : Math.max(0.22, 0.82 - index * (0.5 / Math.max(total - 1, 1)));
  const rot = layer.axis === 'x' ? [0, 0, Math.PI/2] : layer.axis === 'y' ? [Math.PI/2, 0, 0] : [0, 0, 0];
  return (
    <group rotation={rot}>
      <mesh>
        <cylinderGeometry args={[layer.r, layer.r, layer.h, 48, 1, true]} />
        <meshStandardMaterial color={layer.color} transparent opacity={op} side={THREE.DoubleSide} roughness={0.5} wireframe={wireframe} />
      </mesh>
      {!wireframe && <mesh><cylinderGeometry args={[layer.r, layer.r, layer.h, 24, 1, true]} /><meshBasicMaterial color={layer.color} transparent opacity={0.15} side={THREE.DoubleSide} wireframe /></mesh>}
      <mesh position={[0, layer.h/2, 0]}><circleGeometry args={[layer.r, 48]} /><meshStandardMaterial color={layer.color} transparent opacity={op*0.6} side={THREE.DoubleSide} wireframe={wireframe} /></mesh>
      <mesh position={[0, -layer.h/2, 0]}><circleGeometry args={[layer.r, 48]} /><meshStandardMaterial color={layer.color} transparent opacity={op*0.6} side={THREE.DoubleSide} wireframe={wireframe} /></mesh>
    </group>
  );
}
function SphLayer2({ layer, index, total, wireframe }) {
  const op = wireframe ? 0.08 : Math.max(0.2, 0.72 - index * 0.15);
  return <mesh><sphereGeometry args={[layer.r, 32, 32]} /><meshStandardMaterial color={layer.color} transparent opacity={op} side={THREE.DoubleSide} wireframe={wireframe} /></mesh>;
}
function BoxLayer2({ layer, index, total, wireframe }) {
  const op = wireframe ? 0.08 : Math.max(0.22, 0.75 - index * 0.12);
  return <mesh><boxGeometry args={[layer.w||layer.r*2, layer.h, layer.d||layer.r*2]} /><meshStandardMaterial color={layer.color} transparent opacity={op} side={THREE.DoubleSide} wireframe={wireframe} /></mesh>;
}
function ConeLayer2({ layer, index, total, wireframe }) {
  const op = wireframe ? 0.08 : Math.max(0.22, 0.75 - index * 0.12);
  return <mesh><cylinderGeometry args={[layer.rTop||0, layer.r, layer.h, 48, 1, true]} /><meshStandardMaterial color={layer.color} transparent opacity={op} side={THREE.DoubleSide} wireframe={wireframe} /></mesh>;
}
function ShapeLayer2({ layer, index, total, wireframe }) {
  switch (layer.shape) {
    case 'sphere': return <SphLayer2 layer={layer} index={index} total={total} wireframe={wireframe} />;
    case 'box':    return <BoxLayer2 layer={layer} index={index} total={total} wireframe={wireframe} />;
    case 'cone':   return <ConeLayer2 layer={layer} index={index} total={total} wireframe={wireframe} />;
    default:       return <CaskLayer2 layer={layer} index={index} total={total} wireframe={wireframe} />;
  }
}
function CaskModel2({ layers, wireframe, autoRotate }) {
  const ref = useRef();
  useFrame(() => { if (autoRotate && ref.current) ref.current.rotation.y += 0.004; });
  const sorted = [...layers].sort((a, b) => b.r - a.r);
  return (
    <group ref={ref}>
      {sorted.map((l, i) => <ShapeLayer2 key={i} layer={l} index={i} total={sorted.length} wireframe={wireframe} />)}
      <axesHelper args={[Math.max(...sorted.map(l => l.r), 1) * 1.6]} />
    </group>
  );
}
function CaskScene({ layers, wireframe, autoRotate }) {
  const camDist = layers.length ? Math.max(...layers.map(l => Math.max(l.r, l.h/2))) * 3.5 : 6;
  return (
    <Canvas camera={{ position: [camDist*0.6, camDist*0.5, camDist], fov: 45 }} style={{ background: 'transparent' }} gl={{ antialias: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1.4} />
      <directionalLight position={[-8, 5, -5]} intensity={0.5} color="#a0c0ff" />
      {layers.length ? <CaskModel2 layers={layers} wireframe={wireframe} autoRotate={autoRotate} /> : null}
      <OrbitControls enablePan={false} />
      <gridHelper args={[camDist*2, 10, '#1a2040', '#1a2040']} />
    </Canvas>
  );
}

const SOURCE_E = { co60: 1.25, cs137: 0.662, ir192: 0.380, am241: 0.060 };

export default function Tab2() {
  const { uploadedCode, uploadedFileName, parseResult, setUploadedFile, setParseResult, clearUpload } = useMCNPStore();
  const [drag, setDrag] = useState(false);
  const [msgs, setMsgs] = useState([{ id: 0, user: false, text: '파일을 업로드하고 AI 해석을 실행하면 해당 설계에 대한 맞춤 조언을 드릴 수 있습니다.' }]);
  const [input, setInput] = useState('');
  const [expandedMsg, setExpandedMsg] = useState(null);
  const [rendered, setRendered] = useState(false);
  const [wireframe2, setWireframe2] = useState(false);
  const [autoRotate2, setAutoRotate2] = useState(true);
  const [parsedLayers, setParsedLayers] = useState([]);
  
  const [chatHistory2, setChatHistory2] = useState([]);

  // ── 차폐 두께 계산기 상태 ──
  const [optMat,        setOptMat]        = useState('lead');
  const [optSource,     setOptSource]     = useState('cs137');
  const [optCustomE,    setOptCustomE]    = useState('1.0');
  const [optTrans,      setOptTrans]      = useState('0.1');
  const [optCustomT,    setOptCustomT]    = useState('0.05');
  const [optBuildup,    setOptBuildup]    = useState(true);
  const [optResult,     setOptResult]     = useState(null);
  const [optLoading,    setOptLoading]    = useState(false);
  
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = e => {
      setUploadedFile(f.name, e.target.result);
      addMsg(`파일 "${f.name}" 업로드 완료. "AI 해석 시작"을 눌러 분석하세요.`, false);
    };
    reader.readAsText(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const analyze = () => {
    if (!uploadedCode) return;
    const result = parseMCNP(uploadedCode);
    setParseResult(result);
    // 파싱된 셀/서페이스로 3D 레이어 추출
    const layers = buildCaskLayers(result.parsedCells || [], result.parsedSurfs || [], []);
    setParsedLayers(layers);
    addMsg(
      `분석 완료: Cell ${result.cells}개 · Surface ${result.surfs}개 · Material ${result.mats}개 · NPS ${result.nps} · MODE ${result.mode || 'N'}. ` +
      (result.errors.length ? `⚠️ ${result.errors.length}개 오류 감지.` : '✅ 주요 오류 없음.') +
      (layers.length ? ` 3D 렌더링 가능 레이어 ${layers.length}개 추출.` : '') +
      '\n이 설계에 대해 질문해 주세요.',
      false
    );
  };

  const calcThickness = async () => {
    const energy   = optSource === 'custom' ? parseFloat(optCustomE)  : SOURCE_E[optSource];
    const doseRed  = optTrans  === 'custom' ? parseFloat(optCustomT)  : parseFloat(optTrans);
    if (!energy || isNaN(doseRed) || doseRed <= 0 || doseRed >= 1) return;
    setOptLoading(true);
    setOptResult(null);
    try {
      const res = await fetch('http://localhost:8000/optimize/thickness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material: optMat, dose_reduction: doseRed, energy_MeV: energy, use_buildup: optBuildup }),
      });
      const data = await res.json();
      setOptResult(res.ok ? data : { error: data.detail || '오류' });
    } catch {
      setOptResult({ error: '서버 연결 실패 (localhost:8000)' });
    } finally {
      setOptLoading(false);
    }
  };

  const addMsg = (text, user, id, loading = false) => {
    const msgId = id || Date.now();
    setMsgs(m => [...m, { id: msgId, user, text, loading }]);
  };

  const send = () => {
    const t = input.trim(); if (!t) return;
    const userMsgId = Date.now();
    const loadingId = userMsgId + 1;
    addMsg(t, true, userMsgId); setInput('');
    addMsg('🔬 설계 분석 중...', false, loadingId, true);

    const ctx = parseResult || {};
    fetch('http://localhost:8000/chat/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: t,
        history: chatHistory2,
        context: {
          cellCount:  ctx.cells  || 0,
          surfCount:  ctx.surfs  || 0,
          materials:  [],
          mode:       ctx.mode   || 'N',
          nps:        ctx.nps    || '—',
          errors:     ctx.errors?.map(e => e.msg) || [],
          warns:      ctx.warns?.map(w => w.msg)  || [],
          summary:    ctx.summary || '',
          code:       uploadedCode ? uploadedCode.slice(0, 3000) : '',
        },
      }),
    })
      .then(r => r.json())
      .then(data => {
        setMsgs(m => m.map(msg =>
          msg.id === loadingId ? { ...msg, text: data.reply, loading: false } : msg
        ));
        setChatHistory2(h => [
          ...h,
          { role: 'user',  text: t },
          { role: 'model', text: data.reply },
        ]);
      })
      .catch(e => {
        setMsgs(m => m.map(msg =>
          msg.id === loadingId
            ? { ...msg, text: `⚠ 서버 연결 실패. 백엔드가 실행 중인지 확인하세요.`, loading: false }
            : msg
        ));
      });
  };

  const codeLines = uploadedCode ? uploadedCode.split('\n') : [];

  return (
    <>
    <Grid>
      {/* COL A: 업로드 + 해석 */}
      <Col>
        <ColHeader>
          <ColTitle>파일 업로드 / 해석</ColTitle>
          {uploadedCode && (
            <Btn $variant="primary" style={{ fontSize: 9, padding: '2px 8px' }} onClick={analyze}>
              AI 해석 시작
            </Btn>
          )}
        </ColHeader>
        <ColScroll>
          {/* Upload */}
          <CollapsibleCard badge="DATA" title="파일 업로드">
            <UploadZone
              $hasFile={!!uploadedFileName} $drag={drag}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
            >
              <div style={{ fontSize: 26, opacity: 0.5 }}>📄</div>
              <div style={{ fontSize: 11, color: theme.tx2 }}>MCNP .i 파일 드래그 또는 클릭</div>
              <div style={{ fontSize: 9, color: theme.tx3 }}>.i / .inp / .txt 지원</div>
            </UploadZone>
            <input ref={fileRef} type="file" accept=".i,.inp,.txt" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            {uploadedFileName && (
              <FileInfoRow>
                <span style={{ fontSize: 14 }}>📋</span>
                <span style={{ fontSize: 10, fontWeight: 600, flex: 1, fontFamily: theme.mn, color: theme.gn }}>{uploadedFileName}</span>
                <Btn $variant="del" onClick={clearUpload}>✕</Btn>
              </FileInfoRow>
            )}
          </CollapsibleCard>

          {/* Parse result */}
          {parseResult && (
            <CollapsibleCard badge="TALLY" title="AI 해석 결과">
              <StatGrid>
                {[
                  { label: 'Cell 수',    val: parseResult.cells, color: theme.ac },
                  { label: 'Surface 수', val: parseResult.surfs, color: theme.tl },
                  { label: 'Material 수',val: parseResult.mats,  color: theme.gn },
                  { label: 'NPS',        val: parseResult.nps,   color: parseResult.nps !== '—' ? theme.tx : theme.am },
                ].map(s => (
                  <StatBox key={s.label}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: theme.mn, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 8, color: theme.tx3, marginTop: 2 }}>{s.label}</div>
                  </StatBox>
                ))}
              </StatGrid>
              <div style={{ background: theme.bg3, border: `1px solid ${theme.bd}`, borderRadius: 5, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.6px', color: theme.tx3, marginBottom: 6 }}>설계 요약</div>
                <div style={{ fontSize: 10, color: theme.tx, lineHeight: 1.6 }}>{parseResult.summary}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {parseResult.errors.map((e, i) => (
                  <div key={i} style={{ padding: '5px 8px', borderRadius: 3, borderLeft: `3px solid ${theme.rd}`, background: 'rgba(217,79,79,0.08)', fontSize: 10 }}>
                    <div style={{ fontFamily: theme.mn, fontSize: 9, color: theme.rd }}>🔴 L{e.ln} — {e.msg}</div>
                    <div style={{ fontSize: 9, color: theme.tx2, marginTop: 2 }}>{e.reason}</div>
                  </div>
                ))}
                {parseResult.warns.map((w, i) => (
                  <div key={i} style={{ padding: '5px 8px', borderRadius: 3, borderLeft: `3px solid ${theme.am}`, background: 'rgba(240,160,32,0.07)', fontSize: 10 }}>
                    <div style={{ fontFamily: theme.mn, fontSize: 9, color: theme.am }}>🟡 {w.ln} — {w.msg}</div>
                    <div style={{ fontSize: 9, color: theme.tx2, marginTop: 2 }}>{w.reason}</div>
                  </div>
                ))}
                {!parseResult.errors.length && !parseResult.warns.length && (
                  <div style={{ padding: '5px 8px', borderRadius: 3, borderLeft: `3px solid ${theme.gn}`, background: 'rgba(40,201,154,0.06)', fontSize: 10, color: theme.tx }}>
                    ✅ 감지된 오류 없음
                  </div>
                )}
              </div>
            </CollapsibleCard>
          )}

          {/* ── 차폐 두께 계산기 ── */}
          <CollapsibleCard badge="OPT" title="차폐 두께 계산기" defaultOpen={true}>
            {/* 선원 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: theme.tx3, width: 30, flexShrink: 0 }}>선원</span>
              <Select $w="100%" value={optSource} onChange={e => setOptSource(e.target.value)} style={{ flex: 1 }}>
                <option value="co60">Co-60 (1.25 MeV)</option>
                <option value="cs137">Cs-137 (0.662 MeV)</option>
                <option value="ir192">Ir-192 (0.380 MeV)</option>
                <option value="am241">Am-241 (0.060 MeV)</option>
                <option value="custom">직접입력</option>
              </Select>
              {optSource === 'custom' && (
                <Input $w="56px" value={optCustomE} onChange={e => setOptCustomE(e.target.value)} placeholder="MeV" />
              )}
            </div>

            {/* 재질 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: theme.tx3, width: 30, flexShrink: 0 }}>재질</span>
              <Select $w="100%" value={optMat} onChange={e => setOptMat(e.target.value)} style={{ flex: 1 }}>
                <option value="lead">납 (Pb)</option>
                <option value="concrete">콘크리트</option>
                <option value="water">물 (H₂O)</option>
                <option value="iron">철 (Fe)</option>
                <option value="hdpe">HDPE</option>
                <option value="b4c">탄화붕소 (B₄C)</option>
                <option value="boral">Boral</option>
              </Select>
            </div>

            {/* 목표 투과율 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: theme.tx3, width: 30, flexShrink: 0 }}>투과율</span>
              <Select $w="100%" value={optTrans} onChange={e => setOptTrans(e.target.value)} style={{ flex: 1 }}>
                <option value="0.5">50% — 2배 감쇠</option>
                <option value="0.1">10% — 10배 감쇠</option>
                <option value="0.01">1% — 100배 감쇠</option>
                <option value="0.001">0.1% — 1000배 감쇠</option>
                <option value="custom">직접입력</option>
              </Select>
              {optTrans === 'custom' && (
                <Input $w="56px" value={optCustomT} onChange={e => setOptCustomT(e.target.value)} placeholder="0~1" />
              )}
            </div>

            {/* 빌드업 토글 */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 9, color: theme.tx2 }}>
              <input type="checkbox" checked={optBuildup} onChange={e => setOptBuildup(e.target.checked)}
                style={{ accentColor: theme.ac, width: 12, height: 12 }} />
              Buildup Factor 적용 (Berger 근사)
            </label>

            <Btn $variant="primary" onClick={calcThickness} disabled={optLoading}
              style={{ width: '100%', marginTop: 2 }}>
              {optLoading ? '계산 중...' : '두께 계산'}
            </Btn>

            {/* 결과 */}
            {optResult && !optResult.error && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {[
                    { label: '필요 두께',  val: `${optResult.thickness_cm} cm`, color: theme.gn },
                    { label: '감쇠 계수',  val: `${optResult.attenuation_factor}×`,   color: theme.ac },
                    { label: 'HVL (반가층)', val: `${optResult.hvl_cm} cm`,      color: theme.tl },
                    { label: 'TVL (십가층)', val: `${optResult.tvl_cm} cm`,      color: theme.pu },
                  ].map(s => (
                    <div key={s.label} style={{ background: theme.bg4, border: `1px solid ${theme.bd}`, borderRadius: 5, padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: theme.mn, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 8, color: theme.tx3, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 9, color: theme.tx3, padding: '4px 6px', borderLeft: `2px solid ${theme.bd2}` }}>
                  {optResult.mat_name} · μ = {optResult['mu_linear_cm-1']} cm⁻¹ · {optResult.used_buildup ? 'Buildup 포함' : 'Buildup 미적용'}
                </div>
              </>
            )}
            {optResult?.error && (
              <div style={{ fontSize: 9, color: theme.rd, padding: '4px 6px', borderLeft: `2px solid ${theme.rd}` }}>
                {optResult.error}
              </div>
            )}
          </CollapsibleCard>
        </ColScroll>
      </Col>

      {/* COL B: 코드 뷰어 */}
      <Col style={{ background: theme.bg }}>
        <ColHeader>
          <ColTitle>코드 내용</ColTitle>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {parseResult?.errors.length > 0 && (
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(217,79,79,0.15)', color: theme.rd }}>오류 {parseResult.errors.length}</span>
            )}
            {parseResult?.warns.length > 0 && (
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: 'rgba(240,160,32,0.12)', color: theme.am }}>경고 {parseResult.warns.length}</span>
            )}
          </div>
        </ColHeader>
        <div style={{ flex: 1, overflow: 'auto', padding: '6px 0', fontFamily: theme.mn, fontSize: 10, lineHeight: '1.65' }}>
          {codeLines.length ? codeLines.map((l, i) => {
            const ln = i + 1;
            const isErr  = parseResult?.errors.some(e => e.ln === ln);
            const isWarn = parseResult?.warns.some(w => w.ln === ln);
            return (
              <CodeViewLine key={i} $err={isErr} $warn={isWarn}>
                <LineNum>{ln}</LineNum>
                <span style={{ color: theme.tx2 }}>{l}</span>
              </CodeViewLine>
            );
          }) : (
            <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: 9, color: theme.tx3 }}>
              파일을 업로드하면 코드 내용이 표시됩니다
            </div>
          )}
        </div>
      </Col>

      {/* COL C: 시각화 + 챗봇 */}
      <Col>
        <ColHeader>
          <ColTitle>시각화 / 설계 조언</ColTitle>
          <div style={{ display: 'flex', gap: 4 }}>
            <Btn $variant="ghost" style={{ fontSize: 9, padding: '2px 6px' }} onClick={() => setWireframe2(w => !w)}>
              {wireframe2 ? 'Solid' : 'Wire'}
            </Btn>
            <Btn $variant="ghost" style={{ fontSize: 9, padding: '2px 6px' }} onClick={() => setAutoRotate2(a => !a)}>
              {autoRotate2 ? '⏸ 회전' : '▶ 회전'}
            </Btn>
            <Btn $variant="primary" style={{ fontSize: 9, padding: '2px 6px' }} disabled={!uploadedCode} onClick={() => setRendered(true)}>
              렌더링
            </Btn>
          </div>
        </ColHeader>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', padding: 9 }}>
          {/* 3D Viewer */}
          <div style={{ height: 200, flexShrink: 0, borderRadius: 5, overflow: 'hidden', border: `1px solid ${theme.bd}`, background: rendered ? 'radial-gradient(ellipse at 50% 40%, #0c1422, #090c12)' : theme.bg, position: 'relative' }}>
            {rendered ? (
              <>
                <CaskScene layers={parsedLayers} wireframe={wireframe2} autoRotate={autoRotate2} />
                {/* 범례 */}
                {parsedLayers.length > 0 && (
                  <div style={{ position: 'absolute', bottom: 6, left: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {parsedLayers.map((l, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: theme.tx2 }}>
                        <div style={{ width: 7, height: 7, borderRadius: 2, background: l.color, border: `1px solid ${l.color}`, flexShrink: 0 }} />
                        <span style={{ color: l.color }}>셀{i+1}</span>
                        {l.rawR && <span style={{ color: theme.tx3 }}>r={l.rawR}cm</span>}
                      </div>
                    ))}
                  </div>
                )}
                {parsedLayers.length === 0 && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 9, color: theme.tx3, textAlign: 'center' }}>
                      AI 해석을 먼저 실행하면<br />파일 기반으로 렌더링됩니다
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 22, opacity: 0.4 }}>⬡</div>
                <div style={{ fontSize: 9, color: theme.tx3 }}>파일 업로드 후 렌더링</div>
              </div>
            )}
          </div>

          {/* Chat */}
          <ChatWrap>
            <div style={{ height: 36, padding: '0 9px', background: theme.bg3, borderBottom: `1px solid ${theme.bd}`, fontSize: 9, fontWeight: 700, color: theme.tx2, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <PulseDot />설계 조언 AI (파일 컨텍스트 인식)
              {/* 버튼 추가 */}
              <ExpandBtn
                title="채팅 전체 보기"
                onClick={() => setExpandedMsg(msgs.filter(m => !m.loading))}
              >⤢</ExpandBtn>
            </div>
            <ChatMsgs>
              {msgs.map(m => (
                <Msg key={m.id} $user={m.user}>
                  {m.user ? m.text : <MsgContent text={m.text} />}
                </Msg>
              ))}
            </ChatMsgs>
            <ChatInputRow>
              <ChatInput rows={1} value={input} onChange={e => setInput(e.target.value)}
                placeholder="예) 납 두께를 5cm 줄이면 선량이 얼마나 늘어나나요?"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
              <SendBtn onClick={send}>↑</SendBtn>
            </ChatInputRow>
          </ChatWrap>
        </div>
      </Col>
    </Grid>

    {/* 모달: Grid 바깥, Fragment 안쪽 */}
      {expandedMsg && (
        <ModalOverlay onClick={() => setExpandedMsg(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalHd>
              <PulseDot />
              <span style={{ fontSize: 9, fontWeight: 700, color: theme.tx2 }}>채팅 전체 보기</span>
              <button onClick={() => setExpandedMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: theme.tx3, cursor: 'pointer' }}>✕</button>
            </ModalHd>
            <ModalBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {expandedMsg.map(m => (
                  <div key={m.id} style={{
                    alignSelf: m.user ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    padding: '7px 11px',
                    borderRadius: m.user ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                    background: m.user ? theme.ac2 : theme.bg4,
                    border: m.user ? 'none' : `1px solid ${theme.bd}`,
                    color: m.user ? '#fff' : theme.tx,
                    fontSize: 11,
                    lineHeight: 1.65,
                  }}>
                    {m.user ? m.text : <MsgContent text={m.text} />}
                  </div>
                ))}
              </div>
            </ModalBody>
          </ModalBox>
        </ModalOverlay>
      )}
    </> 
  );
}