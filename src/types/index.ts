export type UUID = string;

export type Difficulty = 'easy' | 'medium' | 'hard';
export type SessionStatus = 'in_progress' | 'completed' | 'paused';

export interface Candidate {
  id: UUID;
  name?: string;
  email?: string;
  phone?: string;
  resumeFileName?: string;
  createdAt: string;
  updatedAt: string;
  sessionId?: UUID;
}

export interface Question {
  id: UUID;
  text: string;
  difficulty: Difficulty;
  timeLimitSec: number;
  rubric?: string;
  gradingHints?: string;
}

export interface Answer {
  id: UUID;
  questionId: UUID;
  text: string;
  startTime: string;
  submitTime: string;
  durationSec: number;
  autoSubmitted: boolean;
  recordingBlobId?: string;
  llmScore?: number;
  llmFeedback?: string;
}

export interface Session {
  id: UUID;
  candidateId: UUID;
  questions: Question[];
  currentIndex: number;
  answers: Answer[];
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  finalScore?: number;
  finalSummary?: string;
  questionStartTime?: string;
}

export interface ChatMessage {
  id: UUID;
  type: 'system' | 'user' | 'question' | 'answer';
  content: string;
  timestamp: string;
}

export interface AppSettings {
  geminiApiKey?: string;
  openaiApiKey?: string;
  preferredProvider?: 'gemini' | 'openai';
}
