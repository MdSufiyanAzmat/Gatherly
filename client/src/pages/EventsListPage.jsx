import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchPublicEvents } from '../store/eventsSlice';

const EventsListPage = () => {
    const dispatch = useDispatch();
    const { publicEvents: events, loading, error } = useSelector((state) => state.events);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => dispatch(fetchPublicEvents({ search })), 300);
        return () => clearTimeout(timer);
    }, [dispatch, search]);

    return (
        <section>
            <div className="mb-8 rounded-2xl bg-gray-900 px-6 py-10 text-white sm:px-10">
                <h1 className="text-4xl font-black">Discover events</h1>
                <p className="mt-2 text-gray-300">Find approved events from organizers in your community.</p>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, category, or location" className="mt-6 w-full max-w-xl rounded-lg bg-white px-4 py-3 text-gray-900 outline-none" />
            </div>
            {loading && <p className="py-10 text-center">Loading events…</p>}
            {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
            {!loading && !error && events.length === 0 && <p className="py-10 text-center text-gray-500">No approved events found.</p>}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                    <article key={event._id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        {event.imageUrl && <img src={event.imageUrl} alt={event.title} className="h-44 w-full object-cover" />}
                        <div className="p-5">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{event.category}</p>
                            <h2 className="mt-2 text-xl font-bold text-gray-900">{event.title}</h2>
                            <p className="mt-3 text-sm text-gray-600">{new Date(event.date).toLocaleDateString()} · {event.location}</p>
                            <p className="mt-3 text-sm font-medium text-gray-700">Organized by {event.createdBy?.name || 'Eventora'}</p>
                            <Link to={`/events/${event._id}`} className="mt-5 inline-block font-bold text-gray-900 underline">View event</Link>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default EventsListPage;
