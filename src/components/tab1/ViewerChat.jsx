import { useRef, useState } from 'react';
import styled from 'styled-components';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { theme, ColHeader, ColTitle, Btn, PulseDot } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import { buildCaskLayers } from '@/utils/buildCaskLayers';

function getMatColor(label, fallback) {
  const s = (label || '').toLowerCase();
  if (s.includes('납') || s.includes('lead') || s.includes('pb'))          return '#6b7a8d';
  if (s.includes('magnetite') || s.includes('자철'))                        return '#5a5a6a';
  if (s.includes('콘크리트') || s.includes('concrete'))                     return '#8a8a7a';
  if (s.includes('uo₂') || s.includes('uo2') || s.includes('우라늄'))       return '#e08840';
  if (s.includes('mox'))                                                     return '#c06838';
  if (s.includes('zircaloy') || s.includes('지르'))                         return '#78a0a8';
  if (s.includes('ss304') || s.includes('ss316') || s.includes('스테인'))   return '#a0a8b0';
  if (s.includes('붕소강') || s.includes('boron steel'))                    return '#7a8890';
  if (s.includes('알루미늄') || s.includes('al-6061') || s.includes('al6')) return '#c8c8b0';
  if (s.includes('b₄c') || s.includes('b4c') || s.includes('탄화붕소'))    return '#404850';
  if (s.includes('boral'))                                                   return '#c0c8a0';
  if (s.includes('borated') || s.includes('붕소 함유'))                     return '#b8d8b8';
  if (s.includes('hdpe') || s.includes('폴리에틸렌'))                       return '#d0e8d0';
  if (s.includes('붕산') || s.includes('boric'))                            return '#a0c8e0';
  if (s.includes('중수') || s.includes('heavy water'))                      return '#3a7ab0';
  if (s.includes('물') || s.includes('water'))                              return '#4a90c8';
  return fallback;
}

function isMetallic(label) {
  const s = (label || '').toLowerCase();
  return s.includes('납') || s.includes('lead') || s.includes('steel') ||
         s.includes('ss3') || s.includes('알루미늄') || s.includes('zircaloy');
}

function CaskLayer({ layer, index, totalLayers, wireframe }) {
  const opacity    = wireframe ? 0.08 : Math.max(0.22, 0.82 - index * (0.5 / Math.max(totalLayers - 1, 1)));
  const capOpacity = wireframe ? 0.05 : opacity * 0.65;
  const physColor  = getMatColor(layer.label, layer.color);
  const metalness  = isMetallic(layer.label) ? 0.55 : 0.08;
  const rot = layer.axis === 'x' ? [0, 0, Math.PI/2]
            : layer.axis === 'y' ? [Math.PI/2, 0, 0]
            : [0, 0, 0];
  return (
    <group rotation={rot}>
      <mesh>
        <cylinderGeometry args={[layer.r, layer.r, layer.h, 64, 1, true]} />
        <meshStandardMaterial color={physColor} transparent opacity={opacity}
          side={THREE.DoubleSide} roughness={0.5} metalness={metalness} wireframe={wireframe} />
      </mesh>
      {!wireframe && (
        <mesh>
          <cylinderGeometry args={[layer.r, layer.r, layer.h, 32, 1, true]} />
          <meshBasicMaterial color={layer.color} transparent opacity={0.18}
            side={THREE.DoubleSide} wireframe />
        </mesh>
      )}
      <mesh position={[0, layer.h / 2, 0]}>
        <circleGeometry args={[layer.r, 64]} />
        <meshStandardMaterial color={physColor} transparent opacity={capOpacity}
          side={THREE.DoubleSide} roughness={0.5} wireframe={wireframe} />
      </mesh>
      <mesh position={[0, -layer.h / 2, 0]}>
        <circleGeometry args={[layer.r, 64]} />
        <meshStandardMaterial color={physColor} transparent opacity={capOpacity}
          side={THREE.DoubleSide} roughness={0.5} wireframe={wireframe} />
      </mesh>
    </group>
  );
}

