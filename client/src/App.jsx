import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import EventsListPage from './pages/EventsListPage';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import CreateEventPage from './pages/CreateEventPage';
import MyEventsPage from './pages/MyEventsPage';
import AdminPendingEventsPage from './pages/AdminPendingEventsPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import MyBookingsPage from './pages/MyBookingsPage';
import { AdminOnlyRoute, ProtectedRoute, UserOnlyRoute } from './components/RouteGuards';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <main className="grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Routes>
                        <Route path="/" element={<EventsListPage />} />
                        <Route path="/events/submit" element={<UserOnlyRoute><CreateEventPage /></UserOnlyRoute>} />
                        <Route path="/events/new" element={<UserOnlyRoute><CreateEventPage /></UserOnlyRoute>} />
                        <Route path="/events/mine" element={<UserOnlyRoute><MyEventsPage /></UserOnlyRoute>} />
                        <Route path="/my-events" element={<UserOnlyRoute><MyEventsPage /></UserOnlyRoute>} />
                        <Route path="/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
                        <Route path="/admin/pending-events" element={<AdminOnlyRoute><AdminPendingEventsPage /></AdminOnlyRoute>} />
                        <Route path="/events/:id" element={<EventDetail />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={<ProtectedRoute><OwnerDashboardPage /></ProtectedRoute>} />
                        <Route path="/admin/dashboard" element={<AdminOnlyRoute><AdminDashboard /></AdminOnlyRoute>} />
                        <Route path="/admin" element={<AdminOnlyRoute><AdminDashboard /></AdminOnlyRoute>} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/payment-failed" element={<PaymentFailed />} />
                        <Route path="*" element={<h1 className="text-3xl font-bold text-center mt-20">404 - Page Not Found</h1>} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
