import React from 'react';
import { Link } from 'react-router-dom';
import GatherlyLogo from './GatherlyLogo';

const Footer = () => (
    <footer className="relative left-1/2 mt-16 w-screen -translate-x-1/2 bg-dark text-light">
        <div className="container mx-auto grid gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr] lg:px-8">
            <div>
                <GatherlyLogo className="text-light" primaryColor="#2196F3" />
                <p className="mt-4 max-w-sm leading-relaxed text-light/75">Bringing people together, one event at a time.</p>
            </div>
            <nav aria-label="Footer navigation">
                <h2 className="font-heading font-bold">Quick Links</h2>
                <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-light/75">
                    {['About', 'Contact', 'Privacy Policy', 'Terms of Service', 'Help Center'].map((item) => (
                        <li key={item}><Link to="/" className="transition hover:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary">{item}</Link></li>
                    ))}
                </ul>
            </nav>
        </div>
        <div className="border-t border-white/15 px-4 py-5 text-center text-sm text-light/75">
            Made with <span className="text-primary" aria-label="love">♥</span> by <span className="font-bold text-light">Md Sufiyan Azmat
            </span>
        </div>
    </footer>
);

export default Footer;