function SphLayer({ layer, index, totalLayers, wireframe }) {
  const opacity   = wireframe ? 0.08 : Math.max(0.2, 0.72 - index * 0.15);
  const physColor = getMatColor(layer.label, layer.color);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[layer.r, 48, 48]} />
        <meshStandardMaterial color={physColor} transparent opacity={opacity}
          side={THREE.DoubleSide} roughness={0.5} wireframe={wireframe} />
      </mesh>
      {!wireframe && (
        <mesh>
          <sphereGeometry args={[layer.r, 24, 24]} />
          <meshBasicMaterial color={layer.color} transparent opacity={0.15}
            side={THREE.DoubleSide} wireframe />
        </mesh>
      )}
    </group>
  );
}

function BoxLayer({ layer, index, totalLayers, wireframe }) {
  const opacity   = wireframe ? 0.08 : Math.max(0.22, 0.78 - index * 0.12);
  const physColor = getMatColor(layer.label, layer.color);
  return (
    <group>
      <mesh>
        <boxGeometry args={[layer.w || layer.r*2, layer.h, layer.d || layer.r*2]} />
        <meshStandardMaterial color={physColor} transparent opacity={opacity}
          side={THREE.DoubleSide} roughness={0.5} wireframe={wireframe} />
      </mesh>
      {!wireframe && (
        <mesh>
          <boxGeometry args={[layer.w || layer.r*2, layer.h, layer.d || layer.r*2]} />
          <meshBasicMaterial color={layer.color} transparent opacity={0.18}
            side={THREE.DoubleSide} wireframe />
        </mesh>
      )}
    </group>
  );
}

function ConeLayer({ layer, index, totalLayers, wireframe }) {
  const opacity   = wireframe ? 0.08 : Math.max(0.22, 0.78 - index * 0.12);
  const physColor = getMatColor(layer.label, layer.color);
  const rot = layer.axis === 'x' ? [0, 0, Math.PI/2]
            : layer.axis === 'y' ? [Math.PI/2, 0, 0]
            : [0, 0, 0];
  return (
    <group rotation={rot}>
      <mesh>
        <cylinderGeometry args={[layer.rTop || 0, layer.r, layer.h, 48, 1, true]} />
        <meshStandardMaterial color={physColor} transparent opacity={opacity}
          side={THREE.DoubleSide} roughness={0.5} wireframe={wireframe} />
      </mesh>
      {!wireframe && (
        <mesh>
          <cylinderGeometry args={[layer.rTop || 0, layer.r, layer.h, 32, 1, true]} />
          <meshBasicMaterial color={layer.color} transparent opacity={0.18}
            side={THREE.DoubleSide} wireframe />
        </mesh>
      )}
    </group>
  );
}

function TorusLayer({ layer, index, totalLayers, wireframe }) {
  const opacity   = wireframe ? 0.08 : Math.max(0.2, 0.72 - index * 0.12);
  const physColor = getMatColor(layer.label, layer.color);
  const rot = layer.axis === 'x' ? [0, Math.PI/2, 0]
            : layer.axis === 'y' ? [Math.PI/2, 0, 0]
            : [0, 0, 0];
  return (
    <group rotation={rot}>
      <mesh>
        <torusGeometry args={[layer.r, layer.tube || layer.r * 0.25, 32, 64]} />
        <meshStandardMaterial color={physColor} transparent opacity={opacity}
          side={THREE.DoubleSide} roughness={0.5} wireframe={wireframe} />
      </mesh>
    </group>
  );
}

function ShapeLayer({ layer, index, totalLayers, wireframe }) {
  switch (layer.shape) {
    case 'sphere':  return <SphLayer  layer={layer} index={index} totalLayers={totalLayers} wireframe={wireframe} />;
    case 'box':     return <BoxLayer  layer={layer} index={index} totalLayers={totalLayers} wireframe={wireframe} />;
    case 'cone':    return <ConeLayer layer={layer} index={index} totalLayers={totalLayers} wireframe={wireframe} />;
    case 'torus':   return <TorusLayer layer={layer} index={index} totalLayers={totalLayers} wireframe={wireframe} />;
    case 'cylinder':
    default:        return <CaskLayer layer={layer} index={index} totalLayers={totalLayers} wireframe={wireframe} />;
  }
}

