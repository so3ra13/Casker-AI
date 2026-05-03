import { useRef, useState } from 'react';
import styled from 'styled-components';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { theme, ColHeader, ColTitle, Btn, PulseDot } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import { buildCaskLayers } from '@/utils/buildCaskLayers';

// ── 단일 레이어 메시 ─────────────────────────────────────
function CaskLayer({ layer, index, wireframe, totalLayers }) {
  const meshRef = useRef();

  return (
    <group>
      {/* 원통 옆면 */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[layer.r, layer.r, layer.h, 64, 1, true]} />
        <meshStandardMaterial
          color={layer.color}
          transparent
          opacity={wireframe ? 0.1 : 0.3 + (totalLayers - index) * 0.05}
          side={THREE.DoubleSide}
          wireframe={wireframe}
        />
      </mesh>
      {/* 위 뚜껑 */}
      <mesh position={[0, layer.h / 2, 0]}>
        <circleGeometry args={[layer.r, 64]} />
        <meshStandardMaterial color={layer.color} transparent opacity={wireframe ? 0.1 : 0.15} side={THREE.DoubleSide} wireframe={wireframe} />
      </mesh>
      {/* 아래 뚜껑 */}
      <mesh position={[0, -layer.h / 2, 0]}>
        <circleGeometry args={[layer.r, 64]} />
        <meshStandardMaterial color={layer.color} transparent opacity={wireframe ? 0.1 : 0.15} side={THREE.DoubleSide} wireframe={wireframe} />
      </mesh>
    </group>
  );
}

// ── 구형 레이어 ───────────────────────────────────────────
function SphLayer({ layer, wireframe }) {
  return (
    <mesh>
      <sphereGeometry args={[layer.r, 32, 32]} />
      <meshStandardMaterial color={layer.color} transparent opacity={0.25} side={THREE.DoubleSide} wireframe={wireframe} />
    </mesh>
  );
}

// ── Cask 모델 전체 ────────────────────────────────────────
function CaskModel({ layers, wireframe, autoRotate }) {
  const groupRef = useRef();
  useFrame(() => {
    if (autoRotate && groupRef.current) groupRef.current.rotation.y += 0.004;
  });

  if (!layers.length) {
    // 기본 플레이스홀더
    return (
      <group ref={groupRef}>
        {[
          { r: 2.2, h: 6, color: theme.ac },
          { r: 1.6, h: 6, color: theme.tl },
          { r: 0.9, h: 6, color: theme.am },
        ].map((l, i) => (
          <CaskLayer key={i} layer={l} index={i} wireframe={wireframe} totalLayers={3} />
        ))}
        <axesHelper args={[3]} />
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      {layers.map((l, i) =>
        l.type === 'SPH' || l.type === 'SO'
          ? <SphLayer key={i} layer={l} wireframe={wireframe} />
          : <CaskLayer key={i} layer={l} index={i} wireframe={wireframe} totalLayers={layers.length} />
      )}
      <axesHelper args={[Math.max(...layers.map(l => l.r), 1) * 1.5]} />
    </group>
  );
}

// ── 레이어 범례 ───────────────────────────────────────────
function LayerLegend({ layers }) {
  if (!layers.length) return null;
  return (
    <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {layers.map((l, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: theme.tx2 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
          <span style={{ color: l.color, fontWeight: 600 }}>{l.label}</span>
          {l.rawR && <span style={{ color: theme.tx3 }}>r={l.rawR}cm h={l.rawH?.toFixed(0)}cm</span>}
        </div>
      ))}
    </div>
  );
}

// ── Chat 스타일 ───────────────────────────────────────────
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
  padding: 6px 9px;
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
  flex-shrink: 0;
  &:hover { background: ${theme.ac2}; }
`;
const ApplyBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
  padding: 2px 7px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 600;
  cursor: pointer;
  background: rgba(40,201,154,0.1);
  border: 1px solid ${theme.gn};
  color: ${theme.gn};
`;

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function ViewerChat({ onApply }) {
  const [msgs, setMsgs] = useState([
    { id: 0, user: false, text: 'MCNP 설계를 도와드립니다. 셀 구성, 재질, LAT 설정 등 질문하세요.' }
  ]);
  const [input, setInput] = useState('');
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rendered, setRendered] = useState(false);
  const { cells, surfaces, materials } = useMCNPStore();

  const [renderedLayers, setRenderedLayers] = useState([]);

  const handleRender = () => {
    const layers = buildCaskLayers(cells, surfaces, materials);
    setRenderedLayers(layers);
    setRendered(true);
  };

  const maxSize = renderedLayers.length
    ? Math.max(...renderedLayers.map(l => Math.max(l.r, l.h / 2)))
    : 3;
  const camDist = Math.max(maxSize * 3, 6);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    const id = Date.now();
    setMsgs(m => [...m, { id, user: true, text: t }]);
    setInput('');
    setTimeout(() => {
      setMsgs(m => [...m, {
        id: id + 1, user: false,
        text: 'MCNP 매뉴얼 참조 중... (RAG 연동 시 실제 답변)',
        hasApply: true, // 버튼 표시 테스트용
      }]);
    }, 700);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderLeft: `1px solid ${theme.bd}` }}>
      <ColHeader>
        <ColTitle>3D 시각화 / 챗봇</ColTitle>
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
        {/* 3D Viewer */}
        <div style={{ height: 220, flexShrink: 0, borderRadius: 5, overflow: 'hidden', border: `1px solid ${theme.bd}`, background: 'radial-gradient(ellipse at 50% 40%, #0c1422, #090c12)', position: 'relative' }}>
          <Canvas
            camera={{ position: [camDist * 0.6, camDist * 0.5, camDist], fov: 45 }}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 20, 10]} intensity={1.2} />
            <pointLight position={[-8, -8, -8]} intensity={0.4} color={theme.ac} />
            <pointLight position={[8, 8, 8]} intensity={0.3} color={theme.tl} />
            <CaskModel layers={rendered ? renderedLayers : []} wireframe={wireframe} autoRotate={autoRotate} />
            <OrbitControls enablePan={false} />
            <gridHelper args={[camDist * 2, 10, '#1a2040', '#1a2040']} />
          </Canvas>

          {!rendered && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 10, color: theme.tx3, textAlign: 'center' }}>
                셀·서페이스 입력 후<br />렌더링 버튼 클릭
              </div>
            </div>
          )}

          {rendered && <LayerLegend layers={renderedLayers} />}

          {rendered && renderedLayers.length > 0 && (
            <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, color: theme.tx3, lineHeight: 1.6 }}>
              {renderedLayers.map((l, i) => (
                <div key={i}>셀{i + 1}: {l.surfType || 'RCC'} r={l.rawR || '?'}cm</div>
              ))}
            </div>
          )}
        </div>

        {/* Chat */}
        <ChatWrap>
          <ChatHd><PulseDot />설계 도우미 (RAG 연동)</ChatHd>
          <ChatMsgs>
            {msgs.map(m => (
              <div key={m.id} style={{ alignSelf: m.user ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                <Msg $user={m.user}>{m.text}</Msg>
                {m.hasApply && <ApplyBtn onClick={onApply}>⟳ GUI에 적용</ApplyBtn>}
              </div>
            ))}
          </ChatMsgs>
          <ChatInputRow>
            <ChatInput
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="예) Co-60 차폐 납 두께는?"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <SendBtn onClick={send}>↑</SendBtn>
          </ChatInputRow>
        </ChatWrap>
      </div>
    </div>
  );
}