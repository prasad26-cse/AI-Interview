import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Candidate, UUID } from '@/types';

interface CandidatesState {
  candidates: Record<UUID, Candidate>;
}

const initialState: CandidatesState = {
  candidates: {},
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      state.candidates[action.payload.id] = action.payload;
    },
    updateCandidate: (state, action: PayloadAction<{ id: UUID; updates: Partial<Candidate> }>) => {
      const candidate = state.candidates[action.payload.id];
      if (candidate) {
        Object.assign(candidate, action.payload.updates);
        candidate.updatedAt = new Date().toISOString();
      }
    },
    deleteCandidate: (state, action: PayloadAction<UUID>) => {
      delete state.candidates[action.payload];
    },
  },
});

export const { addCandidate, updateCandidate, deleteCandidate } = candidatesSlice.actions;
export default candidatesSlice.reducer;
