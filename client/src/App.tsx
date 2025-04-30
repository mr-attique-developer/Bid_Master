import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);
  return <BrowserRouter>
      <NotificationProvider>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/register" element={<Register onLogin={handleLogin} />} />
              <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/auction/:id" element={<AuctionDetail isAuthenticated={isAuthenticated} />} />
              <Route path="/create-auction" element={isAuthenticated ? <CreateAuction /> : <Navigate to="/login" />} />
              <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
              <Route path="/chat" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
              <Route path="/chat/:userId" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </NotificationProvider>
    </BrowserRouter>;
}