import React, { useState } from 'react';
import api from '../utils/axios';
import { assetUrl } from '../utils/assets';

const PaymentModal = ({ booking, paymentInfo, onClose, onSubmitted }) => {
    const [screenshot, setScreenshot] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const copyPhone = async () => {
        try {
            await navigator.clipboard.writeText(paymentInfo.phoneNumber);
        } catch {
            setError('Could not copy automatically. Please copy the UPI ID manually.');
        }
    };

    const submitProof = async (event) => {
        event.preventDefault();
        if (!screenshot) return setError('Choose the payment screenshot first.');
        setSubmitting(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('screenshot', screenshot);
            await api.post(`/bookings/${booking._id}/proof`, formData);
            onSubmitted();
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not submit payment proof.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Complete payment">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div><h2 className="text-2xl font-black">Pay the organizer</h2><p className="mt-1 text-sm text-gray-600">Gatherly does not collect this payment.</p></div>
                    <button onClick={onClose} className="rounded p-2 text-xl text-gray-500 hover:bg-gray-100" aria-label="Close">×</button>
                </div>
                <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">Your seat is held temporarily. Complete payment to secure it.</p>
                {paymentInfo.phoneNumber && <div className="mt-5 rounded-xl bg-gray-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">UPI phone / ID</p><div className="mt-2 flex gap-2"><code className="min-w-0 grow break-all font-bold text-gray-900">{paymentInfo.phoneNumber}</code><button onClick={copyPhone} className="rounded bg-gray-900 px-3 py-1.5 text-sm font-bold text-white">Copy</button></div></div>}
                {paymentInfo.qrCode?.url && <div className="mt-5 text-center"><p className="mb-2 text-sm font-bold text-gray-700">Scan the organizer’s QR code</p><img className="mx-auto max-h-56 rounded-lg border object-contain" src={assetUrl(paymentInfo.qrCode.url)} alt="Organizer payment QR code" /></div>}
                {paymentInfo.notes && <p className="mt-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-900">{paymentInfo.notes}</p>}
                <form onSubmit={submitProof} className="mt-6">
                    <label className="block text-sm font-bold text-gray-700">Upload payment screenshot</label>
                    <input className="mt-2 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setScreenshot(event.target.files?.[0] || null)} />
                    {error && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                    <button disabled={submitting} className="mt-5 w-full rounded-lg bg-gray-900 px-4 py-3 font-bold text-white disabled:opacity-60">{submitting ? 'Submitting…' : "I've paid — Submit proof"}</button>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
