import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const AdminRedirect = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    // If user is admin, redirect to admin dashboard
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  // If user is admin, don't render children (they'll be redirected)
  if (user?.role === 'admin') {
    return null;
  }

  // For non-admin users, render children normally
  return children;
};

export default AdminRedirect;
