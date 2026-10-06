import React, { useContext, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { submitEvent } from '../store/eventsSlice';

const initialForm = { title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', imageUrl: '' };

const CreateEventPage = () => {
    const { user } = useContext(AuthContext);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!user) return <Navigate to="/login" replace />;

    const submit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await dispatch(submitEvent(form)).unwrap();
            setForm(initialForm);
            setToast('Event submitted! Awaiting admin approval.');
            setTimeout(() => navigate('/my-events'), 1200);
        } catch (message) {
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
            <h1 className="text-3xl font-black text-gray-900">Submit an event</h1>
            <p className="mt-2 text-gray-600">Your event will be visible after an administrator approves it.</p>
            {toast && <div role="status" className="mt-6 rounded-lg bg-emerald-50 p-4 font-medium text-emerald-800">{toast}</div>}
            {error && <div role="alert" className="mt-6 rounded-lg bg-red-50 p-4 font-medium text-red-700">{error}</div>}
            <form onSubmit={submit} className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                {[
                    ['title', 'Event title', 'text'], ['category', 'Category', 'text'], ['date', 'Date', 'date'],
                    ['location', 'Location', 'text'], ['totalSeats', 'Total seats', 'number'], ['ticketPrice', 'Ticket price', 'number'],
                    ['imageUrl', 'Image URL', 'url'],
                ].map(([name, label, type]) => (
                    <label key={name} className={name === 'imageUrl' ? 'md:col-span-2' : ''}>
                        <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
                        <input required min={type === 'number' ? 0 : undefined} type={type} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900" />
                    </label>
                ))}
                <label className="md:col-span-2">
                    <span className="mb-1 block text-sm font-semibold text-gray-700">Description</span>
                    <textarea required rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900" />
                </label>
                <button disabled={submitting} className="md:col-span-2 rounded-lg bg-gray-900 px-5 py-3 font-bold text-white hover:bg-black disabled:opacity-60">
                    {submitting ? 'Submitting…' : 'Submit for approval'}
                </button>
            </form>
        </div>
    );
};

export default CreateEventPage;
