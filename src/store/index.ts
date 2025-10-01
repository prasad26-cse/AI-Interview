import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import localForage from 'localforage';

import candidatesReducer from './slices/candidatesSlice';
import sessionsReducer from './slices/sessionsSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

const persistConfig = {
  key: 'root',
  storage: localForage,
  whitelist: ['candidates', 'sessions', 'auth'],
};

const rootReducer = combineReducers({
  candidates: candidatesReducer,
  sessions: sessionsReducer,
  auth: authReducer,
  ui: uiReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
