import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useGetUserProfileQuery } from "./services/authApi";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AuctionDetail from "./pages/AuctionDetail";
import CreateAuction from "./pages/CreateAuction";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import NotificationProvider from "./components/ui/NotificationProvider";
import LoadingSpinner from "./components/LoadingSpinner";
import { setCredentials } from "./features/auth/authSlice";
import GuestRoute from "./components/GuestRoutes";
import ProtectedRoute from "./components/ProtectedRoutes";
import SellerRoute from "./components/SellerRoute";

export function App() {
  const dispatch = useDispatch();
  // Get auth state from Redux
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && !token) {
      dispatch(setCredentials({ token: storedToken, user: null }));
    }
  }, [token, dispatch]);
  const { isLoading } = useGetUserProfileQuery();

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
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route 
                  path="/create-auction" 
                  element={
                    <SellerRoute>
                      <CreateAuction />
                    </SellerRoute>
                  } 
                />
                <Route path="/auction/:id" element={<AuctionDetail />} />

                <Route
                  path="/profile"
                  element={
                    token ? <Profile /> : <Navigate to="/login" replace />
                  }
                />
                <Route
                  path="/chat"
                  element={token ? <Chat /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/chat/:userId"
                  element={token ? <Chat /> : <Navigate to="/login" replace />}
                />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </NotificationProvider>
    </BrowserRouter>
  );
}
