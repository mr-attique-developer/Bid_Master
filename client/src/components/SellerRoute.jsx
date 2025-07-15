import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const SellerRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  
  // Check if user has seller or both role
  const hasSellerAccess = user?.role === "seller" || user?.role === "both";
  
  if (!hasSellerAccess) {
    // Redirect buyers to dashboard instead of create auction
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default SellerRoute;
