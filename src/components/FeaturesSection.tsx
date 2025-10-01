import React from 'react';
import { Card, Row, Col } from 'antd';
import {
  RobotOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  LineChartOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';

const features = [
  {
    icon: <RobotOutlined />,
    title: 'AI-Powered Assessment',
    description: 'Advanced OpenAI GPT evaluates answers with human-like understanding',
    color: '#667eea',
  },
  {
    icon: <VideoCameraOutlined />,
    title: 'Video Recording',
    description: 'Capture candidate responses with audio and video for comprehensive review',
    color: '#10b981',
  },
  {
    icon: <ClockCircleOutlined />,
    title: 'Timed Questions',
    description: 'Adaptive timing based on difficulty level ensures fair assessment',
    color: '#f59e0b',
  },
  {
    icon: <SafetyOutlined />,
    title: 'Secure & Private',
    description: 'All data stored locally with enterprise-grade security',
    color: '#ef4444',
  },
  {
    icon: <ThunderboltOutlined />,
    title: 'Real-time Grading',
    description: 'Instant AI feedback and scoring for immediate insights',
    color: '#8b5cf6',
  },
  {
    icon: <TrophyOutlined />,
    title: 'Smart Ranking',
    description: 'Automatic candidate ranking based on performance metrics',
    color: '#f59e0b',
  },
  {
    icon: <LineChartOutlined />,
    title: 'Analytics Dashboard',
    description: 'Comprehensive insights and performance analytics',
    color: '#3b82f6',
  },
  {
    icon: <CloudServerOutlined />,
    title: 'Persistent Storage',
    description: 'Resume interrupted sessions anytime with auto-save',
    color: '#10b981',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <div style={{ padding: '60px 24px', background: 'rgba(255, 255, 255, 0.5)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2
            className="slide-up"
            style={{
              fontSize: 36,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 16,
            }}
          >
            Powerful Features
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
            Everything you need to conduct professional AI-powered interviews
          </p>
        </div>

        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                className="fade-in"
                style={{
                  height: '100%',
                  borderRadius: 16,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                hoverable
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${feature.color}22 0%, ${feature.color}44 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <span style={{ fontSize: 28, color: feature.color }}>{feature.icon}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#1e293b' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                  {feature.description}
                </p>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};
