import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserIcon, SettingsIcon, ShoppingBagIcon, ClipboardListIcon, StarIcon, BellIcon, LogOutIcon } from 'lucide-react';
const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  // Mock user data
  const user = {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    joined: 'January 2023',
    location: 'Chicago, IL',
    bio: 'Passionate collector of vintage items and antiques. Always looking for unique pieces to add to my collection.',
    stats: {
      auctions: 12,
      bids: 47,
      won: 8,
      rating: 4.9
    },
    notifications: {
      bidUpdates: true,
      auctionEnding: true,
      newMessages: true,
      promotions: false
    }
  };
  // Mock transaction history
  const transactions = [{
    id: 1,
    type: 'purchase',
    item: 'Vintage Camera Collection',
    amount: 450,
    date: 'Nov 15, 2023',
    status: 'completed'
  }, {
    id: 2,
    type: 'sale',
    item: 'Antique Wooden Desk',
    amount: 850,
    date: 'Oct 28, 2023',
    status: 'completed'
  }, {
    id: 3,
    type: 'purchase',
    item: 'Luxury Wristwatch',
    amount: 1200,
    date: 'Oct 12, 2023',
    status: 'pending'
  }, {
    id: 4,
    type: 'sale',
    item: 'Modern Art Painting',
    amount: 750,
    date: 'Sep 30, 2023',
    status: 'completed'
  }];
  return <div className="bg-gray-50 min-h-screen w-full pb-12">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Account</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <UserIcon className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-gray-500 text-sm">
                  Member since {user.joined}
                </p>
              </div>
              <nav className="p-2">
                <button onClick={() => setActiveTab('profile')} className={`flex items-center w-full px-4 py-2 rounded-md text-left ${activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <UserIcon className="h-5 w-5 mr-3" />
                  Profile
                </button>
                <button onClick={() => setActiveTab('purchases')} className={`flex items-center w-full px-4 py-2 rounded-md text-left ${activeTab === 'purchases' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <ShoppingBagIcon className="h-5 w-5 mr-3" />
                  Purchases & Bids
                </button>
                <button onClick={() => setActiveTab('sales')} className={`flex items-center w-full px-4 py-2 rounded-md text-left ${activeTab === 'sales' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <ClipboardListIcon className="h-5 w-5 mr-3" />
                  Sales & Auctions
                </button>
                <button onClick={() => setActiveTab('settings')} className={`flex items-center w-full px-4 py-2 rounded-md text-left ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <SettingsIcon className="h-5 w-5 mr-3" />
                  Settings
                </button>
                <Link to="/chat" className="flex items-center w-full px-4 py-2 rounded-md text-left text-gray-700 hover:bg-gray-50">
                  <UserIcon className="h-5 w-5 mr-3" />
                  Messages
                </Link>
                <Link to="/" className="flex items-center w-full px-4 py-2 rounded-md text-left text-gray-700 hover:bg-gray-50">
                  <LogOutIcon className="h-5 w-5 mr-3" />
                  Sign Out
                </Link>
              </nav>
            </div>
          </div>
          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">
                  Profile Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input type="text" value={user.name} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input type="email" value={user.email} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input type="text" value={user.location} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input type="tel" placeholder="Add phone number" className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea value={user.bio} rows={4} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  <p className="text-sm text-gray-500 mt-1">
                    Brief description for your profile. This will be visible to
                    other users.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
                    Save Changes
                  </button>
                </div>
              </div>}
            {/* Purchases Tab */}
            {activeTab === 'purchases' && <div>
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
                        $2,400
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
                            $450
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                            $450
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
                            $1,150
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                            $1,200
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
                        {transactions.filter(t => t.type === 'purchase').map(transaction => <tr key={transaction.id}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {transaction.item}
                                </div>
                                <div className="text-xs text-gray-500">
                                  #{transaction.id + 12345}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                                ${transaction.amount}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                                {transaction.date}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {transaction.status === 'completed' ? 'Completed' : 'Pending'}
                                </span>
                              </td>
                            </tr>)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>}
            {/* Sales Tab */}
            {activeTab === 'sales' && <div>
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
                        $1,600
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
                            $750
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
                            $550
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
                        {transactions.filter(t => t.type === 'sale').map(transaction => <tr key={transaction.id}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {transaction.item}
                                </div>
                                <div className="text-xs text-gray-500">
                                  #{transaction.id + 12345}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-700">
                                ${transaction.amount}
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
                            </tr>)}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>}
            {/* Settings Tab */}
            {activeTab === 'settings' && <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-6">
                    Account Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Change Password
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                          </label>
                          <input type="password" className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                          </label>
                          <input type="password" className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                          </label>
                          <input type="password" className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="flex justify-end">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                            Update Password
                          </button>
                        </div>
                      </div>
                    </div>
                    <hr />
                    <div>
                      <h3 className="text-lg font-medium mb-3">
                        Notifications
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Bid Updates</p>
                            <p className="text-sm text-gray-500">
                              Get notified when someone outbids you
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={user.notifications.bidUpdates} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Auction Ending</p>
                            <p className="text-sm text-gray-500">
                              Get notified when auctions you're bidding on are
                              ending soon
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={user.notifications.auctionEnding} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">New Messages</p>
                            <p className="text-sm text-gray-500">
                              Get notified when you receive a new message
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={user.notifications.newMessages} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Promotions</p>
                            <p className="text-sm text-gray-500">
                              Receive updates about promotions and news
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={user.notifications.promotions} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                            Save Preferences
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-medium text-red-600 mb-3">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
                    Delete Account
                  </button>
                </div>
              </div>}
          </div>
        </div>
      </div>
    </div>;
};
export default Profile;