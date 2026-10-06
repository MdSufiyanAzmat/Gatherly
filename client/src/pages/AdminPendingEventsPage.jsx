import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { approveEvent, fetchPendingEvents, rejectEvent } from '../store/eventsSlice';

const AdminPendingEventsPage = () => {
    const { user } = useContext(AuthContext);
    const dispatch = useDispatch();
    const { pendingEvents, loading, error } = useSelector((state) => state.events);
    const [rejecting, setRejecting] = useState(null);
    const [reason, setReason] = useState('');
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        if (user?.role === 'admin') dispatch(fetchPendingEvents());
    }, [dispatch, user]);

    if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

    const approve = async (id) => {
        setActionError('');
        try {
            await dispatch(approveEvent(id)).unwrap();
            dispatch(fetchPendingEvents());
        } catch (message) { setActionError(message); }
    };

    const reject = async () => {
        if (!reason.trim()) return setActionError('Please provide a rejection reason.');
        setActionError('');
        try {
            await dispatch(rejectEvent({ id: rejecting, reason })).unwrap();
            setRejecting(null);
            setReason('');
            dispatch(fetchPendingEvents());
        } catch (message) { setActionError(message); }
    };

    return (
        <section className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-black">Pending event approvals</h1>
            <p className="mt-2 text-gray-600">Review community event submissions before they go public.</p>
            {(error || actionError) && <p className="mt-5 rounded bg-red-50 p-4 text-red-700">{actionError || error}</p>}
            <div className="mt-7 overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-4">Event</th><th className="px-5 py-4">Organizer</th><th className="px-5 py-4">Date & location</th><th className="px-5 py-4">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {pendingEvents.map((event) => <tr key={event._id}>
                            <td className="px-5 py-4"><p className="font-bold text-gray-900">{event.title}</p><p className="mt-1 max-w-xs text-gray-500">{event.description}</p></td>
                            <td className="px-5 py-4">{event.createdBy?.name || 'Unknown'}<br /><span className="text-gray-500">{event.createdBy?.email}</span></td>
                            <td className="px-5 py-4">{new Date(event.date).toLocaleDateString()}<br /><span className="text-gray-500">{event.location}</span></td>
                            <td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => approve(event._id)} disabled={loading} className="rounded bg-emerald-600 px-3 py-2 font-bold text-white disabled:opacity-50">Approve</button><button onClick={() => { setRejecting(event._id); setReason(''); setActionError(''); }} className="rounded bg-red-50 px-3 py-2 font-bold text-red-700">Reject</button></div></td>
                        </tr>)}
                    </tbody>
                </table>
                {!loading && pendingEvents.length === 0 && <p className="p-10 text-center text-gray-500">No events are awaiting approval.</p>}
            </div>
            {rejecting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><h2 className="text-xl font-bold">Reject event</h2><p className="mt-2 text-sm text-gray-600">Tell the organizer why this submission was rejected.</p><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows="4" className="mt-4 w-full rounded border border-gray-300 p-3" autoFocus /><div className="mt-5 flex justify-end gap-3"><button onClick={() => setRejecting(null)} className="rounded px-4 py-2 font-bold">Cancel</button><button onClick={reject} className="rounded bg-red-600 px-4 py-2 font-bold text-white">Reject event</button></div></div></div>}
        </section>
    );
};

export default AdminPendingEventsPage;
