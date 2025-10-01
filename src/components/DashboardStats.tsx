import React from 'react';
import { Card, Row, Col, Statistic, Progress, List, Tag, Typography } from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Session, Candidate } from '@/types';

const { Text } = Typography;

interface DashboardStatsProps {
  candidates: Record<string, Candidate>;
  sessions: Record<string, Session>;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ candidates, sessions }) => {
  // Calculate statistics
  const totalCandidates = Object.keys(candidates).length;
  const completedSessions = Object.values(sessions).filter(s => s.status === 'completed').length;
  const inProgressSessions = Object.values(sessions).filter(s => s.status === 'in_progress').length;
  
  const completedScores = Object.values(sessions)
    .filter(s => s.status === 'completed' && s.finalScore)
    .map(s => s.finalScore!);
  
  const averageScore = completedScores.length > 0
    ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)
    : 0;
  
  // Dynamic pass rate calculation based on actual scores
  const passThreshold = 60; // Can be adjusted
  const passedCount = completedScores.filter(s => s >= passThreshold).length;
  const failedCount = completedScores.filter(s => s < passThreshold).length;
  const passRate = completedScores.length > 0
    ? Math.round((passedCount / completedScores.length) * 100)
    : 0;

  // Score categories
  const excellentCount = completedScores.filter(s => s >= 80).length;
  const goodCount = completedScores.filter(s => s >= 60 && s < 80).length;
  const averageCount = completedScores.filter(s => s >= 40 && s < 60).length;
  const poorCount = completedScores.filter(s => s < 40).length;

  const topScore = completedScores.length > 0 ? Math.max(...completedScores) : 0;
  const lowestScore = completedScores.length > 0 ? Math.min(...completedScores) : 0;

  // Get recent submissions (last 5 completed interviews)
  const recentSubmissions = Object.values(sessions)
    .filter(s => s.status === 'completed')
    .map(session => {
      const candidate = candidates[session.candidateId];
      return {
        session,
        candidate,
      };
    })
    .sort((a, b) => new Date(b.session.updatedAt).getTime() - new Date(a.session.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        {/* Total Candidates */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="stat-card"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
            }}
            hoverable
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Total Candidates</span>}
              value={totalCandidates}
              prefix={<UserOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        {/* Completed Interviews */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="stat-card"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease',
            }}
            hoverable
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Completed</span>}
              value={completedSessions}
              prefix={<CheckCircleOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        {/* In Progress */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="stat-card"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.3s ease',
            }}
            hoverable
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>In Progress</span>}
              value={inProgressSessions}
              prefix={<ClockCircleOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        {/* Top Score */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="stat-card"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.3s ease',
            }}
            hoverable
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Top Score</span>}
              value={topScore}
              suffix="/100"
              prefix={<TrophyOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Second Row - Performance Metrics */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                📊 Average Score
              </span>
            }
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <Statistic
              value={averageScore}
              suffix="/100"
              valueStyle={{
                color: averageScore >= 70 ? '#10b981' : averageScore >= 50 ? '#f59e0b' : '#ef4444',
                fontSize: 36,
                fontWeight: 'bold',
              }}
              prefix={
                averageScore >= 70 ? (
                  <RiseOutlined style={{ color: '#10b981' }} />
                ) : (
                  <FallOutlined style={{ color: '#ef4444' }} />
                )
              }
            />
            <Progress
              percent={averageScore}
              strokeColor={{
                '0%': averageScore >= 70 ? '#10b981' : averageScore >= 50 ? '#f59e0b' : '#ef4444',
                '100%': averageScore >= 70 ? '#059669' : averageScore >= 50 ? '#d97706' : '#dc2626',
              }}
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                ✅ Pass Rate (Dynamic)
              </span>
            }
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <Statistic
              value={passRate}
              suffix="%"
              valueStyle={{
                color: passRate >= 70 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444',
                fontSize: 36,
                fontWeight: 'bold',
              }}
              prefix={<CheckCircleOutlined />}
            />
            <Progress
              percent={passRate}
              strokeColor={{
                '0%': passRate >= 70 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444',
                '100%': passRate >= 70 ? '#059669' : passRate >= 50 ? '#d97706' : '#dc2626',
              }}
              style={{ marginTop: 16 }}
            />
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#10b981', fontWeight: 500 }}>✅ Passed: {passedCount}</span>
                <span style={{ color: '#ef4444', fontWeight: 500 }}>❌ Failed: {failedCount}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ marginBottom: 4 }}>🌟 Excellent (≥80): <strong>{excellentCount}</strong></div>
                <div style={{ marginBottom: 4 }}>👍 Good (60-79): <strong>{goodCount}</strong></div>
                <div style={{ marginBottom: 4 }}>📊 Average (40-59): <strong>{averageCount}</strong></div>
                <div>📉 Poor (&lt;40): <strong>{poorCount}</strong></div>
              </div>
              <p style={{ marginTop: 12, color: '#64748b', fontSize: 12, textAlign: 'center' }}>
                Pass threshold: ≥{passThreshold}% | Range: {lowestScore}-{topScore}
              </p>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card
              title={
                <span style={{ fontSize: 16, fontWeight: 600 }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  📅 Recent Submissions
                </span>
              }
              style={{
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            >
              <List
                dataSource={recentSubmissions}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      padding: '16px',
                      borderRadius: 8,
                      marginBottom: 8,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Text strong style={{ fontSize: 16 }}>
                            {item.candidate?.name || 'Unknown Candidate'}
                          </Text>
                          <Tag
                            color={
                              (item.session.finalScore || 0) >= 70
                                ? 'green'
                                : (item.session.finalScore || 0) >= 50
                                ? 'orange'
                                : 'red'
                            }
                          >
                            {item.session.finalScore || 0}/100
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Text type="secondary">
                            📧 {item.candidate?.email || 'No email'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            🕒 Submitted: {new Date(item.session.updatedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}

      <style>{`
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.15) !important;
        }
      `}</style>
    </div>
  );
};
