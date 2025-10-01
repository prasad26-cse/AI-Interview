import React from 'react';
import { Modal, Button, Space } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setShowWelcomeBack } from '@/store/slices/uiSlice';
import { deleteSession } from '@/store/slices/sessionsSlice';

export const WelcomeBackModal: React.FC = () => {
  const dispatch = useDispatch();
  const { showWelcomeBack, activeTab } = useSelector((state: RootState) => state.ui);
  const { currentSessionId, sessions } = useSelector((state: RootState) => state.sessions);

  const currentSession = currentSessionId ? sessions[currentSessionId] : null;

  const handleResume = () => {
    dispatch(setShowWelcomeBack(false));
  };

  const handleStartOver = () => {
    if (currentSessionId) {
      dispatch(deleteSession(currentSessionId));
    }
    dispatch(setShowWelcomeBack(false));
  };

  // Don't show modal if:
  // 1. No current session or session is completed
  // 2. User is already on the interviewee tab (actively interviewing)
  if (!currentSession || currentSession.status === 'completed' || activeTab === 'interviewee') {
    return null;
  }

  return (
    <Modal
      title="Welcome Back!"
      open={showWelcomeBack}
      closable={false}
      footer={null}
    >
      <p>You have an unfinished interview session.</p>
      <p>
        <strong>Progress:</strong> Question {currentSession.currentIndex + 1} of{' '}
        {currentSession.questions.length}
      </p>
      <Space style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleResume}>
          Resume Interview
        </Button>
        <Button danger onClick={handleStartOver}>
          Start Over
        </Button>
      </Space>
    </Modal>
  );
};
