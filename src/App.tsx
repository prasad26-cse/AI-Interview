import React, { useEffect, useState } from 'react';
import { Layout, Tabs, App as AntApp, Badge } from 'antd';
import { 
  RobotOutlined, 
  UserOutlined, 
  DashboardOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setActiveTab, setShowWelcomeBack } from '@/store/slices/uiSlice';
import { logout } from '@/store/slices/authSlice';
import { IntervieweePage } from '@/pages/IntervieweePage';
import { InterviewerPage } from '@/pages/InterviewerPage';
import { AboutPage } from '@/pages/AboutPage';
import { PricingPage } from '@/pages/PricingPage';
import { ContactPage } from '@/pages/ContactPage';
import { WelcomeBackModal } from '@/components/WelcomeBackModal';
import { LoginModal } from '@/components/LoginModal';
import { FeaturesSection } from '@/components/FeaturesSection';
import { StatsSection } from '@/components/StatsSection';
import { EnhancedFooter } from '@/components/EnhancedFooter';

const { Header, Content } = Layout;

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const { activeTab } = useSelector((state: RootState) => state.ui);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { sessions, currentSessionId } = useSelector((state: RootState) => state.sessions);

  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // API key is hardcoded - no initialization needed
    console.log('✅ Hugging Face API is ready (hardcoded key)');

    // Check for unfinished sessions ONLY on initial load
    // Don't show modal if user is already on interviewee tab (actively interviewing)
    if (currentSessionId && activeTab !== 'interviewee') {
      const session = sessions[currentSessionId];
      if (session && session.status === 'in_progress') {
        dispatch(setShowWelcomeBack(true));
      }
    }
  }, [currentSessionId, dispatch, sessions, activeTab]);

  const handleTabChange = (key: string) => {
    // If trying to access dashboard, always require authentication
    if (key === 'interviewer') {
      if (!isAuthenticated) {
        setShowLogin(true);
        return;
      }
      // Switch to dashboard
      dispatch(setActiveTab('interviewer'));
    } else if (key === 'interviewee') {
      // RESET INTERVIEWEE TAB - Clear all previous data for fresh start
      console.log('🔄 Switching to Interviewee tab - Resetting all data...');
      
      // Clear current session to force fresh start
      if (currentSessionId) {
        // Don't show welcome back modal
        dispatch(setShowWelcomeBack(false));
      }
      
      // When leaving dashboard, logout to require auth next time
      if (activeTab === 'interviewer' && isAuthenticated) {
        dispatch(logout());
      }
      
      // Switch to interviewee tab
      dispatch(setActiveTab('interviewee'));
      
      console.log('✅ Interviewee tab ready for new interview');
    } else {
      // When leaving dashboard, logout to require auth next time
      if (activeTab === 'interviewer' && isAuthenticated) {
        dispatch(logout());
      }
      // Switch to other tab
      dispatch(setActiveTab(key as 'interviewee' | 'interviewer'));
    }
  };

  const handleLoginSuccess = () => {
    // Redirect to dashboard after successful login
    dispatch(setActiveTab('interviewer'));
  };

  const completedCount = Object.values(sessions).filter(s => s.status === 'completed').length;

  const tabItems = [
    {
      key: 'interviewee',
      label: (
        <span className="slide-down">
          <UserOutlined style={{ marginRight: 8 }} />
          Interviewee
        </span>
      ),
      children: <IntervieweePage />,
    },
    {
      key: 'interviewer',
      label: (
        <Badge count={completedCount} offset={[10, 0]}>
          <span className="slide-down">
            <DashboardOutlined style={{ marginRight: 8 }} />
            Dashboard
          </span>
        </Badge>
      ),
      children: isAuthenticated ? <InterviewerPage /> : <div style={{ padding: 24 }}>Please login to access the dashboard.</div>,
    },
    {
      key: 'about',
      label: 'About',
      children: <AboutPage />,
    },
    {
      key: 'pricing',
      label: 'Pricing',
      children: <PricingPage />,
    },
    {
      key: 'contact',
      label: 'Contact',
      children: <ContactPage />,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Header
        className="fade-in"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '0 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
          height: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            className="float"
            style={{
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            }}
          >
            <RobotOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI Interview Assistant
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              <ThunderboltOutlined style={{ marginRight: 4 }} />
              Powered by Hugging Face AI
            </p>
          </div>
        </div>
        {/* Settings button removed - API key is hardcoded */}
      </Header>
      <Content style={{ background: 'transparent', minHeight: 'calc(100vh - 80px)' }}>
        <div className="slide-up" style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
          {/* Stats Section */}
          {activeTab === 'interviewer' && isAuthenticated && <StatsSection />}
          
          {/* Main Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            size="large"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 16,
              padding: '16px 24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}
          />
        </div>

        {/* Features Section - Show on interviewee tab */}
        {activeTab === 'interviewee' && <FeaturesSection />}
      </Content>
      
      {/* Enhanced Footer */}
      <EnhancedFooter onNavigate={(key) => dispatch(setActiveTab(key as 'interviewee' | 'interviewer'))} />

      <WelcomeBackModal />
      <LoginModal 
        visible={showLogin} 
        onClose={() => setShowLogin(false)} 
        onLoginSuccess={handleLoginSuccess}
      />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AntApp>
      <AppContent />
    </AntApp>
  );
};

export default App;