function CaskModel({ layers, wireframe, autoRotate }) {
  const groupRef = useRef();
  useFrame(() => {
    if (autoRotate && groupRef.current) groupRef.current.rotation.y += 0.004;
  });
  if (!layers.length) return null;
  const sorted = [...layers].sort((a, b) => b.r - a.r);
  return (
    <group ref={groupRef}>
      {sorted.map((l, i) =>
        <ShapeLayer key={i} layer={l} index={i} totalLayers={sorted.length} wireframe={wireframe} />
      )}
      <axesHelper args={[Math.max(...sorted.map(l => l.r), 1) * 1.6]} />
    </group>
  );
}

function LayerLegend({ layers }) {
  if (!layers.length) return null;
  return (
    <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {layers.map((l, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: theme.tx2 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: getMatColor(l.label, l.color), border: `1px solid ${l.color}`, flexShrink: 0 }} />
          <span style={{ color: l.color, fontWeight: 600 }}>{l.label}</span>
          {l.rawR && <span style={{ color: theme.tx3 }}>r={l.rawR}cm h={l.rawH?.toFixed(0)}cm</span>}
        </div>
      ))}
    </div>
  );
}

const ChatWrap = styled.div`
  border: 1px solid ${theme.bd};
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
  min-height: 0;
`;
const ChatHd = styled.div`
  height: 36px;
  padding: 0 9px;
  background: ${theme.bg3};
  border-bottom: 1px solid ${theme.bd};
  font-size: 9px;
  font-weight: 700;
  color: ${theme.tx2};
  display: flex;
  align-items: center;
  gap: 5px;
  letter-spacing: 0.4px;
  flex-shrink: 0;
`;
const ChatMsgs = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 7px 9px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const Msg = styled.div`
  max-width: 90%;
  padding: 5px 8px;
  font-size: 10px;
  line-height: 1.5;
  align-self: ${p => p.$user ? 'flex-end' : 'flex-start'};
  background: ${p => p.$user ? theme.ac2 : theme.bg3};
  color: ${p => p.$user ? '#fff' : theme.tx};
  border: ${p => p.$user ? 'none' : `1px solid ${theme.bd}`};
  border-radius: ${p => p.$user ? '6px 6px 2px 6px' : '6px 6px 6px 2px'};
`;
const ChatInputRow = styled.div`
  padding: 6px 9px;
  border-top: 1px solid ${theme.bd};
  display: flex;
  gap: 4px;
  flex-shrink: 0;
`;
const ChatInput = styled.textarea`
  flex: 1;
  background: ${theme.bg3};
  border: 1px solid ${theme.bd2};
  border-radius: 4px;
  color: ${theme.tx};
  font-size: 10px;
  padding: 5px 8px;
  outline: none;
  resize: none;
  font-family: ${theme.sf};
  &:focus { border-color: ${theme.ac}; }
`;
const SendBtn = styled.button`
  width: 28px; height: 28px;
  background: ${theme.ac};
  border: none; border-radius: 4px;
  cursor: pointer; color: #fff; font-size: 12px;
  &:hover { background: ${theme.ac2}; }
`;

