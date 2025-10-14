import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check for the authentication token in local storage
  const token = localStorage.getItem('authToken');

  // If token exists, allow access to the nested routes (children)
  if (token) {
    return <Outlet />;
  }

  // If no token, redirect the user to the login page
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
