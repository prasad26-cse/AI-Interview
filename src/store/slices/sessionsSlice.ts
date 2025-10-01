import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session, UUID, Answer } from '@/types';

interface SessionsState {
  sessions: Record<UUID, Session>;
  currentSessionId?: UUID;
}

const initialState: SessionsState = {
  sessions: {},
  currentSessionId: undefined,
};

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    createSession: (state, action: PayloadAction<Session>) => {
      state.sessions[action.payload.id] = action.payload;
      state.currentSessionId = action.payload.id;
    },
    setCurrentSession: (state, action: PayloadAction<UUID>) => {
      state.currentSessionId = action.payload;
    },
    updateSession: (state, action: PayloadAction<{ id: UUID; updates: Partial<Session> }>) => {
      const session = state.sessions[action.payload.id];
      if (session) {
        Object.assign(session, action.payload.updates);
        session.updatedAt = new Date().toISOString();
      }
    },
    addAnswer: (state, action: PayloadAction<{ sessionId: UUID; answer: Answer }>) => {
      const session = state.sessions[action.payload.sessionId];
      if (session) {
        session.answers.push(action.payload.answer);
        session.updatedAt = new Date().toISOString();
      }
    },
    advanceQuestion: (state, action: PayloadAction<UUID>) => {
      const session = state.sessions[action.payload];
      if (session) {
        session.currentIndex += 1;
        // Don't set start time here - let the preparation phase handle it
        session.questionStartTime = undefined;
        session.updatedAt = new Date().toISOString();
      }
    },
    setQuestionStartTime: (state, action: PayloadAction<{ sessionId: UUID; startTime: string }>) => {
      const session = state.sessions[action.payload.sessionId];
      if (session) {
        session.questionStartTime = action.payload.startTime;
      }
    },
    completeSession: (state, action: PayloadAction<{ sessionId: UUID; finalScore: number; finalSummary: string }>) => {
      const session = state.sessions[action.payload.sessionId];
      if (session) {
        session.status = 'completed';
        session.finalScore = action.payload.finalScore;
        session.finalSummary = action.payload.finalSummary;
        session.updatedAt = new Date().toISOString();
      }
    },
    deleteSession: (state, action: PayloadAction<UUID>) => {
      delete state.sessions[action.payload];
      if (state.currentSessionId === action.payload) {
        state.currentSessionId = undefined;
      }
    },
  },
});

export const {
  createSession,
  setCurrentSession,
  updateSession,
  addAnswer,
  advanceQuestion,
  setQuestionStartTime,
  completeSession,
  deleteSession,
} = sessionsSlice.actions;
export default sessionsSlice.reducer;
