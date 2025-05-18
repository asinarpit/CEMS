import { configureStore } from '@reduxjs/toolkit';
import themeReducer from '../features/theme/themeSlice';
import authReducer from '../features/auth/authSlice';
import eventReducer from '../features/events/eventSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer,
    events: eventReducer
  },
}); 