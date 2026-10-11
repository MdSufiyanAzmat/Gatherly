import React, { useState } from 'react';
import api from '../utils/axios';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SubscribeSection = ({ handleSubscribe = (email) => api.post('/subscriptions', { email }) }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');
        if (!emailPattern.test(email.trim())) {
            setError('Enter a valid email address to subscribe.');
            return;
        }

        setSubmitting(true);
        try {
            await handleSubscribe(email.trim());
            setMessage("You're subscribed! We'll notify you about new events.");
            setEmail('');
        } catch {
            setError('We could not subscribe you right now. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section aria-labelledby="subscribe-heading" className="my-16 overflow-hidden rounded-2xl bg-secondary p-8 shadow-soft md:p-12">
            <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-dark/70">Never miss a moment</p>
                <h2 id="subscribe-heading" className="mt-2 font-heading text-3xl font-extrabold text-dark">Get new events in your inbox</h2>
                <p className="mt-3 text-dark/80">A friendly heads-up when something worth gathering for is happening nearby.</p>
                <form onSubmit={submit} className="mx-auto mt-7 flex max-w-xl flex-col gap-3 sm:flex-row">
                    <label className="sr-only" htmlFor="subscription-email">Email address</label>
                    <input
                        id="subscription-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Enter your email to get event updates"
                        className="min-w-0 grow rounded-xl border-2 border-transparent bg-white px-4 py-3 text-dark outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20 placeholder:text-muted"
                        aria-describedby="subscription-feedback"
                    />
                    <button type="submit" disabled={submitting} className="rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-md transition hover:bg-dark focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70">
                        {submitting ? 'Subscribing…' : 'Subscribe'}
                    </button>
                </form>
                <div id="subscription-feedback" className="mt-3 min-h-6 text-sm" aria-live="polite">
                    {message && <p className="font-semibold text-dark">{message}</p>}
                    {error && <p className="font-semibold text-red-700">{error}</p>}
                </div>
            </div>
        </section>
    );
};

export default SubscribeSection;
