import React from 'react';

const styles = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
};

const EventStatusBadge = ({ status }) => (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'pending' ? 'Pending Approval' : status}
    </span>
);

export default EventStatusBadge;
