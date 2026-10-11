import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
};

export const UserOnlyRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') {
        return <Navigate to="/admin/dashboard" state={{ notice: 'Event submissions and My Events are available to user accounts only.' }} replace />;
    }
    return children;
};

export const AdminOnlyRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" replace />;
    return user.role === 'admin' ? children : <Navigate to="/events" replace />;
};
