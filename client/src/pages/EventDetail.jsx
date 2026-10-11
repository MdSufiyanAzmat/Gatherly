import React, { useContext, useEffect, useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import EventStatusBadge from '../components/EventStatusBadge';
import { assetUrl, DEFAULT_EVENT_IMAGE } from '../utils/assets';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [payment, setPayment] = useState(null);
    const [notice, setNotice] = useState('');
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);

    useEffect(() => {
        api.get(`/events/${id}`)
            .then(({ data }) => {
                const loadedEvent = data.data;
                setEvent(loadedEvent);
                setLikeCount(loadedEvent.likeCount || 0);
                setLiked(Boolean(loadedEvent.likedByCurrentUser));
                setComments(loadedEvent.comments || []);
            })
            .catch(() => setError('Failed to load event details.'))
            .finally(() => setLoading(false));
    }, [id]);

    const requireLogin = () => {
        if (!user) {
            navigate('/login');
            return true;
        }
        return false;
    };

    const registerExternal = async () => {
        if (requireLogin()) return;
        window.open(event.registrationLink, '_blank', 'noopener,noreferrer');
        api.post(`/events/${event._id}/register`).catch(() => {});
    };

    const register = async () => {
        if (requireLogin()) return;
        setActionLoading(true);
        setError('');
        try {
            if (event.registrationLink) return registerExternal();
            if (event.isPaid || Number(event.ticketPrice) > 0) {
                const { data } = await api.post(`/bookings/paid/${event._id}/initiate`);
                setPayment(data.data);
            } else {
                await api.post(`/bookings/free/${event._id}`);
                setNotice('Registration confirmed.');
                setEvent((value) => ({ ...value, availableSeats: value.availableSeats - 1 }));
            }
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not complete registration.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLike = async () => {
        if (requireLogin()) return;
        try {
            const { data } = await api.post(`/events/${event._id}/like`);
            setLiked(data.data.liked);
            setLikeCount(data.data.likeCount);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not update like.');
        }
    };

    const handleComment = async (text) => {
        if (requireLogin()) return;
        const value = text.trim();
        if (!value) return;
        try {
            const { data } = await api.post(`/events/${event._id}/comments`, { text: value });
            setComments((items) => [...items, data.data]);
            setCommentText('');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not post comment.');
        }
    };

    if (loading) return <p className="py-20 text-center text-xl font-semibold">Loading…</p>;
    if (!event) return <p className="py-20 text-center text-red-600">{error || 'Event not found'}</p>;

    const soldOut = event.availableSeats <= 0;
    const isCreator = user?._id === event.createdBy?._id;

    return (
        <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <img src={assetUrl(event.image?.url)} onError={(target) => { target.currentTarget.src = DEFAULT_EVENT_IMAGE; }} alt={event.title} className="h-80 w-full object-cover" />
            <div className="p-8 md:p-12">
                <div className="flex flex-col justify-between gap-8 md:flex-row">
                    <div>
                        <div className="mb-3 flex gap-2"><span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-bold uppercase text-dark">{event.category}</span>{isCreator && event.status !== 'approved' && <EventStatusBadge status={event.status} />}</div>
                        <h1 className="font-heading text-4xl font-black">{event.title}</h1>
                        <p className="mt-4 max-w-2xl text-lg text-gray-600">{event.description}</p>
                        <p className="mt-5 text-sm font-semibold">Organized by {event.createdBy?.name || 'Gatherly'}</p>
                        {isCreator && event.status === 'rejected' && <p className="mt-4 rounded bg-red-50 p-3 text-red-700">Rejection reason: {event.rejectionReason}</p>}
                        <button type="button" onClick={handleLike} aria-pressed={liked} aria-label={user ? 'Like this event' : 'Sign in to like this event'} className={`mt-6 inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 font-bold transition focus:outline-none focus:ring-4 focus:ring-primary/20 ${liked ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}>
                            <FaHeart aria-hidden="true" /> {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                        </button>
                    </div>
                    <aside className="w-full shrink-0 rounded-xl border bg-gray-50 p-6 md:w-80">
                        <p className="text-sm font-bold uppercase text-gray-500">Ticket price</p>
                        <p className="mt-1 text-2xl font-black">{Number(event.ticketPrice) ? `₹${event.ticketPrice}` : <span className="text-emerald-600">Free</span>}</p>
                        <p className="mt-5 text-sm font-bold uppercase text-gray-500">Availability</p><p className="mt-1 font-bold">{event.availableSeats} / {event.totalSeats} seats</p>
                        <p className="mt-5 text-sm"><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p><p className="mt-2 text-sm"><strong>Location:</strong> {event.location}</p>
                        <button onClick={register} disabled={actionLoading || (!event.registrationLink && soldOut)} className="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-bold text-white transition hover:bg-dark focus:outline-none focus:ring-4 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50">{actionLoading ? 'Processing…' : event.registrationLink ? 'Register on organizer site' : soldOut ? 'Sold out' : Number(event.ticketPrice) ? 'Pay & register' : 'Register free'}</button>
                        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}{notice && <p className="mt-3 rounded bg-emerald-50 p-2 text-sm text-emerald-700">{notice}</p>}
                    </aside>
                </div>
                <section aria-labelledby="comments-heading" className="mt-10 border-t border-gray-100 pt-8">
                    <h2 id="comments-heading" className="font-heading text-2xl font-extrabold">Comments</h2>
                    {user ? (
                        <form onSubmit={(submitted) => { submitted.preventDefault(); handleComment(commentText); }} className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <label className="sr-only" htmlFor="event-comment">Write a comment</label>
                            <textarea id="event-comment" value={commentText} onChange={(input) => setCommentText(input.target.value)} placeholder="Write a comment…" rows="2" className="min-h-11 grow rounded-lg border border-gray-300 px-3 py-2.5 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 placeholder:text-muted" />
                            <button type="submit" className="self-end rounded-lg bg-primary px-5 py-2.5 font-bold text-white transition hover:bg-dark focus:outline-none focus:ring-4 focus:ring-primary/25 sm:self-auto">Post</button>
                        </form>
                    ) : <p className="mt-4 rounded-lg bg-light p-4 text-sm text-dark">Please <Link to="/login" className="font-bold text-primary underline focus:outline-none focus:ring-2 focus:ring-primary">sign in</Link> to like or comment on this event.</p>}
                    <div className="mt-6 space-y-4">
                        {comments.length ? comments.map((comment) => <article key={comment.id || comment._id} className="rounded-xl bg-light p-4"><div className="flex items-center justify-between gap-4"><h3 className="font-bold text-dark">{comment.author?.name || comment.author || 'Guest'}</h3><time className="text-xs text-muted" dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time></div><p className="mt-2 text-gray-700">{comment.text}</p></article>) : <p className="rounded-xl bg-light p-4 text-sm text-muted">No comments yet. Start the conversation.</p>}
                    </div>
                </section>
            </div>
            {payment && <PaymentModal booking={payment.booking} paymentInfo={payment.paymentInfo} onClose={() => setPayment(null)} onSubmitted={() => { setPayment(null); setNotice('Payment proof submitted. The organizer will review it.'); }} />}
        </div>
    );
};

export default EventDetail;
