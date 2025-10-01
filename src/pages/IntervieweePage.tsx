import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, Input, Card, Progress, App, Space, Alert } from 'antd';
import { UploadOutlined, SendOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { addCandidate, updateCandidate } from '@/store/slices/candidatesSlice';
import {
  createSession,
  addAnswer,
  advanceQuestion,
  setQuestionStartTime,
  completeSession,
} from '@/store/slices/sessionsSlice';
import { parseResume } from '@/utils/resumeParser';
import { startRecording, RecordingController } from '@/utils/mediaRecorder';
import { saveRecording } from '@/utils/storage';
import { generateQuestion, gradeAnswer, generateFinalSummary } from '@/services/groqService';
import { calculateRemainingTime, formatTime } from '@/utils/timerUtils';
import { createSpeechRecognition, SpeechRecognitionController, isSpeechRecognitionSupported } from '@/utils/speechRecognition';
import { v4 as uuidv4 } from 'uuid';
import { Session, Question, Answer, Candidate } from '@/types';

export const IntervieweePage: React.FC = () => {
  const { message } = App.useApp();
  const dispatch = useDispatch();
  const { candidates } = useSelector((state: RootState) => state.candidates);
  const { sessions, currentSessionId } = useSelector((state: RootState) => state.sessions);

  const [stage, setStage] = useState<'upload' | 'collect-info' | 'display-info' | 'interview' | 'completed'>('upload');
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [collectingField, setCollectingField] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [recording, setRecording] = useState<RecordingController | null>(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [preparationTime, setPreparationTime] = useState(15);
  const [isPreparationPhase, setIsPreparationPhase] = useState(true);
  const [isReadyToAnswer, setIsReadyToAnswer] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognitionController | null>(null);
  const [isSpeechToTextActive, setIsSpeechToTextActive] = useState(false);

  // Preparation time based on difficulty
  const getPreparationTime = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 15;
      case 'medium':
        return 25;
      case 'hard':
        return 30;
      default:
        return 20;
    }
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const preparationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSession = currentSessionId ? sessions[currentSessionId] : null;
  const currentQuestion = currentSession?.questions[currentSession.currentIndex];

  useEffect(() => {
    // Check for existing session
    if (currentSessionId && currentSession) {
      const candidate = candidates[currentSession.candidateId];
      setCurrentCandidate(candidate);
      
      if (currentSession.status === 'completed') {
        setStage('completed');
      } else {
        setStage('interview');
        setIsPreparationPhase(false); // Skip preparation on restore
        // Restore timer
        if (currentSession.questionStartTime && currentQuestion) {
          const remaining = calculateRemainingTime(
            currentSession.questionStartTime,
            currentQuestion.timeLimitSec
          );
          setRemainingTime(remaining);
          if (remaining > 0) {
            // Will be started by useEffect
          } else {
            handleAutoSubmit();
          }
        }
      }
    }

    // Cleanup function - runs when component unmounts
    return () => {
      // Stop speech recognition
      if (speechRecognition) {
        speechRecognition.stop();
      }

      // Stop all media tracks
      if (videoStream) {
        videoStream.getTracks().forEach((track) => {
          track.stop();
          console.log('Cleanup: Stopped track:', track.kind);
        });
      }

      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (preparationTimerRef.current) {
        clearInterval(preparationTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stage === 'interview' && currentQuestion && isPreparationPhase) {
      // Start preparation phase for new question
      const prepTime = getPreparationTime(currentQuestion.difficulty);
      setPreparationTime(prepTime);
      setIsReadyToAnswer(false);
      startPreparationTimer(prepTime);
    }
    
    // Start answer timer if not in preparation phase and has start time
    if (stage === 'interview' && currentQuestion && !isPreparationPhase && currentSession?.questionStartTime) {
      startAnswerTimer();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (preparationTimerRef.current) {
        clearInterval(preparationTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, currentQuestion, isPreparationPhase]);

  const startPreparationTimer = (initialTime: number) => {
    if (preparationTimerRef.current) {
      clearInterval(preparationTimerRef.current);
    }

    let countdown = initialTime;
    setPreparationTime(countdown);

    preparationTimerRef.current = setInterval(() => {
      countdown -= 1;
      setPreparationTime(countdown);

      if (countdown <= 0) {
        if (preparationTimerRef.current) {
          clearInterval(preparationTimerRef.current);
        }
        // Don't auto-start, wait for user to click "Start Answer"
        setIsReadyToAnswer(true);
      }
    }, 1000);
  };

  const handleStartAnswer = () => {
    if (!currentSession || !currentQuestion) return;
    
    // Set the start time NOW when user clicks "Start Answer"
    const startTime = new Date().toISOString();
    dispatch(
      setQuestionStartTime({
        sessionId: currentSession.id,
        startTime,
      })
    );
    
    setIsPreparationPhase(false);
    setIsReadyToAnswer(false);
    setRemainingTime(currentQuestion.timeLimitSec);
    startAnswerTimer();
    
    // Don't auto-start speech recognition - let user enable it manually
  };

  const startSpeechRecognition = () => {
    if (!isSpeechRecognitionSupported()) {
      console.log('Speech recognition not supported');
      return;
    }

    const recognition = createSpeechRecognition(
      (transcript) => {
        // Update the answer text box with the transcript
        setCurrentAnswer(transcript);
      },
      (error) => {
        console.error('Speech recognition error:', error);
        message.warning('Speech-to-text encountered an issue. You can still type your answer.');
      }
    );

    setSpeechRecognition(recognition);
    recognition.start();
    setIsSpeechToTextActive(true);
    console.log('Speech-to-text started');
  };

  const stopSpeechRecognition = () => {
    if (speechRecognition) {
      speechRecognition.stop();
      setIsSpeechToTextActive(false);
      console.log('Speech-to-text stopped');
    }
  };

  const startAnswerTimer = () => {
    if (!currentQuestion) return;
    
    // Request media permissions when answer phase starts
    requestMediaPermission();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (currentSession && currentSession.questionStartTime && currentQuestion) {
        const remaining = calculateRemainingTime(
          currentSession.questionStartTime,
          currentQuestion.timeLimitSec
        );
        setRemainingTime(remaining);

        if (remaining <= 0) {
          handleAutoSubmit();
        }
      }
    }, 1000);
  };

  const handleFileUpload = async (file: File) => {
    try {
      console.log('Starting file upload:', file.name);
      message.loading({ content: 'Parsing resume...', key: 'upload' });
      
      const { text, fields } = await parseResume(file);
      console.log('Resume parsed successfully. Text length:', text.length);
      console.log('Extracted fields:', fields);
      
      // Store resume text for question generation
      setResumeText(text);

      const candidateId = uuidv4();
      const candidate: Candidate = {
        id: candidateId,
        name: fields.name,
        email: fields.email,
        phone: fields.phone,
        resumeFileName: file.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch(addCandidate(candidate));
      setCurrentCandidate(candidate);

      const missing: string[] = [];
      if (!fields.name) missing.push('name');
      if (!fields.email) missing.push('email');
      if (!fields.phone) missing.push('phone');

      console.log('Missing fields:', missing);

      if (missing.length > 0) {
        setMissingFields(missing);
        setCollectingField(missing[0]);
        setStage('collect-info');
        message.success({ content: 'Resume uploaded. Please provide missing information.', key: 'upload' });
      } else {
        message.success({ content: 'Resume parsed successfully!', key: 'upload' });
        setStage('display-info');
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      message.error({ 
        content: error.message || 'Failed to parse resume. Please try a different file.', 
        key: 'upload',
        duration: 5
      });
    }
    return false;
  };

  const handleCollectField = () => {
    if (!inputValue.trim() || !currentCandidate || !collectingField) return;

    console.log('Collecting field:', collectingField, 'Value:', inputValue.trim());

    dispatch(
      updateCandidate({
        id: currentCandidate.id,
        updates: { [collectingField]: inputValue.trim() },
      })
    );

    const updatedCandidate = {
      ...currentCandidate,
      [collectingField]: inputValue.trim(),
    };
    setCurrentCandidate(updatedCandidate);

    const remainingFields = missingFields.filter((f) => f !== collectingField);
    setMissingFields(remainingFields);

    if (remainingFields.length > 0) {
      setCollectingField(remainingFields[0]);
      setInputValue('');
    } else {
      setCollectingField(null);
      setInputValue('');
      // Show display-info stage before starting interview
      setStage('display-info');
      message.success('All information collected!');
    }
  };

  const startInterview = async (candidateId: string, resumeContent: string) => {
    console.log('Starting interview for candidate:', candidateId);
    console.log('Resume content length:', resumeContent?.length || 0);
    
    // API key is now permanent, always initialized
    console.log('Starting interview with permanent API key...');

    // Validate resume content
    if (!resumeContent || resumeContent.trim().length < 20) {
      message.error({
        content: 'Resume content is too short. Please upload a valid resume.',
        key: 'start',
        duration: 5
      });
      return;
    }

    message.loading({ content: 'Analyzing resume and generating personalized questions...', key: 'start' });

    try {
      console.log('Generating questions...');
      // Generate 6 questions based on resume: 2 easy, 2 medium, 2 hard
      const questions: Question[] = [];
      let failedAttempts = 0;
      const maxRetries = 2;
      
      for (const difficulty of ['easy', 'easy', 'medium', 'medium', 'hard', 'hard'] as const) {
        console.log(`Generating ${difficulty} question...`);
        let questionGenerated = false;
        
        for (let attempt = 0; attempt <= maxRetries && !questionGenerated; attempt++) {
          try {
            const question = await generateQuestion(difficulty, resumeContent);
            console.log(`Generated question:`, question.text);
            questions.push(question);
            questionGenerated = true;
          } catch (error: any) {
            console.error(`Failed to generate ${difficulty} question (attempt ${attempt + 1}):`, error);
            failedAttempts++;
            
            if (attempt === maxRetries) {
              // If all retries failed, create a fallback question
              console.warn('Using fallback question due to generation failure');
              const fallbackQuestion: Question = {
                id: uuidv4(),
                text: difficulty === 'easy' 
                  ? 'Tell me about your experience with web development and the technologies you have worked with.'
                  : difficulty === 'medium'
                  ? 'Describe a challenging project you worked on and how you overcame the technical difficulties.'
                  : 'Explain your approach to system design and how you ensure scalability in your applications.',
                difficulty,
                timeLimitSec: difficulty === 'easy' ? 20 : difficulty === 'medium' ? 60 : 120,
                rubric: 'Clear explanation with relevant examples',
                gradingHints: 'Look for technical depth and practical experience'
              };
              questions.push(fallbackQuestion);
              questionGenerated = true;
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
      }

      if (failedAttempts > 0) {
        message.warning({ 
          content: `Interview started with ${failedAttempts} fallback question(s). Your interview will proceed normally.`, 
          key: 'start',
          duration: 5
        });
      }

      console.log('All questions generated:', questions.length);

      const sessionId = uuidv4();
      const session: Session = {
        id: sessionId,
        candidateId,
        questions,
        currentIndex: 0,
        answers: [],
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questionStartTime: new Date().toISOString(),
      };

      dispatch(createSession(session));
      dispatch(updateCandidate({ id: candidateId, updates: { sessionId } }));

      setStage('interview');
      setRemainingTime(questions[0].timeLimitSec);
      message.success({ content: 'Interview started! Get ready for your first question.', key: 'start' });

      // Request media permissions
      requestMediaPermission();
    } catch (error: any) {
      console.error('Failed to start interview:', error);
      message.error({ 
        content: `Failed to start interview: ${error.message || 'Please check your internet connection and try again.'}`, 
        key: 'start',
        duration: 8
      });
    }
  };

  const requestMediaPermission = async () => {
    try {
      const controller = await startRecording();
      setRecording(controller);
      setVideoStream(controller.stream);
      setHasMediaPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = controller.stream;
      }
    } catch (error) {
      message.warning('Camera/microphone access denied. You can still type your answers.');
      setHasMediaPermission(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentSession || !currentQuestion) return;

    setIsGrading(true);
    
    // Stop speech recognition
    stopSpeechRecognition();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    let recordingBlobId: string | undefined;

    if (recording) {
      try {
        const blob = await recording.stop();
        recordingBlobId = uuidv4();
        await saveRecording(recordingBlobId, blob);
        setRecording(null);
        setVideoStream(null);
      } catch (error) {
        console.error('Failed to save recording:', error);
        message.warning('Recording could not be saved, but your text answer is preserved.');
      }
    }

    // Combine typed answer with recording note
    let fullAnswerText = currentAnswer;
    if (recordingBlobId) {
      fullAnswerText += '\n\n[Note: Candidate also provided a video/audio response. Please consider this is a multimodal answer with both text and recorded explanation.]';
    }

    const answer: Answer = {
      id: uuidv4(),
      questionId: currentQuestion.id,
      text: fullAnswerText,
      startTime: currentSession.questionStartTime!,
      submitTime: new Date().toISOString(),
      durationSec: currentQuestion.timeLimitSec - remainingTime,
      autoSubmitted: false,
      recordingBlobId,
    };

    // Grade the answer with retry logic
    let gradingAttempts = 0;
    const maxGradingAttempts = 2;
    let gradingSuccess = false;
    
    while (gradingAttempts < maxGradingAttempts && !gradingSuccess) {
      try {
        const { score, feedback } = await gradeAnswer(currentQuestion, answer);
        answer.llmScore = score;
        answer.llmFeedback = feedback;
        gradingSuccess = true;
      } catch (error) {
        gradingAttempts++;
        console.error(`Grading failed (attempt ${gradingAttempts}):`, error);
        
        if (gradingAttempts >= maxGradingAttempts) {
          // Provide default score if grading fails
          answer.llmScore = 5;
          answer.llmFeedback = 'Answer recorded. Automatic grading unavailable - manual review recommended.';
          message.warning('Automatic grading temporarily unavailable. Your answer has been saved.');
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    dispatch(addAnswer({ sessionId: currentSession.id, answer }));

    // Move to next question or complete
    if (currentSession.currentIndex < currentSession.questions.length - 1) {
      dispatch(advanceQuestion(currentSession.id));
      setCurrentAnswer('');
      setIsGrading(false);
      
      // Reset to preparation phase for next question
      // The useEffect will handle starting the preparation timer
      setIsPreparationPhase(true);
      setIsReadyToAnswer(false);
    } else {
      await completeInterview();
    }
  };

  const handleAutoSubmit = async () => {
    if (isGrading) return;
    await handleSubmitAnswer();
  };

  const completeInterview = async () => {
    if (!currentSession) return;

    // Stop speech recognition
    stopSpeechRecognition();

    // Stop camera and microphone
    if (recording) {
      try {
        await recording.stop();
        setRecording(null);
      } catch (error) {
        console.error('Failed to stop recording:', error);
      }
    }
    
    // Stop all video/audio tracks
    if (videoStream) {
      videoStream.getTracks().forEach((track) => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      setVideoStream(null);
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setHasMediaPermission(false);

    message.loading({ content: 'Generating final summary...', key: 'complete' });

    let finalScore = 0;
    let summary = '';
    let summaryAttempts = 0;
    const maxSummaryAttempts = 2;
    
    while (summaryAttempts < maxSummaryAttempts) {
      try {
        const result = await generateFinalSummary(
          currentSession.answers,
          currentSession.questions
        );
        finalScore = result.finalScore;
        summary = result.summary;
        break; // Success, exit loop
      } catch (error) {
        summaryAttempts++;
        console.error(`Failed to generate summary (attempt ${summaryAttempts}):`, error);
        
        if (summaryAttempts >= maxSummaryAttempts) {
          // Calculate fallback score from individual answers
          const totalScore = currentSession.answers.reduce((sum, ans) => sum + (ans.llmScore || 0), 0);
          const avgScore = currentSession.answers.length > 0 ? totalScore / currentSession.answers.length : 0;
          finalScore = Math.round((avgScore / 10) * 100);
          
          summary = `Interview completed successfully! You answered ${currentSession.questions.length} questions. ` +
                   `Your responses have been recorded and will be reviewed by our team. ` +
                   `Thank you for your participation and effort throughout this interview.`;
          
          message.warning({ 
            content: 'Summary generation delayed. Your interview is complete and results are saved.', 
            key: 'complete',
            duration: 5
          });
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    dispatch(
      completeSession({
        sessionId: currentSession.id,
        finalScore,
        finalSummary: summary,
      })
    );

    setStage('completed');
    message.success({ content: 'Interview completed successfully!', key: 'complete' });
    setIsGrading(false);
  };

  const renderUploadStage = () => (
    <Card 
      title={
        <span style={{ fontSize: 24, fontWeight: 600 }}>
          📄 Upload Your Resume
        </span>
      }
      style={{ 
        maxWidth: 700, 
        margin: '0 auto',
        borderRadius: 16,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <p style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>
          Get started by uploading your resume. We'll analyze it and create personalized interview questions.
        </p>
        
        <Alert
          message="📋 Supported Formats"
          description={
            <div style={{ textAlign: 'left' }}>
              <p style={{ marginBottom: 8 }}>✅ PDF files (.pdf)</p>
              <p style={{ marginBottom: 8 }}>✅ Word documents (.docx)</p>
              <p style={{ marginBottom: 8 }}>✅ Maximum file size: 10MB</p>
              <p style={{ marginBottom: 0 }}>✅ Ensure your resume contains text (not scanned images)</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24, textAlign: 'left' }}
        />

        <Upload.Dragger
          beforeUpload={handleFileUpload}
          accept=".pdf,.docx"
          maxCount={1}
          showUploadList={false}
          style={{
            padding: '40px 20px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            border: '2px dashed #667eea',
            borderRadius: 12,
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 64, color: '#667eea' }} />
          </p>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 8 }}>
            Click or drag file to upload
          </p>
          <p style={{ fontSize: 14, color: '#666' }}>
            Drop your resume here or click to browse
          </p>
        </Upload.Dragger>

        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: '#f0f5ff', 
          borderRadius: 8,
          border: '1px solid #d6e4ff'
        }}>
          <p style={{ margin: 0, fontSize: 14, color: '#1890ff' }}>
            💡 <strong>Tip:</strong> Make sure your resume includes your name, email, phone number, 
            skills, and project details for the best interview experience.
          </p>
        </div>
      </div>
    </Card>
  );

  const renderCollectInfoStage = () => (
    <Card title="Complete Your Profile" style={{ maxWidth: 600, margin: '0 auto' }}>
      <p>Please provide your {collectingField}:</p>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder={`Enter your ${collectingField}`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleCollectField}
          size="large"
        />
        <Button type="primary" onClick={handleCollectField} size="large">
          Submit
        </Button>
      </Space.Compact>
    </Card>
  );

  const renderInterviewStage = () => {
    if (!currentSession || !currentQuestion) return null;

    const progress = ((currentSession.currentIndex + 1) / currentSession.questions.length) * 100;
    
    const getDifficultyColor = () => {
      switch (currentQuestion.difficulty) {
        case 'easy': return { bg: '#d1fae5', border: '#10b981', text: '#059669' };
        case 'medium': return { bg: '#fed7aa', border: '#f59e0b', text: '#d97706' };
        case 'hard': return { bg: '#fecaca', border: '#ef4444', text: '#dc2626' };
        default: return { bg: '#e0e7ff', border: '#667eea', text: '#5b21b6' };
      }
    };
    
    const difficultyColors = getDifficultyColor();

    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }} className="scale-in">
        <Card 
          style={{
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '2px solid #e0e7ff'
          }}
        >
          {/* Progress Bar with Animation */}
          <div style={{ marginBottom: 24 }}>
            <Progress 
              percent={Math.round(progress)} 
              status="active" 
              strokeColor={{
                '0%': '#667eea',
                '100%': '#764ba2',
              }}
              trailColor="#f0f0f0"
              size={12}
              style={{ marginBottom: 12 }}
            />
            <div style={{ 
              textAlign: 'center', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap'
            }}>
              <span style={{ 
                fontSize: 16, 
                fontWeight: 600,
                color: '#667eea'
              }}>
                📝 Question {currentSession.currentIndex + 1} of {currentSession.questions.length}
              </span>
              <span style={{
                padding: '4px 16px',
                background: difficultyColors.bg,
                border: `2px solid ${difficultyColors.border}`,
                borderRadius: 20,
                color: difficultyColors.text,
                fontWeight: 700,
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {currentQuestion.difficulty === 'easy' && '🟢'}
                {currentQuestion.difficulty === 'medium' && '🟡'}
                {currentQuestion.difficulty === 'hard' && '🔴'}
                {' '}{currentQuestion.difficulty}
              </span>
            </div>
          </div>

          {/* Question Card with Gradient */}
          <div
            className="slide-in-left"
            style={{
              padding: 24,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRadius: 12,
              marginBottom: 24,
              border: '2px solid #667eea',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
            }}
          >
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>💭</span>
              <span style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                color: '#667eea',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Your Question
              </span>
            </div>
            <h3 style={{ 
              margin: 0, 
              fontSize: 18, 
              lineHeight: 1.6,
              color: '#1f2937'
            }}>
              {currentQuestion.text}
            </h3>
          </div>

          {isPreparationPhase ? (
            <div style={{ marginBottom: 24, textAlign: 'center' }} className="scale-in">
              <Alert
                message={isReadyToAnswer ? "✅ Ready to Answer!" : "⏱️ Preparation Time"}
                description={
                  isReadyToAnswer
                    ? "Click the button below to start answering. Your timer will begin and recording will start."
                    : `Read the question carefully. You have ${preparationTime} seconds to prepare...`
                }
                type={isReadyToAnswer ? "success" : "info"}
                showIcon
                style={{ 
                  marginBottom: 20,
                  borderRadius: 12,
                  border: isReadyToAnswer ? '2px solid #10b981' : '2px solid #3b82f6'
                }}
              />
              {!isReadyToAnswer ? (
                <div style={{
                  padding: 32,
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  borderRadius: 16,
                  border: '3px solid #3b82f6'
                }}>
                  <div style={{ fontSize: 16, color: '#1e40af', marginBottom: 12, fontWeight: 600 }}>
                    ⏳ Time Remaining
                  </div>
                  <h1 style={{ 
                    color: '#1e40af', 
                    fontSize: 64, 
                    margin: 0,
                    fontWeight: 800,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                  }} className="heartbeat">
                    {preparationTime}s
                  </h1>
                </div>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleStartAnswer}
                  className="hover-lift btn-ripple"
                  style={{
                    height: 64,
                    fontSize: 20,
                    fontWeight: 700,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
                    padding: '0 48px'
                  }}
                >
                  🎤 Start Answering Now!
                </Button>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 24, textAlign: 'center' }} className="scale-in">
              <div style={{
                padding: 24,
                background: remainingTime < 10 
                  ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' 
                  : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                borderRadius: 16,
                border: remainingTime < 10 ? '3px solid #ef4444' : '3px solid #10b981',
                boxShadow: remainingTime < 10 
                  ? '0 0 20px rgba(239, 68, 68, 0.3)' 
                  : '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ 
                  fontSize: 16, 
                  color: remainingTime < 10 ? '#991b1b' : '#065f46', 
                  marginBottom: 8, 
                  fontWeight: 600 
                }}>
                  {remainingTime < 10 ? '⚠️ Time Running Out!' : '⏰ Time Remaining'}
                </div>
                <h1 style={{ 
                  color: remainingTime < 10 ? '#dc2626' : '#059669',
                  fontSize: 56,
                  margin: 0,
                  fontWeight: 800,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                }} className={remainingTime < 10 ? 'shake' : ''}>
                  {formatTime(remainingTime)}
                </h1>
              </div>
            </div>
          )}

          {hasMediaPermission && videoStream && !isPreparationPhase && (
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                style={{ width: 320, height: 240, borderRadius: 8, border: '2px solid #1890ff' }}
              />
              <p style={{ marginTop: 8, color: '#52c41a' }}>
                <VideoCameraOutlined /> Recording in progress - You can speak your answer!
              </p>
              <Alert
                message="💡 Tip"
                description="You can type your answer, speak it, or do both! The AI will consider your recorded explanation when grading."
                type="success"
                showIcon
                style={{ marginTop: 8 }}
              />
            </div>
          )}

          {isSpeechToTextActive && (
            <Alert
              message="🎤 Speech-to-Text Active"
              description="Your speech is being transcribed in real-time. Keep speaking and the text will appear below."
              type="success"
              showIcon
              closable
              onClose={stopSpeechRecognition}
              style={{ marginBottom: 16 }}
            />
          )}

          {!isPreparationPhase && !isSpeechToTextActive && isSpeechRecognitionSupported() && (
            <Alert
              message="💡 Tip: Enable Speech-to-Text"
              description={
                <div>
                  Click the button below to enable voice input and speak your answer.
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={startSpeechRecognition}
                    style={{ padding: 0, marginLeft: 8 }}
                  >
                    Enable Now
                  </Button>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Input.TextArea
            placeholder={isPreparationPhase ? "Please wait for the timer to start..." : "Type or speak your answer here..."}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            rows={8}
            disabled={isGrading || isPreparationPhase}
            style={{ marginBottom: 16 }}
          />

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {!isPreparationPhase && (
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                {isSpeechRecognitionSupported() && (
                  <Button
                    type={isSpeechToTextActive ? 'default' : 'dashed'}
                    danger={isSpeechToTextActive}
                    onClick={isSpeechToTextActive ? stopSpeechRecognition : startSpeechRecognition}
                    disabled={isGrading}
                    icon={isSpeechToTextActive ? '🔴' : '🎤'}
                  >
                    {isSpeechToTextActive ? 'Stop Voice Input' : 'Start Voice Input'}
                  </Button>
                )}
                <div style={{ color: '#666', fontSize: '12px' }}>
                  {currentAnswer.length} characters
                </div>
              </Space>
            )}

            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmitAnswer}
              loading={isGrading}
              disabled={isGrading || isPreparationPhase}
              size="large"
              block
            >
              {isGrading ? 'Grading...' : isPreparationPhase ? 'Waiting...' : 'Submit Answer'}
            </Button>
          </Space>
        </Card>
      </div>
    );
  };

  const handleStartNewInterview = () => {
    // Reset all state
    setStage('upload');
    setCurrentCandidate(null);
    setMissingFields([]);
    setCollectingField(null);
    setInputValue('');
    setCurrentAnswer('');
    setRemainingTime(0);
    setRecording(null);
    setHasMediaPermission(false);
    setIsGrading(false);
    setVideoStream(null);
    setPreparationTime(15);
    setIsPreparationPhase(true);
    setIsReadyToAnswer(false);
    
    // Clear all timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (preparationTimerRef.current) {
      clearInterval(preparationTimerRef.current);
      preparationTimerRef.current = null;
    }
  };

  const renderCompletedStage = () => {
    const score = currentSession?.finalScore || 0;
    const getGreeting = () => {
      if (score >= 80) return '🎉 Excellent Performance!';
      if (score >= 60) return '👍 Good Job!';
      if (score >= 40) return '💪 Keep Improving!';
      return '📚 Keep Learning!';
    };
    
    const getScoreColor = () => {
      if (score >= 80) return '#52c41a';
      if (score >= 60) return '#1890ff';
      if (score >= 40) return '#faad14';
      return '#ff4d4f';
    };

    return (
      <Card 
        title={<span style={{ fontSize: 24 }}>🎓 Interview Completed!</span>} 
        style={{ maxWidth: 700, margin: '0 auto' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ color: getScoreColor(), fontSize: 36, margin: '16px 0' }}>
            {getGreeting()}
          </h2>
          <div style={{ 
            fontSize: 48, 
            fontWeight: 'bold', 
            color: getScoreColor(),
            marginBottom: 8
          }}>
            {score}/100
          </div>
          <p style={{ color: '#666', fontSize: 16 }}>Your Overall Score</p>
        </div>

        <Alert
          message={`Dear ${currentCandidate?.name || 'Candidate'},`}
          description="Thank you for completing the interview! We appreciate the time and effort you put into your responses."
          type="success"
          showIcon
          style={{ marginBottom: 20 }}
        />

        <div style={{ 
          background: '#f5f5f5', 
          padding: 20, 
          borderRadius: 8,
          marginBottom: 20
        }}>
          <h3 style={{ marginTop: 0 }}>📊 Performance Summary</h3>
          <p style={{ lineHeight: 1.8, marginBottom: 0 }}>
            {currentSession?.finalSummary || 'Your interview has been recorded and will be reviewed by our team.'}
          </p>
        </div>

        <div style={{ 
          background: '#e6f7ff', 
          padding: 16, 
          borderRadius: 8,
          marginBottom: 20,
          border: '1px solid #91d5ff'
        }}>
          <h4 style={{ marginTop: 0, color: '#1890ff' }}>📧 What's Next?</h4>
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>Your responses have been saved successfully</li>
            <li>Our team will review your interview</li>
            <li>You'll receive feedback at: <strong>{currentCandidate?.email || 'your email'}</strong></li>
            <li>Expected response time: 2-3 business days</li>
          </ul>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4>📋 Interview Details</h4>
          <p><strong>Candidate:</strong> {currentCandidate?.name || 'N/A'}</p>
          <p><strong>Email:</strong> {currentCandidate?.email || 'N/A'}</p>
          <p><strong>Questions Answered:</strong> {currentSession?.questions.length || 0}</p>
          <p><strong>Completed On:</strong> {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>

        <Button 
          type="primary" 
          size="large" 
          block
          onClick={handleStartNewInterview}
          style={{ height: 48, fontSize: 16 }}
        >
          Start New Interview
        </Button>
      </Card>
    );
  };

  const renderDisplayInfoStage = () => (
    <Card title="Extracted Information" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Alert
        message="Information Extracted Successfully"
        description="We've extracted the following information from your resume. Please verify and click 'Start Interview' to proceed."
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <div style={{ marginBottom: 20 }}>
        <p><strong>Name:</strong> {currentCandidate?.name || 'Not provided'}</p>
        <p><strong>Email:</strong> {currentCandidate?.email || 'Not provided'}</p>
        <p><strong>Phone:</strong> {currentCandidate?.phone || 'Not provided'}</p>
        <p><strong>Resume:</strong> {currentCandidate?.resumeFileName}</p>
      </div>
      
      <Button 
        type="primary" 
        size="large" 
        block
        onClick={() => {
          if (currentCandidate && resumeText) {
            console.log('Start Interview button clicked');
            startInterview(currentCandidate.id, resumeText);
          } else {
            message.error('Missing candidate information or resume content');
          }
        }}
      >
        Start Interview
      </Button>
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      {stage === 'upload' && renderUploadStage()}
      {stage === 'collect-info' && renderCollectInfoStage()}
      {stage === 'display-info' && renderDisplayInfoStage()}
      {stage === 'interview' && renderInterviewStage()}
      {stage === 'completed' && renderCompletedStage()}
    </div>
  );
};
