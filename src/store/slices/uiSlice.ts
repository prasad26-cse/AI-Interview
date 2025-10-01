import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  activeTab: 'interviewee' | 'interviewer';
  showWelcomeBack: boolean;
  showSettings: boolean;
}

const initialState: UiState = {
  activeTab: 'interviewee',
  showWelcomeBack: false,
  showSettings: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'interviewee' | 'interviewer'>) => {
      state.activeTab = action.payload;
    },
    setShowWelcomeBack: (state, action: PayloadAction<boolean>) => {
      state.showWelcomeBack = action.payload;
    },
    setShowSettings: (state, action: PayloadAction<boolean>) => {
      state.showSettings = action.payload;
    },
  },
});

export const { setActiveTab, setShowWelcomeBack, setShowSettings } = uiSlice.actions;
export default uiSlice.reducer;
