import React, { useState, useMemo } from 'react';
import { Table, Button, Input, Select, Drawer, Card, Tag, Space, Typography, App, Popconfirm, Tabs } from 'antd';
import { SearchOutlined, EyeOutlined, LogoutOutlined, DeleteOutlined, DashboardOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { deleteCandidate } from '@/store/slices/candidatesSlice';
import { deleteSession } from '@/store/slices/sessionsSlice';
import { getRecording, deleteRecording } from '@/utils/storage';
import { DashboardStats } from '@/components/DashboardStats';
import { DashboardCharts } from '@/components/DashboardCharts';

const { Title, Paragraph } = Typography;

export const InterviewerPage: React.FC = () => {
  const { message } = App.useApp();
  const dispatch = useDispatch();
  const { candidates } = useSelector((state: RootState) => state.candidates);
  const { sessions } = useSelector((state: RootState) => state.sessions);

  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const candidatesList = useMemo(() => {
    return Object.values(candidates)
      .map((candidate) => {
        const session = candidate.sessionId ? sessions[candidate.sessionId] : null;
        return {
          ...candidate,
          session,
          score: session?.finalScore || 0,
          status: session?.status || 'not_started',
          submittedAt: session?.status === 'completed' ? session.updatedAt : null,
        };
      })
      .filter((c) => {
        // Filter by search
        const matchesSearch =
          !searchText ||
          c.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchText.toLowerCase());

        // Filter by status
        const matchesStatus =
          filterStatus === 'all' ||
          (filterStatus === 'completed' && c.status === 'completed') ||
          (filterStatus === 'in_progress' && c.status === 'in_progress');

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          return b.score - a.score;
        } else {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
      });
  }, [candidates, sessions, searchText, sortBy, filterStatus]);

  const handleViewCandidate = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setDrawerVisible(true);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      const candidate = candidates[candidateId];
      
      if (!candidate) {
        message.error('Candidate not found');
        return;
      }

      message.loading({ content: 'Deleting candidate and recordings...', key: 'delete' });
      
      let recordingsDeleted = 0;
      
      // Delete associated session and recordings
      if (candidate.sessionId) {
        const session = sessions[candidate.sessionId];
        if (session) {
          // Delete all recordings from storage
          for (const answer of session.answers) {
            if (answer.recordingBlobId) {
              try {
                await deleteRecording(answer.recordingBlobId);
                recordingsDeleted++;
                console.log(`Deleted recording: ${answer.recordingBlobId}`);
              } catch (error) {
                console.error('Failed to delete recording:', answer.recordingBlobId, error);
              }
            }
          }
          // Delete session from Redux store
          dispatch(deleteSession(candidate.sessionId));
          console.log(`Deleted session: ${candidate.sessionId}`);
        }
      }
      
      // Delete candidate from Redux store
      dispatch(deleteCandidate(candidateId));
      console.log(`Deleted candidate: ${candidateId}`);
      
      message.success({ 
        content: `Candidate deleted successfully! ${recordingsDeleted} recording(s) removed from storage.`, 
        key: 'delete',
        duration: 3
      });
      
      // Close drawer if this candidate was selected
      if (selectedCandidateId === candidateId) {
        setDrawerVisible(false);
        setSelectedCandidateId(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error({ content: 'Failed to delete candidate', key: 'delete' });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    message.success('Logged out successfully');
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => text || 'N/A',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text: string) => text || 'N/A',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => text || 'N/A',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Tag color={score >= 70 ? 'green' : score >= 50 ? 'orange' : 'red'}>
          {score}/100
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          completed: 'success',
          in_progress: 'processing',
          not_started: 'default',
        };
        return <Tag color={colorMap[status]}>{status.replace('_', ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Submitted At',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string | null) => {
        if (!date) return <span style={{ color: '#999' }}>Not submitted</span>;
        return (
          <div>
            <div>{new Date(date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {new Date(date).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit'
              })}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewCandidate(record.id)}
          >
            View
          </Button>
          <Popconfirm
            title="Delete Candidate?"
            description={`Are you sure you want to delete ${record.name || 'this candidate'}? This will permanently delete all interview data and recordings.`}
            onConfirm={() => {
              console.log('Deleting candidate:', record.id);
              handleDeleteCandidate(record.id);
            }}
            onCancel={() => console.log('Delete cancelled')}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            placement="topRight"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const selectedCandidate = selectedCandidateId ? candidates[selectedCandidateId] : null;
  const selectedSession = selectedCandidate?.sessionId
    ? sessions[selectedCandidate.sessionId]
    : null;

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎯 Interviewer Dashboard
        </Title>
        <Button 
          icon={<LogoutOutlined />} 
          onClick={handleLogout}
          size="large"
          style={{ borderRadius: 8 }}
        >
          Logout
        </Button>
      </div>

      <Tabs
        defaultActiveKey="dashboard"
        size="large"
        items={[
          {
            key: 'dashboard',
            label: (
              <span>
                <DashboardOutlined /> Dashboard
              </span>
            ),
            children: (
              <>
                <DashboardStats candidates={candidates} sessions={sessions} />
                <DashboardCharts candidates={candidates} sessions={sessions} />
              </>
            ),
          },
          {
            key: 'candidates',
            label: (
              <span>
                <UnorderedListOutlined /> Candidates
              </span>
            ),
            children: (
              <>
                <Card style={{ marginBottom: 24, borderRadius: 16 }}>
                  <Space size="middle" wrap>
                    <Input
                      placeholder="Search by name or email"
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: 250 }}
                      size="large"
                    />
                    <Select
                      value={sortBy}
                      onChange={setSortBy}
                      style={{ width: 150 }}
                      size="large"
                    >
                      <Select.Option value="score">Sort by Score</Select.Option>
                      <Select.Option value="date">Sort by Date</Select.Option>
                    </Select>
                    <Select
                      value={filterStatus}
                      onChange={setFilterStatus}
                      style={{ width: 150 }}
                      size="large"
                    >
                      <Select.Option value="all">All Status</Select.Option>
                      <Select.Option value="completed">Completed</Select.Option>
                      <Select.Option value="in_progress">In Progress</Select.Option>
                    </Select>
                  </Space>
                </Card>

                <Card style={{ borderRadius: 16 }}>
                  <Table
                    columns={columns}
                    dataSource={candidatesList}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              </>
            ),
          },
        ]}
      />

      <Drawer
        title="Candidate Details"
        placement="right"
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedCandidate && (
          <div>
            <Card title="Profile" style={{ marginBottom: 16 }}>
              <p>
                <strong>Name:</strong> {selectedCandidate.name || 'N/A'}
              </p>
              <p>
                <strong>Email:</strong> {selectedCandidate.email || 'N/A'}
              </p>
              <p>
                <strong>Phone:</strong> {selectedCandidate.phone || 'N/A'}
              </p>
              <p>
                <strong>Resume:</strong> {selectedCandidate.resumeFileName || 'N/A'}
              </p>
            </Card>

            {selectedSession && (
              <>
                <Card title="Interview Summary" style={{ marginBottom: 16 }}>
                  <p>
                    <strong>Status:</strong>{' '}
                    <Tag
                      color={
                        selectedSession.status === 'completed' ? 'success' : 'processing'
                      }
                    >
                      {selectedSession.status.toUpperCase()}
                    </Tag>
                  </p>
                  <p>
                    <strong>Final Score:</strong>{' '}
                    <Tag
                      color={
                        (selectedSession.finalScore || 0) >= 70
                          ? 'green'
                          : (selectedSession.finalScore || 0) >= 50
                          ? 'orange'
                          : 'red'
                      }
                    >
                      {selectedSession.finalScore || 0}/100
                    </Tag>
                  </p>
                  <p>
                    <strong>Interview Started:</strong>{' '}
                    {new Date(selectedSession.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {selectedSession.status === 'completed' && (
                    <p>
                      <strong>Submitted At:</strong>{' '}
                      <Tag color="blue">
                        {new Date(selectedSession.updatedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Tag>
                    </p>
                  )}
                  {selectedSession.finalSummary && (
                    <div>
                      <strong>Summary:</strong>
                      <Paragraph>{selectedSession.finalSummary}</Paragraph>
                    </div>
                  )}
                </Card>

                <Card title="Interview Transcript">
                  {selectedSession.questions.map((question, idx) => {
                    const answer = selectedSession.answers.find(
                      (a) => a.questionId === question.id
                    );

                    return (
                      <Card
                        key={question.id}
                        type="inner"
                        title={`Question ${idx + 1} - ${question.difficulty.toUpperCase()}`}
                        style={{ marginBottom: 16 }}
                      >
                        <p>
                          <strong>Q:</strong> {question.text}
                        </p>
                        {answer && (
                          <>
                            <p>
                              <strong>A:</strong> {answer.text || '(No answer provided)'}
                            </p>
                            <p>
                              <strong>Score:</strong>{' '}
                              <Tag
                                color={
                                  (answer.llmScore || 0) >= 7
                                    ? 'green'
                                    : (answer.llmScore || 0) >= 5
                                    ? 'orange'
                                    : 'red'
                                }
                              >
                                {answer.llmScore || 0}/10
                              </Tag>
                            </p>
                            {answer.llmFeedback && (
                              <p>
                                <strong>Feedback:</strong> {answer.llmFeedback}
                              </p>
                            )}
                            {answer.recordingBlobId && (
                              <RecordingPlayer blobId={answer.recordingBlobId} />
                            )}
                          </>
                        )}
                      </Card>
                    );
                  })}
                </Card>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

const RecordingPlayer: React.FC<{ blobId: string }> = ({ blobId }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    let objectUrl: string | null = null;
    
    const loadRecording = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading recording:', blobId);
        
        const blob = await getRecording(blobId);
        
        if (!blob) {
          setError('Recording not found');
          setLoading(false);
          return;
        }
        
        console.log('Recording blob loaded:', blob.size, 'bytes, type:', blob.type);
        
        objectUrl = URL.createObjectURL(blob);
        setVideoUrl(objectUrl);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load recording:', err);
        setError('Failed to load recording');
        setLoading(false);
      }
    };

    loadRecording();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        console.log('Cleaned up video URL');
      }
    };
  }, [blobId]);

  if (loading) {
    return (
      <div style={{ marginTop: 8, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <p style={{ margin: 0, color: '#666' }}>⏳ Loading recording...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginTop: 8, padding: 16, background: '#fff2e8', borderRadius: 8, border: '1px solid #ffbb96' }}>
        <p style={{ margin: 0, color: '#d46b08' }}>⚠️ {error}</p>
      </div>
    );
  }

  if (!videoUrl) {
    return null;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ 
        padding: 12, 
        background: '#f0f5ff', 
        borderRadius: 8,
        border: '1px solid #adc6ff',
        marginBottom: 8
      }}>
        <strong style={{ color: '#1890ff' }}>🎥 Video Recording:</strong>
      </div>
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        preload="metadata"
        style={{ 
          width: '100%', 
          maxWidth: 640, 
          borderRadius: 8,
          border: '2px solid #e8e8e8',
          background: '#000',
          display: 'block'
        }}
        onError={(e) => {
          console.error('Video playback error:', e);
          setError('Video playback failed. The recording may be corrupted.');
        }}
        onLoadedMetadata={() => {
          console.log('Video loaded successfully');
        }}
      >
        Your browser does not support video playback.
      </video>
      <p style={{ 
        marginTop: 8, 
        fontSize: 12, 
        color: '#666',
        fontStyle: 'italic'
      }}>
        💡 Tip: Click play to view the candidate's video response
      </p>
    </div>
  );
};
