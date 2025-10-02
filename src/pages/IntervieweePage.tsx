import React, { useState, useEffect, useRef } from 'react';
import { Upload, Button, Input, Card, Progress, App, Space, Alert } from 'antd';
import { 
  UploadOutlined, 
  SendOutlined, 
  VideoCameraOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  AudioOutlined,
  StopOutlined,
  LogoutOutlined,
  FileTextOutlined
} from '@ant-design/icons';
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
import { generateQuestion, gradeAnswer, generateFinalSummary, clearQuestionCache } from '@/services/huggingfaceService';
import { calculateRemainingTime, formatTime } from '@/utils/timerUtils';
import { createSpeechRecognition, SpeechRecognitionController, isSpeechRecognitionSupported } from '@/utils/speechRecognition';
import { v4 as uuidv4 } from 'uuid';
import { Session, Question, Answer, Candidate } from '@/types';

export const IntervieweePage: React.FC = () => {
  const { message, modal } = App.useApp();
  const dispatch = useDispatch();
  const { candidates } = useSelector((state: RootState) => state.candidates);
  const { sessions, currentSessionId } = useSelector((state: RootState) => state.sessions);
  const { activeTab } = useSelector((state: RootState) => state.ui);

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
  const [autoStartCountdown, setAutoStartCountdown] = useState(5);
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

  // Effect to reset page when switching to Interviewee tab
  const hasResetRef = useRef(false);
  const prevTabRef = useRef(activeTab);
  
  useEffect(() => {
    // Only run when tab actually changes TO interviewee
    if (activeTab === 'interviewee' && prevTabRef.current !== 'interviewee' && !hasResetRef.current) {
      console.log('🔄 Interviewee tab activated - Checking if reset needed');
      
      // Reset if interview is completed
      if (stage === 'completed') {
        console.log('🗑️ Resetting to upload stage for fresh start');
        handleStartNewInterview();
        hasResetRef.current = true;
        // Reset the flag after a short delay
        setTimeout(() => { hasResetRef.current = false; }, 1000);
      }
    }
    
    prevTabRef.current = activeTab;
  }, [activeTab]); // Only run when tab changes, NOT when stage changes

  // Effect to handle auto-start countdown
  useEffect(() => {
    if (isReadyToAnswer && autoStartCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoStartCountdown(autoStartCountdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isReadyToAnswer && autoStartCountdown === 0) {
      console.log('⏰ Auto-starting answer timer');
      message.info('Starting answer timer automatically...');
      handleStartAnswer();
    }
  }, [isReadyToAnswer, autoStartCountdown]);

  // Effect to stop speech recognition when question changes
  useEffect(() => {
    // Stop speech recognition when moving to a new question
    return () => {
      if (speechRecognition && isSpeechToTextActive) {
        console.log('Question changed - stopping speech recognition');
        speechRecognition.stop();
        setSpeechRecognition(null);
        setIsSpeechToTextActive(false);
      }
    };
  }, [currentQuestion?.id]); // Run when question ID changes

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
          preparationTimerRef.current = null;
        }
        // Show "Ready to Answer" and start 5-second countdown
        setIsReadyToAnswer(true);
        setAutoStartCountdown(5);
      }
    }, 1000);
  };

  const handleStartAnswer = () => {
    if (!currentSession || !currentQuestion) return;
    
    // Reset auto-start state
    setIsReadyToAnswer(false);
    setAutoStartCountdown(5);
    
    // Set the start time NOW when user clicks "Start Answer"
    const startTime = new Date().toISOString();
    dispatch(
      setQuestionStartTime({
        sessionId: currentSession.id,
        startTime,
      })
    );
    
    setIsPreparationPhase(false);
    setRemainingTime(currentQuestion.timeLimitSec);
    startAnswerTimer();
    
    // Don't auto-start speech recognition - let user enable it manually
  };

  const startSpeechRecognition = () => {
    if (!isSpeechRecognitionSupported()) {
      console.log('Speech recognition not supported');
      return;
    }

    // Stop any existing recognition first
    if (speechRecognition) {
      speechRecognition.stop();
    }

    const recognition = createSpeechRecognition(
      (transcript) => {
        // Update the answer text box with the transcript
        // Use callback form to ensure we're working with latest state
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
    console.log('Speech-to-text started for current question');
  };

  const stopSpeechRecognition = () => {
    if (speechRecognition) {
      speechRecognition.stop();
      setSpeechRecognition(null); // Clear the reference
      setIsSpeechToTextActive(false);
      console.log('Speech-to-text stopped and cleared');
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
        message.warning({ 
          content: `Resume uploaded! We couldn't find ${missing.join(', ')}. Please provide the missing information.`, 
          key: 'upload',
          duration: 5
        });
      } else {
        message.success({ content: 'Resume parsed successfully! All information extracted.', key: 'upload' });
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
    console.log('handleCollectField called');
    console.log('inputValue:', inputValue);
    console.log('currentCandidate:', currentCandidate);
    console.log('collectingField:', collectingField);
    
    if (!inputValue.trim() || !currentCandidate || !collectingField) {
      console.log('❌ Validation failed - missing required data');
      return;
    }

    console.log('✅ Collecting field:', collectingField, 'Value:', inputValue.trim());

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
    
    // CLEAR ALL PREVIOUS DATA BEFORE STARTING NEW INTERVIEW
    console.log('🗑️ Clearing previous interview data...');
    
    // Clear question cache to ensure fresh questions
    clearQuestionCache('default-session');
    clearQuestionCache(`interview-${candidateId}`);
    
    // Reset all state variables
    setCurrentAnswer('');
    setRemainingTime(0);
    setRecording(null);
    setHasMediaPermission(false);
    setIsGrading(false);
    setVideoStream(null);
    setPreparationTime(15);
    setIsPreparationPhase(true);
    setIsReadyToAnswer(false);
    
    // Clear any active timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (preparationTimerRef.current) {
      clearInterval(preparationTimerRef.current);
      preparationTimerRef.current = null;
    }
    
    console.log('✅ Previous data cleared. Starting fresh interview...');
    
    // API key is hardcoded - always ready to start

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
      
      // Create a unique session key for this interview
      const sessionKey = `interview-${candidateId}-${Date.now()}`;
      
      for (const difficulty of ['easy', 'easy', 'medium', 'medium', 'hard', 'hard'] as const) {
        console.log(`Generating ${difficulty} question...`);
        let questionGenerated = false;
        
        for (let attempt = 0; attempt <= maxRetries && !questionGenerated; attempt++) {
          try {
            const question = await generateQuestion(difficulty, resumeContent, sessionKey);
            console.log(`Generated unique question:`, question.text);
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
      console.log('📹 Requesting camera and microphone permission...');
      const controller = await startRecording();
      console.log('✅ Recording controller created:', controller);
      
      setRecording(controller);
      setVideoStream(controller.stream);
      setHasMediaPermission(true);
      
      // Set video element source
      if (videoRef.current && controller.stream) {
        videoRef.current.srcObject = controller.stream;
        console.log('✅ Video stream connected to video element');
      }
      
      message.success({ 
        content: 'Camera and microphone enabled! Recording started.', 
        duration: 2 
      });
      console.log('✅ Media permission granted, recording started');
    } catch (error: any) {
      console.error('❌ Media permission error:', error);
      message.warning({ 
        content: 'Camera/microphone not available. You can still type your answer.', 
        duration: 3 
      });
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
        console.log(`Answer graded successfully: ${score}/10`);
      } catch (error) {
        gradingAttempts++;
        console.error(`Grading failed (attempt ${gradingAttempts}):`, error);
        
        if (gradingAttempts >= maxGradingAttempts) {
          // Always give 0 if grading fails
          answer.llmScore = 0;
          answer.llmFeedback = 'Automatic grading failed. Please try again.';
          message.warning('Automatic grading failed. Your answer has been saved with 0 score.');
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    dispatch(addAnswer({ sessionId: currentSession.id, answer }));

    // Move to next question or complete
    if (currentSession.currentIndex < currentSession.questions.length - 1) {
      // CRITICAL: Stop speech recognition before moving to next question
      stopSpeechRecognition();
      
      // Clear the answer box
      setCurrentAnswer('');
      
      // Advance to next question
      dispatch(advanceQuestion(currentSession.id));
      setIsGrading(false);
      
      // Reset to preparation phase for next question
      // The useEffect will handle starting the preparation timer
      setIsPreparationPhase(true);
      setIsReadyToAnswer(false);
      
      // Reset speech recognition state
      setIsSpeechToTextActive(false);
    } else {
      await completeInterview();
    }
  };

  const handleAutoSubmit = async () => {
    console.log('⏰ Time expired - Auto-submitting answer');
    console.log('Current answer length:', currentAnswer.length);
    console.log('Is grading:', isGrading);
    
    if (isGrading) {
      console.log('Already grading, skipping auto-submit');
      return;
    }
    
    // Auto-submit even if answer is empty
    message.info('Time is up! Submitting your answer...');
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

    // Clear the question cache for this session
    clearQuestionCache(`interview-${currentSession.candidateId}-*`);

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

  const renderCollectInfoStage = () => {
    if (!collectingField) return null;
    
    const currentFieldIndex = missingFields.indexOf(collectingField);
    const totalMissing = missingFields.length;
    const isPhoneField = collectingField === 'phone';
    const isEmailField = collectingField === 'email';
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      if (isPhoneField) {
        // Only allow digits and limit to 10 characters
        const digitsOnly = value.replace(/\D/g, '');
        setInputValue(digitsOnly.slice(0, 10));
      } else {
        setInputValue(value);
      }
    };
    
    const getPlaceholder = () => {
      if (isPhoneField) return 'Enter 10-digit mobile number';
      if (isEmailField) return 'Enter your email (e.g., name@example.com)';
      return `Enter your ${collectingField}`;
    };
    
    const getValidationMessage = () => {
      if (isPhoneField && inputValue.length > 0 && inputValue.length < 10) {
        return `Phone number must be exactly 10 digits (current: ${inputValue.length})`;
      }
      return null;
    };
    
    const isValid = () => {
      if (isPhoneField) {
        return inputValue.length === 10 && /^\d{10}$/.test(inputValue);
      }
      if (isEmailField) {
        return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(inputValue);
      }
      return inputValue.trim().length > 0;
    };
    
    const getFieldIcon = () => {
      if (collectingField === 'name') return <UserOutlined />;
      if (collectingField === 'email') return <MailOutlined />;
      if (collectingField === 'phone') return <PhoneOutlined />;
      return <FileTextOutlined />;
    };

    const getFieldDescription = () => {
      if (collectingField === 'name') return 'Enter your full name as it appears on official documents';
      if (collectingField === 'email') return 'Enter a valid email address where we can reach you';
      if (collectingField === 'phone') return 'Enter your 10-digit mobile number (without country code)';
      return 'Please provide the required information';
    };

    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>{getFieldIcon()}</span>
            <span>Complete Your Profile</span>
          </div>
        } 
        style={{ maxWidth: 600, margin: '0 auto' }}
      >
        <Alert
          message={`⚠️ Missing Information (${currentFieldIndex + 1} of ${totalMissing})`}
          description={
            totalMissing === 1 
              ? `We couldn't extract your ${collectingField} from the resume. Please provide it below.`
              : `We couldn't extract ${missingFields.join(', ')} from your resume. Please provide them one by one.`
          }
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <div style={{ 
          background: '#f5f5f5', 
          padding: 20, 
          borderRadius: 8, 
          marginBottom: 20,
          border: '2px dashed #d9d9d9'
        }}>
          <h3 style={{ marginTop: 0, color: '#1890ff' }}>
            {getFieldIcon()} Enter Your {collectingField.charAt(0).toUpperCase() + collectingField.slice(1)}
          </h3>
          <p style={{ color: '#666', marginBottom: 16 }}>
            {getFieldDescription()}
          </p>
          
          <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
            <Input
              placeholder={getPlaceholder()}
              value={inputValue}
              onChange={handleInputChange}
              onPressEnter={() => isValid() && handleCollectField()}
              size="large"
              maxLength={isPhoneField ? 10 : undefined}
              type={isPhoneField ? 'tel' : isEmailField ? 'email' : 'text'}
              status={inputValue.length > 0 && !isValid() ? 'error' : ''}
              autoFocus
            />
            <Button 
              type="primary" 
              onClick={handleCollectField} 
              size="large"
              disabled={!isValid()}
              style={{ minWidth: 100 }}
            >
              Next →
            </Button>
          </Space.Compact>
          
          {getValidationMessage() && (
            <p style={{ color: '#ff4d4f', fontSize: 14, margin: '8px 0 0 0' }}>
              ⚠️ {getValidationMessage()}
            </p>
          )}
          {isPhoneField && inputValue.length === 10 && (
            <p style={{ color: '#52c41a', fontSize: 14, margin: '8px 0 0 0' }}>
              ✓ Valid 10-digit phone number
            </p>
          )}
          {isEmailField && isValid() && inputValue.length > 0 && (
            <p style={{ color: '#52c41a', fontSize: 14, margin: '8px 0 0 0' }}>
              ✓ Valid email address
            </p>
          )}
        </div>
      </Card>
    );
  };

  const handleExitInterview = () => {
    modal.confirm({
      title: '⚠️ Exit Interview?',
      content: 'Are you sure you want to exit? Your current progress will be saved and marked as incomplete.',
      okText: 'Yes, Exit',
      cancelText: 'Continue Interview',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (currentSession) {
          // Mark session as paused/incomplete
          dispatch(completeSession({
            sessionId: currentSession.id,
            finalScore: 0,
            finalSummary: 'Interview exited by candidate. Incomplete submission.'
          }));
          
          message.info('Interview exited. Your progress has been saved.');
          handleStartNewInterview();
        }
      }
    });
  };

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
      <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }} className="scale-in">
        {/* Exit Button - Top Right Corner */}
        <Button
          danger
          icon={<LogoutOutlined />}
          onClick={handleExitInterview}
          style={{
            position: 'absolute',
            top: -50,
            right: 0,
            zIndex: 10,
            fontWeight: 600
          }}
        >
          Exit Interview
        </Button>
        
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
            <div style={{ marginBottom: 16 }}>
              {!isReadyToAnswer ? (
                <div style={{ 
                  padding: '12px 20px',
                  background: '#f0f9ff',
                  borderRadius: 8,
                  border: '1px solid #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12
                }}>
                  <span style={{ fontSize: 14, color: '#1e40af', fontWeight: 500 }}>
                    ⏱️ Preparation: <strong>{preparationTime}s</strong>
                  </span>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      if (preparationTimerRef.current) {
                        clearInterval(preparationTimerRef.current);
                      }
                      setIsReadyToAnswer(true);
                      setPreparationTime(0);
                    }}
                    style={{ color: '#3b82f6', fontWeight: 600 }}
                  >
                    Skip ⚡
                  </Button>
                </div>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleStartAnswer}
                  block
                  style={{
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 8,
                    background: autoStartCountdown <= 3 ? '#f59e0b' : '#10b981',
                    border: 'none'
                  }}
                >
                  {autoStartCountdown > 0 
                    ? `Start Answering (Auto-start in ${autoStartCountdown}s)` 
                    : 'Start Answering'}
                </Button>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: '10px 16px',
              background: remainingTime < 10 ? '#fef2f2' : '#f0fdf4',
              borderRadius: 8,
              border: `1px solid ${remainingTime < 10 ? '#ef4444' : '#10b981'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <span style={{ fontSize: 14, color: remainingTime < 10 ? '#991b1b' : '#065f46', fontWeight: 500 }}>
                {remainingTime < 10 ? '⚠️ Time Running Out!' : '⏰ Time Remaining'}
              </span>
              <span style={{ 
                fontSize: 20, 
                fontWeight: 700,
                color: remainingTime < 10 ? '#dc2626' : '#059669'
              }}>
                {formatTime(remainingTime)}
              </span>
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

          {/* Removed speech-to-text tip alert for cleaner UI */}

          <Input.TextArea
            placeholder={isPreparationPhase ? "Please wait for the timer to start..." : "Type your answer here or use the microphone button below..."}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            rows={8}
            disabled={isGrading || isPreparationPhase}
            style={{ marginBottom: 16 }}
          />

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {!isPreparationPhase && isSpeechRecognitionSupported() && remainingTime > 0 && (
              <Button
                type={isSpeechToTextActive ? 'default' : 'dashed'}
                danger={isSpeechToTextActive}
                icon={isSpeechToTextActive ? <StopOutlined /> : <AudioOutlined />}
                onClick={isSpeechToTextActive ? stopSpeechRecognition : startSpeechRecognition}
                disabled={isGrading || remainingTime <= 0}
                size="large"
                block
                style={{ height: 48 }}
              >
                {isSpeechToTextActive ? 'Stop Voice Input' : 'Enable Voice Input'}
              </Button>
            )}
            
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmitAnswer}
              loading={isGrading}
              disabled={isGrading || isPreparationPhase || currentAnswer.trim().length === 0}
              size="large"
              block
              style={{
                background: currentAnswer.trim().length === 0 ? '#d9d9d9' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                height: 56
              }}
            >
              {isGrading ? 'Grading Your Answer...' : isPreparationPhase ? 'Preparation Time...' : currentAnswer.trim().length === 0 ? 'Type Your Answer First' : 'Submit Answer'}
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
    
    // Calculate statistics
    const totalQuestions = currentSession?.questions.length || 0;
    const answeredQuestions = currentSession?.answers.filter(ans => (ans.text?.trim() || '').length > 0).length || 0;
    const unansweredQuestions = totalQuestions - answeredQuestions;
    const totalScore = currentSession?.answers.reduce((sum, ans) => sum + (ans.llmScore || 0), 0) || 0;
    const maxScore = totalQuestions * 10;
    
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
    
    const getPerformanceMessage = () => {
      if (score >= 80) return 'Outstanding! You demonstrated excellent technical knowledge and communication skills.';
      if (score >= 60) return 'Good work! You showed solid understanding with room for improvement in some areas.';
      if (score >= 40) return 'Fair performance. Consider reviewing the topics covered and practicing more.';
      if (score >= 20) return 'You need more preparation. Focus on strengthening your fundamentals.';
      return 'Limited responses detected. Please ensure you answer all questions in future interviews.';
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
          message={getPerformanceMessage()}
          type={score >= 60 ? 'success' : score >= 40 ? 'warning' : 'info'}
          showIcon
          style={{ marginBottom: 20 }}
        />

        <div style={{ 
          background: '#f5f5f5', 
          padding: 20, 
          borderRadius: 8,
          marginBottom: 20
        }}>
          <h3 style={{ marginTop: 0 }}>📊 Detailed Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, color: '#666' }}>Total Questions</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>{totalQuestions}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: '#666' }}>Questions Answered</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{answeredQuestions}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: '#666' }}>Questions Skipped</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 'bold', color: unansweredQuestions > 0 ? '#ff4d4f' : '#52c41a' }}>{unansweredQuestions}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: '#666' }}>Total Points</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>{totalScore}/{maxScore}</p>
            </div>
          </div>
          <div style={{ 
            background: '#fff', 
            padding: 12, 
            borderRadius: 6,
            border: '1px solid #d9d9d9'
          }}>
            <p style={{ margin: 0, fontWeight: 500, marginBottom: 8 }}>AI Feedback:</p>
            <p style={{ lineHeight: 1.8, marginBottom: 0 }}>
              {currentSession?.finalSummary || 'Your interview has been recorded and will be reviewed by our team.'}
            </p>
          </div>
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
          console.log('🚀 Start Interview button clicked');
          console.log('currentCandidate:', currentCandidate);
          console.log('resumeText length:', resumeText?.length);
          
          if (currentCandidate && resumeText) {
            console.log('✅ Starting interview for:', currentCandidate.name);
            startInterview(currentCandidate.id, resumeText);
          } else {
            console.log('❌ Missing data - candidate:', !!currentCandidate, 'resumeText:', !!resumeText);
            message.error('Missing candidate information or resume content. Please upload resume again.');
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