export default function ViewerChat({ onApply }) {
  const [msgs, setMsgs]                     = useState([{ id: 0, user: false, text: 'MCNP 설계를 도와드립니다. 셀 구성, 재질, LAT 설정 등 질문하세요.' }]);
  const [input, setInput]                   = useState('');
  const [chatHistory, setChatHistory]       = useState([]);
  const [wireframe, setWireframe]           = useState(false);
  const [autoRotate, setAutoRotate]         = useState(true);
  const [rendered, setRendered]             = useState(false);
  const [renderedLayers, setRenderedLayers] = useState([]);

  const { cells, surfaces, materials, modes, nps } = useMCNPStore();

  const handleRender = () => {
    const layers = buildCaskLayers(cells, surfaces, materials);
    setRenderedLayers(layers);
    setRendered(true);
  };

  const camDist = renderedLayers.length
    ? Math.max(...renderedLayers.map(l => Math.max(l.r, l.h / 2))) * 3
    : 6;

  const send = async () => {
    const t = input.trim();
    if (!t) return;
    const id = Date.now();
    setMsgs(m => [...m, { id, user: true, text: t }]);
    setInput('');
    const loadingId = id + 1;
    setMsgs(m => [...m, { id: loadingId, user: false, text: '📚 MCNP 매뉴얼 참조 중...', loading: true }]);
    try {
      const res = await fetch('http://localhost:8000/chat/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: t,
          history: chatHistory,
          context: { cellCount: cells.length, surfCount: surfaces.length, materials: materials.map(m => m.name), mode: [...modes].join(' '), nps },
        }),
      });
      if (!res.ok) throw new Error(`서버 오류 ${res.status}`);
      const data = await res.json();
      let sourceStr = '';
      if (data.sources?.length) {
        const unique = [...new Map(data.sources.map(s => [`${s.file}-${s.page}`, s])).values()];
        sourceStr = '\n\n📌 ' + unique.map(s => `${s.file} ${s.page}p`).join(' · ');
      }
      setMsgs(m => m.map(msg => msg.id === loadingId ? { ...msg, text: data.reply + sourceStr, loading: false } : msg));
      setChatHistory(h => [...h, { role: 'user', text: t }, { role: 'model', text: data.reply }]);
    } catch (e) {
      setMsgs(m => m.map(msg => msg.id === loadingId ? { ...msg, text: `⚠ 서버 연결 실패 (localhost:8000)\n${e.message}`, loading: false } : msg));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ColHeader>
        <ColTitle>시각화 / 챗봇</ColTitle>
        <div style={{ display: 'flex', gap: 4 }}>
          <Btn $variant="ghost" style={{ fontSize: 9, padding: '2px 6px' }} onClick={() => setWireframe(w => !w)}>
            {wireframe ? 'Solid' : 'Wire'}
          </Btn>
          <Btn $variant="ghost" style={{ fontSize: 9, padding: '2px 6px' }} onClick={() => setAutoRotate(a => !a)}>
            {autoRotate ? '⏸ 회전' : '▶ 회전'}
          </Btn>
          <Btn $variant="primary" style={{ fontSize: 9, padding: '2px 6px' }} onClick={handleRender}>
            렌더링
          </Btn>
        </div>
      </ColHeader>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', padding: 9 }}>
        <div style={{ height: 200, flexShrink: 0, borderRadius: 5, overflow: 'hidden', border: `1px solid ${theme.bd}`, background: rendered ? 'radial-gradient(ellipse at 50% 40%, #0c1422, #090c12)' : theme.bg, position: 'relative' }}>
          {rendered ? (
            <>
              <Canvas camera={{ position: [camDist * 0.6, camDist * 0.5, camDist], fov: 45 }} style={{ background: 'transparent' }} gl={{ antialias: true }}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[10, 20, 10]} intensity={1.4} />
                <directionalLight position={[-8, 5, -5]} intensity={0.5} color="#a0c0ff" />
                <pointLight position={[0, 10, 0]} intensity={0.5} />
                <CaskModel layers={renderedLayers} wireframe={wireframe} autoRotate={autoRotate} />
                <OrbitControls enablePan={false} />
                <gridHelper args={[camDist * 2, 10, '#1a2040', '#1a2040']} />
              </Canvas>
              <LayerLegend layers={renderedLayers} />
              {renderedLayers.length > 0 && (
                <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, color: theme.tx3, lineHeight: 1.6 }}>
                  {renderedLayers.map((l, i) => <div key={i}>셀{i + 1}: {l.surfType || 'RCC'} r={l.rawR || '?'}cm</div>)}
                </div>
              )}
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 10, color: theme.tx3, textAlign: 'center', lineHeight: 1.8 }}>
                셀·서페이스 입력 후<br />렌더링 버튼 클릭
              </div>
            </div>
          )}
        </div>

        <ChatWrap>
          <ChatHd><PulseDot />설계 도우미 (RAG 연동)</ChatHd>
          <ChatMsgs>
            {msgs.map(m => <Msg key={m.id} $user={m.user}>{m.text}</Msg>)}
          </ChatMsgs>
          <ChatInputRow>
            <ChatInput rows={1} value={input} onChange={e => setInput(e.target.value)}
              placeholder="예) Co-60 차폐 납 두께는?"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
            <SendBtn onClick={send}>↑</SendBtn>
          </ChatInputRow>
        </ChatWrap>
      </div>
    </div>
  );
}
