import React from 'react';
import { Card, Row, Col, Timeline } from 'antd';
import { RocketOutlined, TeamOutlined, TrophyOutlined, GlobalOutlined } from '@ant-design/icons';

export const AboutPage: React.FC = () => {
  return (
    <div className="fade-in" style={{ padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 16,
            }}
          >
            About Us
          </h1>
          <p style={{ fontSize: 18, color: '#64748b', maxWidth: 700, margin: '0 auto' }}>
            Revolutionizing recruitment with AI-powered intelligent assessments
          </p>
        </div>

        {/* Mission & Vision */}
        <Row gutter={[32, 32]} style={{ marginBottom: 60 }}>
          <Col xs={24} md={12}>
            <Card
              className="slide-up"
              style={{
                height: '100%',
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <RocketOutlined style={{ fontSize: 32, color: '#fff' }} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1e293b' }}>Our Mission</h2>
              </div>
              <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.8, textAlign: 'center' }}>
                To transform the hiring process by leveraging cutting-edge AI technology, making interviews
                more efficient, fair, and insightful for both candidates and recruiters.
              </p>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              className="slide-up"
              style={{
                height: '100%',
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <GlobalOutlined style={{ fontSize: 32, color: '#fff' }} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1e293b' }}>Our Vision</h2>
              </div>
              <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.8, textAlign: 'center' }}>
                To become the world's leading AI interview platform, empowering organizations to make
                data-driven hiring decisions and helping candidates showcase their true potential.
              </p>
            </Card>
          </Col>
        </Row>

        {/* Company Journey */}
        <Card
          className="fade-in"
          style={{
            borderRadius: 16,
            border: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            marginBottom: 60,
          }}
        >
          <h2
            style={{
              fontSize: 32,
              fontWeight: 600,
              textAlign: 'center',
              marginBottom: 40,
              color: '#1e293b',
            }}
          >
            Our Journey
          </h2>
          <Timeline
            mode="alternate"
            items={[
              {
                children: (
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#667eea' }}>2024 - Foundation</h3>
                    <p style={{ color: '#64748b' }}>
                      Started with a vision to revolutionize recruitment using AI technology
                    </p>
                  </div>
                ),
              },
              {
                children: (
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#10b981' }}>2025 - Launch</h3>
                    <p style={{ color: '#64748b' }}>
                      Launched AI Interview Assistant with OpenAI GPT integration
                    </p>
                  </div>
                ),
              },
              {
                children: (
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f59e0b' }}>Future - Growth</h3>
                    <p style={{ color: '#64748b' }}>
                      Expanding globally with advanced features and enterprise solutions
                    </p>
                  </div>
                ),
              },
            ]}
          />
        </Card>

        {/* Core Values */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>
            Our Core Values
          </h2>
        </div>

        <Row gutter={[24, 24]}>
          {[
            {
              icon: <TeamOutlined />,
              title: 'Innovation',
              description: 'Constantly pushing boundaries with cutting-edge AI technology',
              color: '#667eea',
            },
            {
              icon: <TrophyOutlined />,
              title: 'Excellence',
              description: 'Committed to delivering the highest quality solutions',
              color: '#10b981',
            },
            {
              icon: <GlobalOutlined />,
              title: 'Integrity',
              description: 'Building trust through transparency and ethical practices',
              color: '#f59e0b',
            },
          ].map((value, index) => (
            <Col xs={24} md={8} key={index}>
              <Card
                className="slide-up"
                style={{
                  height: '100%',
                  borderRadius: 16,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: `${value.color}22`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <span style={{ fontSize: 28, color: value.color }}>{value.icon}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>
                  {value.title}
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{value.description}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};
