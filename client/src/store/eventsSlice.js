import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../utils/axios';

const request = async (thunkApi, callback) => {
    try {
        return await callback();
    } catch (error) {
        return thunkApi.rejectWithValue(error.response?.data?.message || 'Unable to complete the event request');
    }
};

export const fetchPublicEvents = createAsyncThunk('events/fetchPublic', async (params, thunkApi) =>
    request(thunkApi, async () => (await api.get('/events', { params })).data.data)
);

export const fetchEventById = createAsyncThunk('events/fetchById', async (id, thunkApi) =>
    request(thunkApi, async () => (await api.get(`/events/${id}`)).data.data)
);

export const submitEvent = createAsyncThunk('events/submit', async (event, thunkApi) =>
    request(thunkApi, async () => (await api.post('/events', event)).data.data)
);

export const fetchMyEvents = createAsyncThunk('events/fetchMine', async (params = {}, thunkApi) =>
    request(thunkApi, async () => (await api.get('/events/mine', { params })).data.data)
);

export const fetchPendingEvents = createAsyncThunk('events/fetchPending', async (params = {}, thunkApi) =>
    request(thunkApi, async () => (await api.get('/events/admin/pending', { params })).data.data)
);

export const approveEvent = createAsyncThunk('events/approve', async (id, thunkApi) =>
    request(thunkApi, async () => (await api.patch(`/events/${id}/approve`)).data.data)
);

export const rejectEvent = createAsyncThunk('events/reject', async ({ id, reason }, thunkApi) =>
    request(thunkApi, async () => (await api.patch(`/events/${id}/reject`, { reason })).data.data)
);

export const deleteEvent = createAsyncThunk('events/delete', async (id, thunkApi) =>
    request(thunkApi, async () => {
        await api.delete(`/events/${id}`);
        return id;
    })
);

const eventsSlice = createSlice({
    name: 'events',
    initialState: {
        publicEvents: [],
        pagination: null,
        myEvents: [],
        myPagination: null,
        pendingEvents: [],
        pendingPagination: null,
        currentEvent: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearCurrentEvent: (state) => {
            state.currentEvent = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPublicEvents.fulfilled, (state, action) => {
                state.loading = false;
                state.publicEvents = action.payload.events;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchEventById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentEvent = action.payload;
            })
            .addCase(fetchMyEvents.fulfilled, (state, action) => {
                state.loading = false;
                state.myEvents = action.payload.events;
                state.myPagination = action.payload.pagination;
            })
            .addCase(fetchPendingEvents.fulfilled, (state, action) => {
                state.loading = false;
                state.pendingEvents = action.payload.events;
                state.pendingPagination = action.payload.pagination;
            })
            .addCase(approveEvent.fulfilled, (state, action) => {
                state.loading = false;
                state.pendingEvents = state.pendingEvents.filter((event) => event._id !== action.payload._id);
            })
            .addCase(rejectEvent.fulfilled, (state, action) => {
                state.loading = false;
                state.pendingEvents = state.pendingEvents.filter((event) => event._id !== action.payload._id);
            })
            .addCase(deleteEvent.fulfilled, (state, action) => {
                state.loading = false;
                state.myEvents = state.myEvents.filter((event) => event._id !== action.payload);
                state.pendingEvents = state.pendingEvents.filter((event) => event._id !== action.payload);
            })
            .addCase(submitEvent.fulfilled, (state, action) => {
                state.loading = false;
                state.myEvents.unshift(action.payload);
            })
            .addMatcher((action) => action.type.startsWith('events/') && action.type.endsWith('/pending'), (state) => {
                state.loading = true;
                state.error = null;
            })
            .addMatcher((action) => action.type.startsWith('events/') && action.type.endsWith('/rejected'), (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCurrentEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
