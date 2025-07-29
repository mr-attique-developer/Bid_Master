import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import {
  UserIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ClipboardListIcon,
  LogOutIcon,
  MessageSquareIcon,
  Loader,
} from "lucide-react";
import {
  useGetUserProfileQuery,
  useLogoutUserMutation,
  useUpdateUserProfileMutation,
} from "../services/authApi";
import { useGetUserBidsQuery } from "../services/productApi";
import MemberDate from "../utility/MemberDate";
import { toast } from "react-toastify";
import Settings from "./Settings";
import { useDispatch } from "react-redux";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    location: "",
    phone: "",
    bio: "",
  });

  const {
    data,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
  } = useGetUserProfileQuery();
  const [
    updateUserProfile,
    {
      isLoading: isUpdatingProfile,
      isError: isUpdateError,
      isSuccess: isUpdateSuccess,
      error: updateError,
    },
  ] = useUpdateUserProfileMutation();
  
  const { 
    data: userBidsData, 
    isLoading: bidsLoading,
    isError: bidsError 
  } = useGetUserBidsQuery();

  useEffect(() => {
    if (data?.user) {
      setFormData({
        fullName: data.user?.fullName || "",
        email: data.user?.email || "",
        location: data.user?.location || "",
        phone: data.user?.phone || "",
        bio: data.user?.bio || "",
      });
    }
  }, [data]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async () => {
    try {
      await updateUserProfile(formData).unwrap();
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);

      toast.error(
        `Failed to update profile. ${
          updateError?.data?.message || "Please try again."
        }`
      );
    }
  };

  if (isProfileLoading) {
    return (
      <div className="text-center py-10">
        <Loader className="animate-spin h-4 w-4" />
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div className="text-center py-10 text-red-600">
        Error loading profile:{" "}
        {profileError?.data?.message || profileError?.message}
      </div>
    );
  }
  const user = data?.user || {};
  const [logoutUser] = useLogoutUserMutation();
  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();

      dispatch(logout());
      navigate("/login");
      toast.success("Logged out successfully!");
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };
  return (
    <div className="bg-gray-50 min-h-screen w-full pb-12">
      <div className="container mx-auto m-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 mx-8">My Account</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <UserIcon className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-semibold">{formData.fullName}</h2>
                <p className="text-gray-500 text-sm">
                  <MemberDate timestamp={user?.createdAt} />
                </p>
              </div>
              <nav className="p-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center w-full px-4 py-2 rounded-md text-left ${
                    activeTab === "profile"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <UserIcon className="h-5 w-5 mr-3" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("purchases")}
                  className={`flex items-center w-full px-4 py-2 rounded-md text-left ${
                    activeTab === "purchases"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ShoppingBagIcon className="h-5 w-5 mr-3" />
                  Purchases & Bids
                </button>
               
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center w-full px-4 py-2 rounded-md text-left ${
                    activeTab === "settings"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <SettingsIcon className="h-5 w-5 mr-3" />
                  Settings
                </button>
                <Link
                  to="/chat"
                  className="flex items-center w-full px-4 py-2 rounded-md text-left text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MessageSquareIcon className="h-5 w-5 mr-3" />
                  Messages
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 rounded-md text-left text-gray-700 hover:bg-gray-50"
                >
                  <LogOutIcon className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </nav>
            </div>
          </div>
          {/* Main Content */}
          <div className="md:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">
                  Profile Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      onChange={handleInputChange}
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      onChange={handleInputChange}
                      type="email"
                      name="email"
                      value={formData.email}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      onChange={handleInputChange}
                      name="location"
                      type="text"
                      value={formData.location}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      onChange={handleInputChange}
                      type="tel"
                      name="phone"
                      placeholder="Add phone number"
                      value={formData.phone}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    onChange={handleInputChange}
                    name="bio"
                    value={formData.bio}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Brief description for your profile. This will be visible to
                    other users.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    disabled={isUpdatingProfile} // Use the correct loading state for mutation
                    onClick={handleUpdateProfile}
                  >
                    {isUpdatingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* Purchases Tab */}
            {activeTab === 'purchases' && (
              <div>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">
                    My Bids & Purchases
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <p className="text-sm text-gray-600">Total Bids</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {userBidsData?.totalBids || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md">
                      <p className="text-sm text-gray-600">Active Bids</p>
                      <p className="text-2xl font-bold text-green-600">
                        {userBidsData?.bids?.filter(bid => bid.product?.status === 'listed').length || 0}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md">
                      <p className="text-sm text-gray-600">Won Auctions</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {userBidsData?.wonAuctions || 0}
                      </p>
                    </div>
                  </div>
                  <h3 className="font-medium text-lg mb-3">My Bids History</h3>
                  {bidsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader className="animate-spin mr-2" />
                      <span>Loading bids...</span>
                    </div>
                  ) : bidsError ? (
                    <div className="text-center p-8 text-red-600">
                      Failed to load bids
                    </div>
                  ) : userBidsData?.bids && userBidsData.bids.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Item
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Your Bid
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Current Bid
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {userBidsData.bids.map((bid, index) => (
                            <tr key={bid._id || index}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0 mr-3">
                                    <img 
                                      className="h-10 w-10 rounded-md object-cover" 
                                      src={bid.product?.image?.[0]?.url || '/placeholder-image.jpg'}
                                      alt={bid.product?.title || 'Product'} 
                                    />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      <Link 
                                        to={`/auction/${bid.product?._id}`}
                                        className="hover:text-blue-600"
                                      >
                                        {bid.product?.title || 'Unknown Product'}
                                      </Link>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      #{bid.product?._id?.slice(-6) || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                                ₨{bid.amount}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                                ₨{bid.product?.currentBid || bid.product?.startingPrice}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                                {new Date(bid.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  bid.product?.winner && bid.product.winner === data?.user?._id
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : bid.product?.status === 'sold' 
                                    ? 'bg-green-100 text-green-800'
                                    : bid.product?.status === 'listed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {bid.product?.winner && bid.product.winner === data?.user?._id ? 'WON 🏆' :
                                   bid.product?.status === 'sold' ? 'Completed' :
                                   bid.product?.status === 'listed' ? 'Active' : 
                                   bid.product?.status?.charAt(0).toUpperCase() + bid.product?.status?.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center p-8 text-gray-500">
                      <ClipboardListIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p>You haven't placed any bids yet.</p>
                      <Link 
                        to="/dashboard" 
                        className="text-blue-600 hover:text-blue-500 mt-2 inline-block"
                      >
                        Browse Auctions
                      </Link>
                    </div>
                  )}
                  
                  {/* Won Auctions Section */}
                  {userBidsData?.bids && userBidsData.bids.some(bid => 
                    bid.product?.winner && 
                    bid.product.winner === data?.user?._id
                  ) && (
                    <div className="mt-8">
                      <h3 className="font-medium text-lg mb-3 text-green-600">🎉 My Won Auctions</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-green-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Won Item
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Winning Bid
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Won Date
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userBidsData.bids
                              .filter(bid => 
                                bid.product?.winner && 
                                bid.product.winner === data?.user?._id
                              )
                              .map((bid, index) => (
                                <tr key={`won-${bid._id || index}`} className="bg-green-50/30">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="h-10 w-10 flex-shrink-0 mr-3">
                                        <img 
                                          className="h-10 w-10 rounded-md object-cover border-2 border-green-200" 
                                          src={bid.product?.image?.[0]?.url || '/placeholder-image.jpg'}
                                          alt={bid.product?.title || 'Won Product'} 
                                        />
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900 flex items-center">
                                          <Link 
                                            to={`/auction/${bid.product?._id}`}
                                            className="hover:text-green-600 flex items-center"
                                          >
                                            {bid.product?.title || 'Unknown Product'}
                                            <span className="ml-2 text-green-600">👑</span>
                                          </Link>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          #{bid.product?._id?.slice(-6) || 'N/A'}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-semibold">
                                    ₨{bid.product?.winningBid || bid.amount}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                                    {new Date(bid.product?.endsAt || bid.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-right">
                                    <Link
                                      to={`/chat/${bid.product?._id}`}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                      Contact Seller
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
           
            {activeTab === "settings" && <Settings />}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Profile;
