import styled from 'styled-components';
import { theme, Btn } from './theme';
import { useMCNPStore } from '@/store/mcnpStore';

const Bar = styled.div`
  height: 44px;
  background: ${theme.bg2};
  border-bottom: 1px solid ${theme.bd};
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 10px;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 700;
  font-size: 13px;
`;

const LogoIcon = styled.div`
  width: 24px;
  height: 24px;
  background: ${theme.ac};
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  color: #fff;
`;

const TabBtn = styled.button`
  padding: 4px 11px;
  border-radius: 5px;
  font-size: 11px;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  background: ${p => p.$active ? theme.ac : 'none'};
  color: ${p => p.$active ? '#fff' : theme.tx2};
  &:hover { background: ${p => p.$active ? theme.ac2 : theme.bg3}; color: ${p => p.$active ? '#fff' : theme.tx}; }
`;

const Avatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${theme.ac2};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
`;

export default function Topbar() {
  const { activeTab, setActiveTab } = useMCNPStore();

  return (
    <Bar>
      <Logo>
        <LogoIcon>SA</LogoIcon>
        ShieldingAI
      </Logo>
      <div style={{ display: 'flex', gap: 2, marginLeft: 10 }}>
        <TabBtn $active={activeTab === 1} onClick={() => setActiveTab(1)}>Design &amp; View</TabBtn>
        <TabBtn $active={activeTab === 2} onClick={() => setActiveTab(2)}>Optimization &amp; Validation</TabBtn>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: theme.tx2 }}>KR / EN</span>
        <Avatar>AD</Avatar>
      </div>
    </Bar>
  );
}
