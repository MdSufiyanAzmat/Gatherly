import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const closeMenu = () => setIsOpen(false);

    const handleLogout = () => {
        logout();
        closeMenu();
        navigate('/login');
    };

    const sharedLinkClass = 'rounded-lg px-3 py-2 text-sm font-semibold text-light/80 transition hover:bg-white/10 hover:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary';
    const links = user
        ? user.role === 'admin'
            ? [['Admin Dashboard', '/admin/dashboard'], ['Pending Approvals', '/admin/pending-events'], ['Dashboard', '/dashboard']]
            : [['Submit Event', '/events/submit'], ['My Events', '/events/mine'], ['My Bookings', '/my-bookings'], ['Dashboard', '/dashboard']]
        : [['Login', '/login']];

    return (
        <header className="sticky top-0 z-40 bg-dark shadow-lg">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Primary navigation">
                <div className="flex min-h-18 items-center justify-end py-3">
                    <Link to="/" onClick={closeMenu} className="mr-auto rounded-lg font-heading text-xl font-extrabold tracking-tight text-light focus:outline-none focus:ring-2 focus:ring-secondary">
                        Gatherly
                    </Link>
                    <button
                        type="button"
                        onClick={() => setIsOpen((value) => !value)}
                        className="rounded-lg p-2 text-light transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-secondary md:hidden"
                        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={isOpen}
                        aria-controls="primary-menu"
                    >
                        {isOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
                    </button>
                    <div className="hidden items-center gap-1 md:flex">
                        <Link to="/" className={sharedLinkClass}>Home</Link>
                        {links.map(([label, to]) => <Link key={to} to={to} className={sharedLinkClass}>{label}</Link>)}
                        {user ? (
                            <button onClick={handleLogout} className="ml-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-dark focus:outline-none focus:ring-2 focus:ring-secondary">Logout</button>
                        ) : (
                            <Link to="/register" className="ml-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-dark focus:outline-none focus:ring-2 focus:ring-secondary">Register</Link>
                        )}
                    </div>
                </div>
                <div id="primary-menu" className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out md:hidden ${isOpen ? 'grid-rows-[1fr] pb-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="min-h-0">
                        <div className="flex flex-col gap-1 border-t border-white/15 pt-3">
                            <Link to="/" onClick={closeMenu} className={sharedLinkClass}>Home</Link>
                            {links.map(([label, to]) => <Link key={to} to={to} onClick={closeMenu} className={sharedLinkClass}>{label}</Link>)}
                            {user ? (
                                <button onClick={handleLogout} className="mt-1 rounded-lg bg-primary px-4 py-2 text-left text-sm font-bold text-white transition hover:bg-dark focus:outline-none focus:ring-2 focus:ring-secondary">Logout</button>
                            ) : (
                                <Link to="/register" onClick={closeMenu} className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-dark focus:outline-none focus:ring-2 focus:ring-secondary">Register</Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
