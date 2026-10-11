import React, { useContext, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { submitEvent } from '../store/eventsSlice';
import { DEFAULT_EVENT_IMAGE } from '../utils/assets';
import SubmitEventForm from '../components/SubmitEventForm';

const initialForm = { title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '0', registrationLink: '', phoneNumber: '', paymentNotes: '' };

const CreateEventPage = () => {
    const { user } = useContext(AuthContext);
    const dispatch = useDispatch();
    const [form, setForm] = useState(initialForm);
    const [image, setImage] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const imagePreview = useMemo(() => image ? URL.createObjectURL(image) : DEFAULT_EVENT_IMAGE, [image]);
    const paid = Number(form.ticketPrice) > 0;

    if (!user) return <Navigate to="/login" replace />;
    if (submitted) return <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center"><div className="rounded-full bg-secondary/20 p-5 text-4xl">✓</div><h1 className="mt-6 text-3xl font-black">Sent for review</h1><p className="mt-3 text-gray-600">Your event will be published once an administrator approves it.</p><div className="mt-8 flex gap-3"><Link to="/" className="rounded-lg border px-4 py-2.5 font-bold">Back to home</Link><Link to="/events/mine" className="rounded-lg bg-primary px-4 py-2.5 font-bold text-white">View My Events</Link></div></section>;

    const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
    const submit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const data = new FormData();
            Object.entries(form).forEach(([key, value]) => data.append(key, value));
            if (image) data.append('image', image);
            if (qrCode) data.append('qrCode', qrCode);
            await dispatch(submitEvent(data)).unwrap();
            setSubmitted(true);
        } catch (message) {
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return <div className="mx-auto max-w-3xl rounded-2xl border border-gray-100 bg-white p-6 shadow-soft sm:p-10">
        <h1 className="font-heading text-3xl font-black">Submit an event</h1>
        <p className="mt-2 text-gray-600">Your event will be visible after an administrator approves it.</p>
        <SubmitEventForm form={form} image={image} imagePreview={imagePreview} paid={paid} submitting={submitting} error={error} onChange={update} onImageChange={(event) => setImage(event.target.files?.[0] || null)} onQrCodeChange={(event) => setQrCode(event.target.files?.[0] || null)} onSubmit={submit} />
    </div>;
};

export default CreateEventPage;
