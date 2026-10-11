import { configureStore } from '@reduxjs/toolkit';
import eventsReducer from './eventsSlice';
import bookingsReducer from './bookingsSlice';

export const store = configureStore({
    reducer: {
        events: eventsReducer,
        bookings: bookingsReducer,
    },
});
