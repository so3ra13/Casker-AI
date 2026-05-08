import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { theme } from '@/theme';

const Btn = styled.button`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid ${theme.bd2};
  background: ${theme.bg4};
  color: ${theme.tx3};
  font-size: 8px;
  font-weight: 700;
  cursor: help;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
  transition: all 0.15s;
  &:hover {
    border-color: ${theme.ac};
    color: ${theme.ac};
    background: rgba(79,127,255,0.12);
  }
`;

const BOX_W = 272;
const BOX_H = 220;
const GAP   = 10;

export default function Tooltip({ title, desc, code, badge, badgeColor }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos]         = useState({ top: 0, left: 0 });
  const btnRef = useRef();

  const handleEnter = useCallback(() => {
    if (!title && !desc) return;
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 가로: 오른쪽 → 왼쪽 순으로 시도
    let left = rect.right + GAP;
    if (left + BOX_W > vw - 4) left = rect.left - BOX_W - GAP;
    left = Math.max(8, Math.min(left, vw - BOX_W - 8));

    // 세로: 버튼 상단 정렬, 아래 공간 부족 시 위로
    let top = rect.top;
    if (top + BOX_H > vh - 8) top = Math.max(8, vh - BOX_H - 8);

    setPos({ top, left });
    setVisible(true);
  }, [title, desc]);

  if (!title && !desc) return null;

  const box = visible ? (
    <div style={{
      position: 'fixed',
      top: pos.top,
      left: pos.left,
      zIndex: 999999,
      background: theme.bg2,
      border: `1px solid ${theme.bd2}`,
      borderRadius: 7,
      padding: '10px 12px',
      maxWidth: BOX_W,
      minWidth: 180,
      boxShadow: '0 8px 32px rgba(0,0,0,0.75)',
      pointerEvents: 'none',
    }}>
      {/* 제목 */}
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.tx, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
        {badge && (
          <span style={{
            fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
            background: badgeColor || 'rgba(79,127,255,0.18)',
            color: badgeColor ? '#fff' : theme.ac,
            letterSpacing: '0.5px', flexShrink: 0,
          }}>
            {badge}
          </span>
        )}
        {title}
      </div>
      {/* 설명 */}
      {desc && (
        <div style={{ fontSize: 9, color: theme.tx2, lineHeight: 1.65 }}>
          {desc}
        </div>
      )}
      {/* 코드 */}
      {code && (
        <>
          <div style={{ height: 1, background: theme.bd, margin: '6px 0' }} />
          <div style={{
            fontFamily: theme.mn, fontSize: 8.5, color: theme.tl,
            background: theme.bg3, border: `1px solid ${theme.bd}`,
            borderRadius: 4, padding: '5px 7px', lineHeight: 1.7,
            whiteSpace: 'pre', overflowX: 'auto',
          }}>
            {code}
          </div>
        </>
      )}
    </div>
  ) : null;

  return (
    <>
      <Btn
        ref={btnRef}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setVisible(false)}
        onClick={e => e.stopPropagation()}
      >
        ?
      </Btn>
      {createPortal(box, document.body)}
    </>
  );
}
