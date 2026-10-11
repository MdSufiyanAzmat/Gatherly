import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../utils/axios';

const request = async (thunkApi, callback) => {
    try {
        return await callback();
    } catch (error) {
        return thunkApi.rejectWithValue(error.response?.data?.message || 'Unable to complete the booking request.');
    }
};

export const fetchMyBookings = createAsyncThunk('bookings/fetchMine', async (_, thunkApi) =>
    request(thunkApi, async () => (await api.get('/bookings/my')).data.data)
);

export const fetchOwnedBookings = createAsyncThunk('bookings/fetchOwned', async (params, thunkApi) =>
    request(thunkApi, async () => (await api.get('/bookings/owned', { params })).data.data)
);

export const fetchOwnedSummary = createAsyncThunk('bookings/fetchOwnedSummary', async (_, thunkApi) =>
    request(thunkApi, async () => (await api.get('/bookings/owned/summary')).data.data)
);

export const cancelBooking = createAsyncThunk('bookings/cancel', async (id, thunkApi) =>
    request(thunkApi, async () => (await api.put(`/bookings/${id}/cancel`)).data.data)
);

export const ownerConfirmBooking = createAsyncThunk('bookings/ownerConfirm', async (id, thunkApi) =>
    request(thunkApi, async () => (await api.put(`/bookings/${id}/owner-confirm`)).data.data)
);

export const ownerRejectBooking = createAsyncThunk('bookings/ownerReject', async ({ id, reason }, thunkApi) =>
    request(thunkApi, async () => (await api.put(`/bookings/${id}/owner-reject`, { reason })).data.data)
);

const replaceBooking = (state, booking) => {
    state.myBookings = state.myBookings.map((item) => item._id === booking._id ? booking : item);
    state.ownedBookings = state.ownedBookings.map((item) => item._id === booking._id ? booking : item);
};

const bookingsSlice = createSlice({
    name: 'bookings',
    initialState: {
        myBookings: [],
        ownedBookings: [],
        summary: null,
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyBookings.fulfilled, (state, action) => { state.loading = false; state.myBookings = action.payload; })
            .addCase(fetchOwnedBookings.fulfilled, (state, action) => { state.loading = false; state.ownedBookings = action.payload; })
            .addCase(fetchOwnedSummary.fulfilled, (state, action) => { state.loading = false; state.summary = action.payload; })
            .addCase(cancelBooking.fulfilled, (state, action) => { state.loading = false; replaceBooking(state, action.payload); })
            .addCase(ownerConfirmBooking.fulfilled, (state, action) => { state.loading = false; replaceBooking(state, action.payload); })
            .addCase(ownerRejectBooking.fulfilled, (state, action) => { state.loading = false; replaceBooking(state, action.payload); })
            .addMatcher((action) => action.type.startsWith('bookings/') && action.type.endsWith('/pending'), (state) => {
                state.loading = true;
                state.error = null;
            })
            .addMatcher((action) => action.type.startsWith('bookings/') && action.type.endsWith('/rejected'), (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default bookingsSlice.reducer;
