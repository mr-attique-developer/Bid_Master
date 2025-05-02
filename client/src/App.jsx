import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useGetUserProfileQuery } from './services/authApi';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AuctionDetail from './pages/AuctionDetail';
import CreateAuction from './pages/CreateAuction';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import NotificationProvider from './components/ui/NotificationProvider';
import LoadingSpinner from './components/LoadingSpinner';
// import { logout } from './features/auth/authSlice';

export function App() {
  const dispatch = useDispatch();
  // Get auth state from Redux
  const { token } = useSelector((state) => state.auth);
  
  // Auto-fetch user profile if token exists
  const { isLoading, isError } = useGetUserProfileQuery(undefined, {
    skip: !token, // Only run if token exists
    refetchOnMountOrArgChange: true
  });


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <NotificationProvider>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Navbar  />
          <main className="flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={token ? <Dashboard /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/auction/:id" 
                element={<AuctionDetail />} 
              />
              <Route 
                path="/create-auction" 
                element={token ? <CreateAuction /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/profile" 
                element={token ? <Profile /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/chat" 
                element={token ? <Chat /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/chat/:userId" 
                element={token ? <Chat /> : <Navigate to="/login" replace />} 
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </NotificationProvider>
    </BrowserRouter>
  );
}