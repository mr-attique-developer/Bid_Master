import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useGetUserProfileQuery } from "./services/authApi";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AuctionDetail from "./pages/AuctionDetail";
import CreateAuction from "./pages/CreateAuction";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat_new";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import EmailVerification from "./pages/EmailVerification";
import NotificationProvider from "./components/ui/NotificationProvider";
import { ChatNotificationProvider } from "./contexts/ChatNotificationContext";
import { NotificationProvider as RealtimeNotificationProvider } from "./contexts/NotificationContext";
import LoadingSpinner from "./components/LoadingSpinner";
import { setCredentials } from "./features/auth/authSlice";
import GuestRoute from "./components/GuestRoutes";
import ProtectedRoute from "./components/ProtectedRoutes";
import SellerRoute from "./components/SellerRoute";
import AdminRoute from "./components/AdminRoute";
import AdminRedirect from "./components/AdminRedirect";

export function App() {
  const dispatch = useDispatch();
  // Get auth state from Redux
  const { token, user } = useSelector((state) => state.auth);


  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser && !token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        dispatch(setCredentials({ 
          token: storedToken, 
          user: parsedUser 
        }));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, [token, dispatch]);
  
  // Only call the query if we have a token
  const { isLoading } = useGetUserProfileQuery(undefined, {
    skip: !token // Skip the query if no token
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <NotificationProvider>
        <RealtimeNotificationProvider>
          <ChatNotificationProvider>
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Navbar />
              <main className="flex-grow">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<AdminRedirect><Home /></AdminRedirect>} />
                <Route element={<GuestRoute />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>
                
                {/* Email verification route - no authentication required */}
                <Route path="/verify-email/:token" element={<EmailVerification />} />
                
                {/* Registration step 2 - requires email verification */}
                <Route path="/register2" element={<Register />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<AdminRedirect><Dashboard /></AdminRedirect>} />
                  <Route 
                    path="/create-auction" 
                    element={
                      <AdminRedirect>
                        <SellerRoute>
                          <CreateAuction />
                        </SellerRoute>
                      </AdminRedirect>
                    } 
                  />
                  <Route path="/auction/:id" element={<AdminRedirect><AuctionDetail /></AdminRedirect>} />

                  <Route
                    path="/profile"
                    element={
                      token ? <AdminRedirect><Profile /></AdminRedirect> : <Navigate to="/login" replace />
                    }
                  />
                  <Route
                    path="/chat/:productId"
                    element={token ? <AdminRedirect><Chat /></AdminRedirect> : <Navigate to="/login" replace />}
                  />
                  <Route
                    path="/chat"
                    element={token ? <AdminRedirect><Chat /></AdminRedirect> : <Navigate to="/login" replace />}
                  />
                  <Route
                    path="/notifications"
                    element={token ? <AdminRedirect><Notifications /></AdminRedirect> : <Navigate to="/login" replace />}
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                 
                </Route>
              </Routes>
            </main>
            <Footer />
          </div>
        </ChatNotificationProvider>
      </RealtimeNotificationProvider>
    </NotificationProvider>
    </BrowserRouter>
  );
}
