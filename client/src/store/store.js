import { configureStore } from '@reduxjs/toolkit';
import eventsReducer from './eventsSlice';

export const store = configureStore({
    reducer: {
        events: eventsReducer,
    },
});
