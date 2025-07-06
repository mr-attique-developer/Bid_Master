import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../features/auth/authSlice";
import {
  UserIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ClipboardListIcon,
  LogOutIcon,
  Loader,
} from "lucide-react";
import {
  useGetUserProfileQuery,
  useLogoutUserMutation,
  useUpdateUserProfileMutation,
} from "../services/authApi";
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
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Account</h1>
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
                  onClick={() => setActiveTab("sales")}
                  className={`flex items-center w-full px-4 py-2 rounded-md text-left ${
                    activeTab === "sales"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ClipboardListIcon className="h-5 w-5 mr-3" />
                  Sales & Auctions
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
                  className="flex items-center w-full px-4 py-2 rounded-md text-left text-gray-700 hover:bg-gray-50"
                >
                  <UserIcon className="h-5 w-5 mr-3" />
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
            {/* {activeTab === 'purchases' && (
              <div>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">
                    My Bids & Purchases
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <p className="text-sm text-gray-600">Active Bids</p>
                      <p className="text-2xl font-bold text-blue-600">5</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md">
                      <p className="text-sm text-gray-600">Won Auctions</p>
                      <p className="text-2xl font-bold text-green-600">
                        {user.stats.won}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md">
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ₨2,400
                      </p>
                    </div>
                  </div>
                  <h3 className="font-medium text-lg mb-3">Current Bids</h3>
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
                            End Time
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 mr-3">
                                <img className="h-10 w-10 rounded-md object-cover" src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" alt="" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Vintage Camera Collection
                                </div>
                                <div className="text-xs text-gray-500">
                                  #12345
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                            ₨450
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                            ₨450
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                            2 days left
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Winning
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 mr-3">
                                <img className="h-10 w-10 rounded-md object-cover" src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" alt="" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Luxury Wristwatch
                                </div>
                                <div className="text-xs text-gray-500">
                                  #12348
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                            ₨1,150
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                            ₨1,200
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                            1 day left
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Outbid
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-medium text-lg mb-3">Purchase History</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
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
                        {transactions.filter(t => t.type === 'purchase').map(transaction => (
                          <tr key={transaction.id}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {transaction.item}
                              </div>
                              <div className="text-xs text-gray-500">
                                #{transaction.id + 12345}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                              ₨{transaction.amount}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                              {transaction.date}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {transaction.status === 'completed' ? 'Completed' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )} */}
            {/* Sales Tab */}
            {/* {activeTab === 'sales' && (
              <div>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">
                    My Auctions & Sales
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <p className="text-sm text-gray-600">Active Auctions</p>
                      <p className="text-2xl font-bold text-blue-600">2</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-md">
                      <p className="text-sm text-gray-600">Completed Sales</p>
                      <p className="text-2xl font-bold text-green-600">10</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-md">
                      <p className="text-sm text-gray-600">Total Earned</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ₨1,600
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-lg">Active Auctions</h3>
                    <Link to="/create-auction" className="text-sm text-blue-600 hover:underline">
                      + Create New Auction
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Bid
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bids
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            End Time
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 mr-3">
                                <img className="h-10 w-10 rounded-md object-cover" src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" alt="" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Modern Art Painting
                                </div>
                                <div className="text-xs text-gray-500">
                                  #12347
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                            ₨750
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                            9
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                            3 days left
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <button className="text-blue-600 hover:text-blue-800 text-sm">
                              View
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 mr-3">
                                <img className="h-10 w-10 rounded-md object-cover" src="https://images.unsplash.com/photo-1605901309584-818e25960a8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" alt="" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Gaming Console Bundle
                                </div>
                                <div className="text-xs text-gray-500">
                                  #12351
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                            ₨550
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                            15
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                            2 days left
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <button className="text-blue-600 hover:text-blue-800 text-sm">
                              View
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-medium text-lg mb-3">Sales History</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Buyer
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
                        {transactions.filter(t => t.type === 'sale').map(transaction => (
                          <tr key={transaction.id}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {transaction.item}
                              </div>
                              <div className="text-xs text-gray-500">
                                #{transaction.id + 12345}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                              ₨{transaction.amount}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                              User#{transaction.id + 100}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                              {transaction.date}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {transaction.status === 'completed' ? 'Completed' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )} */}
            {/* Settings Tab */}
            {activeTab === "settings" && <Settings />}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Profile;
