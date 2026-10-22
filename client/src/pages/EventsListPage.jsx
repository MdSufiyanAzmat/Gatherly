import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchPublicEvents } from '../store/eventsSlice';
import { assetUrl, DEFAULT_EVENT_IMAGE } from '../utils/assets';
import SubscribeSection from '../components/SubscribeSection';
import Pagination from '../components/Pagination';
import { isEventFinished } from '../utils/eventDate';

const EventsListPage = () => {
    const dispatch = useDispatch();
    const { publicEvents: events, pagination, loading, error } = useSelector((state) => state.events);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const latestRequest = useRef('');

    useEffect(() => {
        const query = search.trim();
        const requestKey = `${page}:${query}`;
        if (latestRequest.current === requestKey) return undefined;

        const timer = setTimeout(() => {
            latestRequest.current = requestKey;
            dispatch(fetchPublicEvents({ search: query, page }));
        }, 300);
        return () => clearTimeout(timer);
    }, [dispatch, search, page]);

    return (
        <section>
            <div className="mb-10 rounded-2xl bg-dark px-6 py-10 text-light shadow-soft sm:px-10">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-secondary">Find your people</p>
                <h1 className="mt-2 font-heading text-4xl font-black">Discover events</h1>
                <p className="mt-2 max-w-xl text-light/75">Find approved events from organizers in your community.</p>
                <label className="sr-only" htmlFor="event-search">Search events</label>
                <input id="event-search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by title, category, or location" className="mt-6 w-full max-w-xl rounded-xl border-2 border-transparent bg-white px-4 py-3 text-dark outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/20 placeholder:text-muted" />
            </div>
            {loading && <p className="py-10 text-center">Loading events…</p>}
            {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
            {!loading && !error && events.length === 0 && <p className="py-10 text-center text-gray-500">No approved events found.</p>}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                    <article key={event._id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-hover">
                        <img src={assetUrl(event.image?.url || DEFAULT_EVENT_IMAGE)} onError={(e) => { e.currentTarget.src = DEFAULT_EVENT_IMAGE; }} alt={event.title} className="h-44 w-full object-cover" />
                        <div className="p-5">
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{event.category}</p>
                            <h2 className="mt-2 text-xl font-bold text-gray-900">{event.title}</h2>
                            <p className="mt-3 text-sm text-gray-600">{new Date(event.date).toLocaleDateString()} · {event.location}</p>
                            <p className="mt-3 text-sm font-medium text-gray-700">Posted by {event.createdBy?.name || 'Gatherly'}</p>
                            <p className="mt-2 text-sm font-bold">{event.ticketPrice ? `₹${event.ticketPrice}` : 'Free'}</p>
                            {isEventFinished(event.date) && <p className="mt-2 text-sm font-bold text-red-600">Finished</p>}
                            <Link to={`/events/${event._id}`} className="mt-5 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-dark focus:outline-none focus:ring-4 focus:ring-primary/25">View event</Link>
                        </div>
                    </article>
                ))}
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
            <SubscribeSection />
        </section>
    );
};

export default EventsListPage;
