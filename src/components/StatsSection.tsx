import React from 'react';
import { Row, Col, Statistic } from 'antd';
import { UserOutlined, CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export const StatsSection: React.FC = () => {
  const { candidates } = useSelector((state: RootState) => state.candidates);
  const { sessions } = useSelector((state: RootState) => state.sessions);

  const totalCandidates = Object.keys(candidates).length;
  const completedInterviews = Object.values(sessions).filter(s => s.status === 'completed').length;
  const inProgressInterviews = Object.values(sessions).filter(s => s.status === 'in_progress').length;
  const avgScore = Object.values(sessions)
    .filter(s => s.finalScore)
    .reduce((sum, s) => sum + (s.finalScore || 0), 0) / (completedInterviews || 1);

  const stats = [
    {
      title: 'Total Candidates',
      value: totalCandidates,
      icon: <UserOutlined />,
      color: '#667eea',
    },
    {
      title: 'Completed',
      value: completedInterviews,
      icon: <CheckCircleOutlined />,
      color: '#10b981',
    },
    {
      title: 'In Progress',
      value: inProgressInterviews,
      icon: <ClockCircleOutlined />,
      color: '#f59e0b',
    },
    {
      title: 'Avg Score',
      value: Math.round(avgScore),
      suffix: '/100',
      icon: <TrophyOutlined />,
      color: '#8b5cf6',
    },
  ];

  return (
    <div
      className="slide-up"
      style={{
        padding: '40px 24px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        borderRadius: 16,
        marginBottom: 24,
      }}
    >
      <Row gutter={[24, 24]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 12,
                padding: 24,
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  color: stat.color,
                  marginBottom: 12,
                }}
              >
                {stat.icon}
              </div>
              <Statistic
                title={<span style={{ color: '#64748b', fontSize: 14 }}>{stat.title}</span>}
                value={stat.value}
                suffix={stat.suffix}
                valueStyle={{ color: stat.color, fontWeight: 700, fontSize: 32 }}
              />
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};
