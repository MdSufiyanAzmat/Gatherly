import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { cancelBooking, fetchMyBookings } from '../store/bookingsSlice';

const badge = (status) => ({ confirmed: 'bg-emerald-100 text-emerald-800', pending: 'bg-amber-100 text-amber-800', rejected: 'bg-red-100 text-red-800', cancelled: 'bg-gray-200 text-gray-700' }[status] || 'bg-gray-100');

const MyBookingsPage = () => {
    const dispatch = useDispatch(); const { myBookings, loading, error } = useSelector((state) => state.bookings);
    useEffect(() => { dispatch(fetchMyBookings()); }, [dispatch]);
    const cancel = async (id) => { if (window.confirm('Cancel this booking?')) await dispatch(cancelBooking(id)); };
    return <section className="mx-auto max-w-5xl"><h1 className="text-3xl font-black">My Bookings</h1><p className="mt-2 text-gray-600">Track organizer confirmation and payment-review status.</p>{error && <p className="mt-5 rounded bg-red-50 p-3 text-red-700">{error}</p>}{loading && <p className="mt-6">Loading…</p>}<div className="mt-6 grid gap-4 md:grid-cols-2">{myBookings.map((booking) => <article key={booking._id} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><h2 className="text-xl font-bold">{booking.eventId?.title || 'Deleted event'}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${badge(booking.status)}`}>{booking.status}</span></div><p className="mt-3 text-sm text-gray-600">{booking.eventId && new Date(booking.eventId.date).toLocaleDateString()}</p><p className="mt-2 font-semibold">{booking.amount ? `₹${booking.amount}` : 'Free'} · {booking.paymentStatus?.replace('_', ' ')}</p>{booking.status === 'rejected' && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800"><strong>Refund note:</strong> {booking.ownerNote || 'Contact the organizer directly regarding any payment or refund.'}</p>}<div className="mt-5 flex items-center gap-4">{booking.eventId && <Link className="text-sm font-bold underline" to={`/events/${booking.eventId._id}`}>View event</Link>}{['pending', 'confirmed'].includes(booking.status) && <button onClick={() => cancel(booking._id)} className="text-sm font-bold text-red-700">Cancel</button>}</div></article>)}</div>{!loading && myBookings.length === 0 && <p className="mt-6 rounded-xl bg-white p-10 text-center text-gray-500">You have no bookings yet.</p>}</section>;
};

export default MyBookingsPage;
