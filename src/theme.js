import styled, { createGlobalStyle, css } from 'styled-components';

export const theme = {
  bg:    '#090c12',
  bg2:   '#111520',
  bg3:   '#171c2a',
  bg4:   '#1d2235',
  bd:    '#222840',
  bd2:   '#2e3650',
  tx:    '#d8dff0',
  tx2:   '#7a85a0',
  tx3:   '#3e4560',
  ac:    '#4f7fff',
  ac2:   '#3058cc',
  acg:   'rgba(79,127,255,0.1)',
  gn:    '#28c99a',
  am:    '#f0a020',
  rd:    '#d94f4f',
  pu:    '#9b7ef8',
  tl:    '#1ec8e0',
  co:    '#f56a5a',
  mn:    "'Courier New', monospace",
  sf:    'system-ui, -apple-system, sans-serif',
};

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: ${theme.bg};
    color: ${theme.tx};
    font-family: ${theme.sf};
    font-size: 12px;
    height: 100vh;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${theme.bd2}; border-radius: 2px; }
  * { scrollbar-width: thin; scrollbar-color: ${theme.bd2} transparent; }
`;

// ── Common Input ──────────────────────────────────────────
export const inputBase = css`
  background: ${theme.bg4};
  border: 1px solid ${theme.bd2};
  border-radius: 3px;
  color: ${theme.tx};
  font-family: ${theme.mn};
  font-size: 11px;
  padding: 3px 5px;
  outline: none;
  transition: border-color 0.15s;
  &:focus { border-color: ${theme.ac}; }
`;

export const Input = styled.input`
  ${inputBase}
  width: ${p => p.$w || '52px'};
`;

export const Select = styled.select`
  ${inputBase}
  cursor: pointer;
  width: ${p => p.$w || 'auto'};
`;

export const Textarea = styled.textarea`
  ${inputBase}
  width: 100%;
  resize: vertical;
  line-height: 1.5;
  font-size: 9px;
`;

// ── Buttons ───────────────────────────────────────────────
export const Btn = styled.button`
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  ${p => p.$variant === 'primary' && css`background: ${theme.ac}; color: #fff; &:hover { background: ${theme.ac2}; }`}
  ${p => p.$variant === 'ghost'   && css`background: ${theme.bg3}; border: 1px solid ${theme.bd2}; color: ${theme.tx2}; &:hover { border-color: ${theme.ac}; color: ${theme.ac}; }`}
  ${p => p.$variant === 'green'   && css`background: rgba(40,201,154,0.1); border: 1px solid ${theme.gn}; color: ${theme.gn}; &:hover { background: rgba(40,201,154,0.2); }`}
  ${p => p.$variant === 'detail'  && css`background: none; border: 1px solid ${theme.bd2}; color: ${theme.tx3}; font-size: 8px; letter-spacing: 0.4px; &:hover { border-color: ${theme.ac}; color: ${theme.ac}; }`}
  ${p => p.$variant === 'add'     && css`width: 100%; padding: 5px; border: 1px dashed ${theme.bd2}; border-radius: 5px; background: none; color: ${theme.tx3}; font-size: 10px; text-align: center; &:hover { border-color: ${theme.ac}; color: ${theme.ac}; background: ${theme.acg}; }`}
  ${p => p.$variant === 'del'     && css`width: 18px; height: 18px; background: none; color: ${theme.tx3}; font-size: 11px; border-radius: 3px; display: flex; align-items: center; justify-content: center; padding: 0; &:hover { background: rgba(217,79,79,0.15); color: ${theme.rd}; }`}
`;

// ── Card ──────────────────────────────────────────────────
export const CardWrap = styled.div`
  background: ${theme.bg2};
  border: 1px solid ${theme.bd};
  border-radius: 9px;
  overflow: hidden;
  flex-shrink: 0;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  background: ${theme.bg3};
  border-bottom: ${p => p.$collapsed ? 'none' : `1px solid ${theme.bd}`};
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
  &:hover { background: ${theme.bg4}; }
`;

export const CardBody = styled.div`
  padding: 8px 10px;
  display: ${p => p.$hidden ? 'none' : 'flex'};
  flex-direction: column;
  gap: 6px;
`;

export const Badge = styled.span`
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.7px;
  padding: 2px 5px;
  border-radius: 3px;
  flex-shrink: 0;
  background: ${p => ({
    TITLE: 'rgba(40,201,154,0.15)', CELL: 'rgba(79,127,255,0.15)',
    SURF:  'rgba(30,200,224,0.15)', DATA: 'rgba(40,201,154,0.15)',
    SDEF:  'rgba(245,166,35,0.15)', TALLY:'rgba(155,126,248,0.15)',
    FMESH: 'rgba(245,106,90,0.15)', IMP:  'rgba(79,127,255,0.15)',
  })[p.$type] || 'rgba(90,98,120,0.3)'};
  color: ${p => ({
    TITLE: theme.gn, CELL: theme.ac, SURF: theme.tl, DATA: theme.gn,
    SDEF: theme.am, TALLY: theme.pu, FMESH: theme.co, IMP: theme.ac,
  })[p.$type] || theme.tx2};
`;

export const Chevron = styled.span`
  font-size: 9px;
  color: ${theme.tx3};
  transition: transform 0.2s;
  transform: ${p => p.$open ? 'rotate(90deg)' : 'rotate(0deg)'};
  flex-shrink: 0;
`;

// ── Row Item ──────────────────────────────────────────────
export const RowItem = styled.div`
  background: ${theme.bg3};
  border: 1px solid ${theme.bd};
  border-radius: 5px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

export const RowHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const NumBadge = styled.div`
  width: 18px;
  height: 18px;
  background: ${theme.bg4};
  border: 1px solid ${theme.bd2};
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: ${p => p.$color || theme.ac};
  flex-shrink: 0;
`;

// ── Row ───────────────────────────────────────────────────
export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
`;

export const Label = styled.span`
  font-size: 9px;
  color: ${theme.tx3};
  white-space: nowrap;
`;

export const Info = styled.div`
  font-size: 9px;
  color: ${theme.tx3};
  padding: 3px 6px;
  background: ${theme.bg3};
  border-left: 2px solid ${theme.bd2};
  border-radius: 0 3px 3px 0;
  line-height: 1.5;
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0;
  & span {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: ${theme.tx3};
    white-space: nowrap;
  }
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${theme.bd};
  }
`;

// ── Mode Chip ─────────────────────────────────────────────
export const ModeChip = styled.div`
  padding: 3px 9px;
  border-radius: 3px;
  border: 1px solid ${p => p.$on ? theme.tl : theme.bd2};
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  color: ${p => p.$on ? theme.tl : theme.tx2};
  background: ${p => p.$on ? 'rgba(30,200,224,0.08)' : 'none'};
  transition: all 0.15s;
`;

// ── Dot ──────────────────────────────────────────────────
export const PulseDot = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${theme.gn};
  animation: pulse 2s infinite;
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
`;

// ── Col / Panel layout ────────────────────────────────────
export const ColHeader = styled.div`
  height: 36px;
  padding: 0 11px;
  background: ${theme.bg2};
  border-bottom: 1px solid ${theme.bd};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

export const ColTitle = styled.span`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: ${theme.tx2};
`;

export const ColScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 9px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
