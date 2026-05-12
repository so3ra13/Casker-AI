import { useRef, useState } from 'react';
import styled from 'styled-components';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { theme, ColHeader, ColTitle, Btn, PulseDot } from '@/theme';
import { useMCNPStore } from '@/store/mcnpStore';
import { buildCaskLayers } from '@/utils/buildCaskLayers';
import { parseMCNP } from '@/utils/parser';
import { SURF_PARAMS } from '@/utils/constants';

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
  flex-shrink: 0;
  &:hover { background: ${theme.bg4}; color: ${theme.tx}; border-color: ${theme.bd}; }
`;
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;
const ModalBox = styled.div`
  pointer-events: all;
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

  code {
    font-family: ${theme.mn};
    font-size: 10px;
    background: #0d1117;
    color: #79c0ff;
    padding: 0 4px;
    border-radius: 3px;
  }
  pre {
    margin: 8px 0;
    padding: 10px 14px;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    overflow-x: auto;
    font-family: ${theme.mn};
    font-size: 10.5px;
    color: #e6edf3;
    line-height: 1.6;
    white-space: pre;
  }
  strong { color: #79c0ff; font-weight: 700; }
  p { margin: 4px 0; }
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

// codeGen.js의 padKey와 동일한 변환 (subscript→'0', non-alphanum→'_')
function padKey(p) {
  return p.replace(/[₀¹²³]/g, '0').replace(/[^a-zA-Z0-9]/g, '_');
}

// parser.js가 사용하는 params 키 순서 (SURF_PARAMS의 표시 라벨과 1:1 매핑)
const PARSER_PARAM_KEYS = {
  RCC: ['x_0','y_0','z_0','vx','vy','vz','r'],
  RPP: ['xmin','xmax','ymin','ymax','zmin','zmax'],
  SPH: ['x_0','y_0','z_0','r'],
  BOX: ['ax','ay','az','bx','by','bz','cx','cy','cz'],
  TRC: ['x_0','y_0','z_0','vx','vy','vz','r1','r2'],
  CX: ['r'], CY: ['r'], CZ: ['r'],
  SO: ['r'], SX: ['x_0','r'], SY: ['y_0','r'], SZ: ['z_0','r'],
  S:  ['x_0','y_0','z_0','r'],
  PX: ['d'], PY: ['d'], PZ: ['d'],
  GQ: ['A','B','C','D','E','F','G','H','J','K'],
};

// MCNP 코드 문자열 → 스토어 호환 데이터 변환
function codeToStoreData(code) {
  const parsed = parseMCNP(code);

  // 셀 변환
  const cells = parsed.parsedCells.map(c => ({
    id: c.id,
    type: c.type,                      // parser가 IMP값으로 정확히 판별한 타입 사용
    mat: c.mat || '',
    dens: c.mat ? c.dens : '',         // void/boundary 셀은 밀도 없음
    surf: c.surf || '',
    u: '', latType: '1', fillExpr: '',
  }));

  // 서페이스 변환: parser 키 → codeGen 키, 값 → String
  const surfaces = parsed.parsedSurfs.map(s => {
    const displayKeys = SURF_PARAMS[s.type] || [];   // ['x₀','y₀','z₀','vx','vy','vz','r']
    const parserKeys  = PARSER_PARAM_KEYS[s.type] || Object.keys(s.params);
    const params = {};
    displayKeys.forEach((dk, i) => {
      const storeKey  = padKey(dk);          // codeGen이 기대하는 키: 'x0','y0','z0'...
      const parserKey = parserKeys[i];       // parser가 저장한 키: 'x_0','y_0','z_0'...
      const val = s.params[parserKey];
      if (val !== undefined) params[storeKey] = String(val);
    });
    return { id: s.id, type: s.type, params };
  });

  // 재질 카드 파싱 (m<N> 라인)
  const matDens = {};
  parsed.parsedCells.forEach(c => { if (c.mat) matDens[c.mat] = c.dens; });

  const materials = [];
  const lines = code.split('\n');
  let sec = 0;
  let curMat = null;
  for (const raw of lines) {
    const l = raw.trim();
    if (l === '' && sec < 2) { sec++; continue; }
    if (sec < 2 || l.startsWith('c ') || l === 'c') continue;
    const mM = l.match(/^m(\d+)\s+(.*)/i);
    if (mM) {
      if (curMat) materials.push(curMat);
      const num = mM[1];
      curMat = { id: parseInt(num), key: 'custom', name: `재질 ${num}`, dens: matDens[num] || '', zaid: [] };
      const pairs = mM[2].trim().split(/\s+/);
      for (let i = 0; i + 1 < pairs.length; i += 2)
        curMat.zaid.push([pairs[i], pairs[i + 1], '']);
    } else if (curMat && /^\s{5,}/.test(raw)) {
      const pairs = l.split(/\s+/);
      for (let i = 0; i + 1 < pairs.length; i += 2)
        curMat.zaid.push([pairs[i], pairs[i + 1], '']);
    } else if (curMat) {
      materials.push(curMat);
      curMat = null;
    }
  }
  if (curMat) materials.push(curMat);

  // MODE
  const modeM = code.match(/^mode\s+(.+)/im);
  const modeTokens = (modeM ? modeM[1].trim().toUpperCase() : 'N').split(/\s+/);
  const modes = new Set(modeTokens.filter(p => ['N', 'P', 'E'].includes(p)));

  // NPS
  const npsM = code.match(/^nps\s+(\S+)/im);
  const nps = npsM ? npsM[1] : '1000000';

  return { title: parsed.title, cells, surfaces, materials, modes, nps };
}

export default function ViewerChat({ onApply }) {
  const [msgs, setMsgs]                     = useState([{ id: 0, user: false, text: 'MCNP 설계를 도와드립니다. 셀 구성, 재질, LAT 설정 등 질문하세요.' }]);
  const [input, setInput]                   = useState('');
  const [chatHistory, setChatHistory]       = useState([]);
  const [wireframe, setWireframe]           = useState(false);
  const [autoRotate, setAutoRotate]         = useState(true);
  const [rendered, setRendered]             = useState(false);
  const [renderedLayers, setRenderedLayers] = useState([]);
  const [expandedMsg, setExpandedMsg]       = useState(null);
  const [appliedId, setAppliedId]           = useState(null);

  const { cells, surfaces, materials, modes, nps, bulkLoad } = useMCNPStore();

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
          <ChatHd>
            <PulseDot />설계 도우미 (RAG 연동)
            <ExpandBtn
              title="채팅 전체 보기"
              onClick={() => setExpandedMsg(msgs.filter(m => !m.loading))}
            >⤢</ExpandBtn>
          </ChatHd>
          <ChatMsgs>
            {msgs.map(m => {
              const hasMCNP = !m.user && !m.loading && /```(?:mcnp)?[\s\S]*?```/i.test(m.text);
              const codeMatch = hasMCNP && m.text.match(/```(?:\w+)?\n?([\s\S]*?)```/);
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.user ? 'flex-end' : 'flex-start', gap: 3 }}>
                  <Msg $user={m.user}>
                    {m.user ? m.text : <MsgContent text={m.text} />}
                  </Msg>
                  {hasMCNP && (
                    <button
                      onClick={() => {
                        const code = codeMatch ? codeMatch[1] : '';
                        if (!code.trim()) return;
                        try {
                          const data = codeToStoreData(code);
                          bulkLoad(data);
                          setAppliedId(m.id);
                          setTimeout(() => setAppliedId(null), 2000);
                        } catch (e) {
                          console.error('적용 실패:', e);
                        }
                      }}
                      style={{
                        fontSize: 9, padding: '2px 8px', borderRadius: 4,
                        border: `1px solid ${appliedId === m.id ? theme.gn : theme.ac}`,
                        background: appliedId === m.id ? 'rgba(40,201,154,0.15)' : theme.acg,
                        color: appliedId === m.id ? theme.gn : theme.ac,
                        cursor: 'pointer', fontWeight: 600, letterSpacing: '0.3px',
                      }}
                    >
                      {appliedId === m.id ? '✅ 적용 완료' : '↩ 설계에 적용'}
                    </button>
                  )}
                </div>
              );
            })}
          </ChatMsgs>
          <ChatInputRow>
            <ChatInput rows={1} value={input} onChange={e => setInput(e.target.value)}
              placeholder="예) Co-60 차폐 납 두께는?"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
            <SendBtn onClick={send}>↑</SendBtn>
          </ChatInputRow>
        </ChatWrap>
      </div>

      {expandedMsg && (
        <ModalOverlay onClick={() => setExpandedMsg(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalHd>
              <PulseDot />
              <span style={{ fontSize: 9, fontWeight: 700, color: theme.tx2, letterSpacing: '0.4px' }}>
                채팅 전체 보기
              </span>
              <span style={{ fontSize: 8, color: theme.tx3, marginLeft: 4 }}>· 모서리를 드래그해 크기 조절</span>
              <button
                onClick={() => setExpandedMsg(null)}
                style={{
                  marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                  color: theme.tx3, fontSize: 14, lineHeight: 1, padding: '0 2px',
                }}
              >✕</button>
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
    </div>
  );
}
