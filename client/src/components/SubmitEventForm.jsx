import React from 'react';
import { DEFAULT_EVENT_IMAGE } from '../utils/assets';

const fieldClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-dark outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 placeholder:text-muted';

const SubmitEventForm = ({ form, image, imagePreview, paid, submitting, error, onChange, onImageChange, onQrCodeChange, onSubmit }) => (
    <>
        {error && <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
        <form onSubmit={onSubmit} className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            <label><span className="mb-1 block text-sm font-semibold">Event title</span><input required type="text" value={form.title} onChange={onChange('title')} placeholder="e.g. Annual Tech Meetup 2026" className={fieldClass} /></label>
            <label><span className="mb-1 block text-sm font-semibold">Category</span><input required type="text" value={form.category} onChange={onChange('category')} placeholder="Choose a category" className={fieldClass} /></label>
            <label><span className="mb-1 block text-sm font-semibold">Date</span><input required type="date" value={form.date} onChange={onChange('date')} placeholder="Select event date" title="Select event date" className={fieldClass} /></label>
            <label><span className="mb-1 block text-sm font-semibold">Location</span><input required type="text" value={form.location} onChange={onChange('location')} placeholder="e.g. Bengaluru Convention Center" className={fieldClass} /></label>
            <label><span className="mb-1 block text-sm font-semibold">Total seats</span><input required min="1" type="number" value={form.totalSeats} onChange={onChange('totalSeats')} placeholder="e.g. 100" className={fieldClass} /></label>
            <label><span className="mb-1 block text-sm font-semibold">Ticket price</span><input required min="0" type="number" value={form.ticketPrice} onChange={onChange('ticketPrice')} placeholder="e.g. 499 (or 0 for free)" className={fieldClass} /></label>
            <label className="md:col-span-2"><span className="mb-1 block text-sm font-semibold">Description</span><textarea required rows="5" value={form.description} onChange={onChange('description')} placeholder="Describe your event in a few sentences…" className={fieldClass} /></label>
            <label className="md:col-span-2"><span className="mb-1 block text-sm font-semibold">External registration link <span className="font-normal text-muted">(optional)</span></span><input type="url" value={form.registrationLink} onChange={onChange('registrationLink')} placeholder="https://your-event-page.example" className={fieldClass} /></label>
            <label><span className="mb-1 block text-sm font-semibold">Event banner</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={onImageChange} className="w-full rounded-lg text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-secondary/20 file:px-3 file:py-2 file:font-semibold file:text-dark hover:file:bg-secondary/30" aria-describedby="event-banner-hint" /><span id="event-banner-hint" className="mt-1 block text-xs text-muted">Upload an event banner. Image URLs can be added when a remote-image endpoint is connected.</span></label>
            <img src={imagePreview || DEFAULT_EVENT_IMAGE} onError={(event) => { event.currentTarget.src = DEFAULT_EVENT_IMAGE; }} alt={image ? 'Selected event banner preview' : 'Default event banner preview'} className="h-28 w-full rounded-lg border object-cover" />
            {paid && <div className="md:col-span-2 rounded-xl border border-primary/30 bg-primary/5 p-4"><h2 className="font-bold">Organizer-direct payment</h2><p className="mt-1 text-sm text-gray-600">Buyers pay your UPI/QR directly. Gatherly never processes the payment.</p><div className="mt-4 grid gap-4 md:grid-cols-2"><label><span className="mb-1 block text-sm font-semibold">UPI phone / ID</span><input value={form.phoneNumber} onChange={onChange('phoneNumber')} placeholder="Your UPI ID or phone number" className={fieldClass} /></label><label><span className="mb-1 block text-sm font-semibold">Payment QR image</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={onQrCodeChange} className="w-full rounded-lg text-sm" /></label></div><label className="mt-4 block"><span className="mb-1 block text-sm font-semibold">Payment notes</span><textarea value={form.paymentNotes} onChange={onChange('paymentNotes')} placeholder="Add payment instructions for attendees" className={fieldClass} rows="2" /></label></div>}
            <button disabled={submitting} className="md:col-span-2 rounded-lg bg-primary px-5 py-3 font-bold text-white shadow-sm transition hover:bg-dark focus:outline-none focus:ring-4 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Submitting…' : 'Submit for approval'}</button>
        </form>
    </>
);

export default SubmitEventForm;
