import { ThemeProvider } from 'styled-components';
import { GlobalStyle, theme } from '@/theme';
import Topbar from '@/components/Topbar';
import Tab1 from '@/components/tab1/Tab1';
import Tab2 from '@/components/tab2/Tab2';
import { useMCNPStore } from '@/store/mcnpStore';
import styled from 'styled-components';

const AppShell = styled.div`
  display: grid;
  grid-template-rows: 44px 1fr;
  height: 100vh;
  overflow: hidden;
`;

const PageWrap = styled.div`
  display: ${p => p.$show ? 'flex' : 'none'};
  height: 100%;
  overflow: hidden;
`;

export default function App() {
  const activeTab = useMCNPStore(s => s.activeTab);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppShell>
        <Topbar />
        <PageWrap $show={activeTab === 1}><Tab1 /></PageWrap>
        <PageWrap $show={activeTab === 2}><Tab2 /></PageWrap>
      </AppShell>
    </ThemeProvider>
  );
}
