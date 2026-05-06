import { useState, useRef, useEffect } from 'react';
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

const Box = styled.div`
  position: fixed;
  z-index: 999;
  background: ${theme.bg2};
  border: 1px solid ${theme.bd2};
  border-radius: 7px;
  padding: 10px 12px;
  max-width: 260px;
  min-width: 180px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  pointer-events: none;
`;

const Title = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: ${theme.tx};
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const Desc = styled.div`
  font-size: 9px;
  color: ${theme.tx2};
  line-height: 1.6;
`;

const Code = styled.div`
  font-family: ${theme.mn};
  font-size: 8.5px;
  color: ${theme.tl};
  background: ${theme.bg3};
  border: 1px solid ${theme.bd};
  border-radius: 4px;
  padding: 5px 7px;
  margin-top: 6px;
  line-height: 1.7;
  white-space: pre;
`;

const Divider = styled.div`
  height: 1px;
  background: ${theme.bd};
  margin: 6px 0;
`;

export default function Tooltip({ title, desc, code, badge, badgeColor }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef();

  const handleEnter = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    // 오른쪽에 공간이 있으면 오른쪽, 없으면 왼쪽
    const left = rect.right + 8 + 260 > window.innerWidth
      ? rect.left - 268
      : rect.right + 8;
    setPos({ top: rect.top, left });
    setVisible(true);
  };

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
      {visible && (
        <Box style={{ top: pos.top, left: pos.left }}>
          <Title>
            {badge && (
              <span style={{
                fontSize: 8, fontWeight: 700, padding: '1px 5px',
                borderRadius: 3, background: badgeColor || 'rgba(79,127,255,0.15)',
                color: badgeColor ? '#fff' : theme.ac, letterSpacing: '0.5px'
              }}>
                {badge}
              </span>
            )}
            {title}
          </Title>
          {desc && <Desc>{desc}</Desc>}
          {code && (
            <>
              <Divider />
              <Code>{code}</Code>
            </>
          )}
        </Box>
      )}
    </>
  );
}
