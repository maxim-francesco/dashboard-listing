import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

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
  const token = localStorage.getItem('authToken');

  // 1. Check if token exists
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // 2. Parse token to get user info
  const user = parseJwt(token);

  // 3. If token is invalid or parsing fails, clear it and redirect to login
  if (!user) {
    localStorage.removeItem('authToken');
    return <Navigate to="/login" replace />;
  }
  
  // 4. If allowedRoles are specified, check if the user's role is included
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user role is not allowed, redirect to home/dashboard (or a specific 'unauthorized' page)
    return <Navigate to="/" replace />;
  }

  // 5. If all checks pass, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
