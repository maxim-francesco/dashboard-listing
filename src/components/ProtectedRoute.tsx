import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// Helper function to decode JWT in a safe way
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Invalid token:", e);
    return null;
  }
};


interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const token = localStorage.getItem('authToken');

  // 1. Check if token exists
  if (!token) {
    // Allow access to login page from anywhere, but redirect if there's no token
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Parse token to get user info
  const user = parseJwt(token);

  // 3. If token is invalid or parsing fails, clear it and redirect to login
  if (!user || !user.role) {
    console.error('[ProtectedRoute] Invalid token or role missing, redirecting to /login');
    localStorage.removeItem('authToken');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 4. If allowedRoles are specified, check if the user's role is included
  const isAuthorized = allowedRoles ? allowedRoles.includes(user.role) : true;

  if (isAuthorized) {
    return <Outlet />;
  }

  // 5. If user is not authorized for the requested route, redirect them to their default page.
  // This prevents redirect loops.
  if (user.role === 'SUPER_ADMIN') {
    return <Navigate to="/super-admin" replace />;
  }
  
  if (user.role === 'ADMIN') {
    // An ADMIN trying to access a SUPER_ADMIN page
    return <Navigate to="/" replace />;
  }

  // Fallback for any other unexpected roles, just in case
  localStorage.removeItem('authToken');
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
