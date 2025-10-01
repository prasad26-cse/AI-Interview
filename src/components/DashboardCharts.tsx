import React from 'react';
import { Card, Row, Col, Empty } from 'antd';
import { Session, Candidate } from '@/types';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardChartsProps {
  candidates: Record<string, Candidate>;
  sessions: Record<string, Session>;
}

// Color palette for charts
// const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ sessions }) => {
  // Score Distribution Data
  const scoreRanges = [
    { range: '0-20', min: 0, max: 20, count: 0, color: '#ef4444' },
    { range: '21-40', min: 21, max: 40, count: 0, color: '#f59e0b' },
    { range: '41-60', min: 41, max: 60, count: 0, color: '#f59e0b' },
    { range: '61-80', min: 61, max: 80, count: 0, color: '#10b981' },
    { range: '81-100', min: 81, max: 100, count: 0, color: '#059669' },
  ];

  Object.values(sessions)
    .filter(s => s.status === 'completed' && s.finalScore)
    .forEach(session => {
      const score = session.finalScore!;
      const range = scoreRanges.find(r => score >= r.min && score <= r.max);
      if (range) range.count++;
    });

  // Status Distribution
  const statusData = [
    { name: 'Completed', value: Object.values(sessions).filter(s => s.status === 'completed').length, color: '#10b981' },
    { name: 'In Progress', value: Object.values(sessions).filter(s => s.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'Paused', value: Object.values(sessions).filter(s => s.status === 'paused').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Difficulty Performance
  const difficultyData = [
    { difficulty: 'Easy', avgScore: 0, count: 0 },
    { difficulty: 'Medium', avgScore: 0, count: 0 },
    { difficulty: 'Hard', avgScore: 0, count: 0 },
  ];

  Object.values(sessions)
    .filter(s => s.status === 'completed')
    .forEach(session => {
      session.questions.forEach((question, idx) => {
        const answer = session.answers[idx];
        if (answer && answer.llmScore) {
          const diffData = difficultyData.find(d => d.difficulty.toLowerCase() === question.difficulty);
          if (diffData) {
            diffData.avgScore += answer.llmScore;
            diffData.count++;
          }
        }
      });
    });

  difficultyData.forEach(d => {
    if (d.count > 0) {
      d.avgScore = Math.round((d.avgScore / d.count) * 10) / 10;
    }
  });

  // Recent Interviews Timeline
  const recentInterviews = Object.values(sessions)
    .filter(s => s.status === 'completed' && s.finalScore)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-10)
    .map((session, idx) => ({
      name: `#${idx + 1}`,
      score: session.finalScore,
      date: new Date(session.createdAt).toLocaleDateString(),
    }));

  const hasData = Object.keys(sessions).length > 0;

  if (!hasData) {
    return (
      <Card style={{ borderRadius: 16, marginBottom: 24 }}>
        <Empty description="No interview data available yet" />
      </Card>
    );
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        {/* Score Distribution */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                📊 Score Distribution
              </span>
            }
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreRanges}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {scoreRanges.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Status Distribution */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                🎯 Interview Status
              </span>
            }
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Difficulty Performance */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                🎓 Performance by Difficulty
              </span>
            }
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="difficulty" stroke="#64748b" />
                <YAxis domain={[0, 10]} stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar dataKey="avgScore" fill="#667eea" name="Average Score (out of 10)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Recent Interviews Trend */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                📈 Recent Interview Scores
              </span>
            }
            style={{
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            {recentInterviews.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={recentInterviews}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis domain={[0, 100]} stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#667eea"
                    strokeWidth={3}
                    dot={{ fill: '#667eea', r: 6 }}
                    activeDot={{ r: 8 }}
                    name="Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No completed interviews yet" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
