import React from 'react';

/** A compact, scalable mark representing people coming together. */
const GatherlyLogo = ({
    className = '',
    size = 40,
    showWordmark = true,
    label = 'Gatherly',
    primaryColor = 'currentColor',
    secondaryColor = '#90CAF9',
    foregroundColor = '#E3F2FD',
}) => (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label={label}>
        <svg
            aria-hidden="true"
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="19" cy="24" r="14" fill={primaryColor} opacity="0.95" />
            <circle cx="29" cy="24" r="14" fill={secondaryColor} opacity="0.92" />
            <path d="M30 18.5a8.5 8.5 0 1 0 0 11.1" stroke={foregroundColor} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M29 24h8" stroke={foregroundColor} strokeWidth="3.5" strokeLinecap="round" />
        </svg>
        {showWordmark && <span className="font-heading text-xl font-extrabold tracking-tight">Gatherly</span>}
    </span>
);

export default GatherlyLogo;
