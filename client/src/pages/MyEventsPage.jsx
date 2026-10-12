import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import EventStatusBadge from '../components/EventStatusBadge';
import { deleteEvent, fetchMyEvents } from '../store/eventsSlice';
import Pagination from '../components/Pagination';

const MyEventsPage = () => {
    const { user } = useContext(AuthContext);
    const dispatch = useDispatch();
    const { myEvents, myPagination, loading, error } = useSelector((state) => state.events);
    const [page, setPage] = React.useState(1);

    useEffect(() => {
        if (user) dispatch(fetchMyEvents({ page }));
    }, [dispatch, user, page]);

    if (!user) return <Navigate to="/login" replace />;

    const removeEvent = async (event) => {
        if (!window.confirm(`Delete "${event.title}"?`)) return;
        try {
            await dispatch(deleteEvent(event._id)).unwrap();
        } catch (message) {
            window.alert(message);
        }
    };

    return (
        <section className="mx-auto max-w-5xl">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                <div><h1 className="text-3xl font-black">My event submissions</h1><p className="mt-1 text-gray-600">Track each event’s approval status.</p></div>
                <Link to="/events/submit" className="rounded-lg bg-gray-900 px-4 py-2.5 font-bold text-white">Submit an event</Link>
            </div>
            {loading && <p>Loading your events…</p>}
            {error && <p className="rounded bg-red-50 p-4 text-red-700">{error}</p>}
            {!loading && !error && myEvents.length === 0 && <p className="rounded-xl bg-white p-10 text-center text-gray-500">You have not submitted any events yet.</p>}
            <div className="space-y-4">
                {myEvents.map((event) => (
                    <article key={event._id} className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="mb-2"><EventStatusBadge status={event.status} /></div>
                            <h2 className="text-xl font-bold">{event.title}</h2>
                            <p className="mt-1 text-sm text-gray-600">{new Date(event.date).toLocaleDateString()} · {event.location}</p>
                            {event.status === 'rejected' && <p className="mt-2 text-sm text-red-700">Reason: {event.rejectionReason}</p>}
                        </div>
                        <div className="flex gap-3">
                            <Link to={`/events/${event._id}`} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold">View</Link>
                            {['pending', 'rejected'].includes(event.status) && <button onClick={() => removeEvent(event)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700">Delete</button>}
                        </div>
                    </article>
                ))}
            </div>
            <Pagination pagination={myPagination} onPageChange={setPage} />
        </section>
    );
};

export default MyEventsPage;
