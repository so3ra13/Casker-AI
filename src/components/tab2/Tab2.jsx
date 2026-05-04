import { useState, useRef } from 'react';
import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { theme, ColHeader, ColTitle, Btn, PulseDot, Info } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import { parseMCNP } from '@/utils/parser';
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
  max-width:90%;padding:5px 8px;border-radius:6px;font-size:10px;line-height:1.5;
  align-self:${p=>p.$user?'flex-end':'flex-start'};
  background:${p=>p.$user?theme.ac2:theme.bg3};
  color:${p=>p.$user?'#fff':theme.tx};
  border:${p=>p.$user?'none':`1px solid ${theme.bd}`};
  border-radius:${p=>p.$user?'6px 6px 2px 6px':'6px 6px 6px 2px'};
`;
const ChatInputRow = styled.div`padding:6px 9px;border-top:1px solid ${theme.bd};display:flex;gap:4px;flex-shrink:0;`;
const ChatInput = styled.textarea`flex:1;background:${theme.bg3};border:1px solid ${theme.bd2};border-radius:4px;color:${theme.tx};font-size:10px;padding:5px 8px;outline:none;resize:none;font-family:${theme.sf};&:focus{border-color:${theme.ac};}`;
const SendBtn = styled.button`width:28px;height:28px;background:${theme.ac};border:none;border-radius:4px;cursor:pointer;color:#fff;font-size:12px;&:hover{background:${theme.ac2};}`;

export default function Tab2() {
  const { uploadedCode, uploadedFileName, parseResult, setUploadedFile, setParseResult, clearUpload } = useMCNPStore();
  const [drag, setDrag] = useState(false);
  const [msgs, setMsgs] = useState([{ id: 0, user: false, text: '파일을 업로드하고 AI 해석을 실행하면 해당 설계에 대한 맞춤 조언을 드릴 수 있습니다.' }]);
  const [input, setInput] = useState('');
  const [rendered, setRendered] = useState(false);
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
    addMsg(
      `분석 완료: Cell ${result.cells}개 · Surface ${result.surfs}개 · Material ${result.mats}개 · NPS ${result.nps} · MODE ${result.mode || 'N'}. ` +
      (result.errors.length ? `⚠️ ${result.errors.length}개 오류 감지.` : '✅ 주요 오류 없음.') +
      '\n이 설계에 대해 질문해 주세요.',
      false
    );
  };

  const addMsg = (text, user, id, loading = false) => {
    const msgId = id || Date.now();
    setMsgs(m => [...m, { id: msgId, user, text, loading }]);
  };

  const [chatHistory2, setChatHistory2] = useState([]);

  const send = () => {
    const t = input.trim(); if (!t) return;
    addMsg(t, true); setInput('');
    const loadingId = Date.now();
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
          <Btn $variant="ghost" style={{ fontSize: 9, padding: '2px 6px' }} disabled={!uploadedCode} onClick={() => setRendered(true)}>
            시각화
          </Btn>
        </ColHeader>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', padding: 9 }}>
          {/* 3D Viewer */}
          <div style={{ height: 180, flexShrink: 0, borderRadius: 5, overflow: 'hidden', border: `1px solid ${theme.bd}`, background: 'radial-gradient(ellipse at 50% 40%, #0c1422, #090c12)' }}>
            {rendered ? (
              <Canvas camera={{ position: [0, 3, 8], fov: 45 }} style={{ background: 'transparent' }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5,10,5]} intensity={1} />
                {[
                  { r: 2.0, color: theme.ac },
                  { r: 1.5, color: theme.tl },
                  { r: 0.8, color: theme.am },
                ].map((l, i) => (
                  <mesh key={i}>
                    <cylinderGeometry args={[l.r, l.r, 5, 64, 1, true]} />
                    <meshStandardMaterial color={l.color} transparent opacity={0.35} side={2} />
                  </mesh>
                ))}
                <OrbitControls />
                <gridHelper args={[10, 10, theme.bd, theme.bd]} />
              </Canvas>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 22, opacity: 0.4 }}>⬡</div>
                <div style={{ fontSize: 9, color: theme.tx3 }}>파일 업로드 후 시각화</div>
              </div>
            )}
          </div>

          {/* Chat */}
          <ChatWrap>
            <div style={{ height: 36, padding: '0 9px', background: theme.bg3, borderBottom: `1px solid ${theme.bd}`, fontSize: 9, fontWeight: 700, color: theme.tx2, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <PulseDot />설계 조언 AI (파일 컨텍스트 인식)
            </div>
            <ChatMsgs>
              {msgs.map(m => <Msg key={m.id} $user={m.user}>{m.text}</Msg>)}
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
  );
}
