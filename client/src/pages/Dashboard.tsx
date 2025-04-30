import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FilterIcon, GridIcon, ListIcon, PlusIcon } from 'lucide-react';
const Dashboard = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'mybids' | 'myauctions'>('all');
  // Sample auction data
  const auctions = [{
    id: 1,
    title: 'Vintage Camera Collection',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    currentBid: 450,
    timeLeft: '2 days',
    bids: 12,
    seller: 'JohnDoe',
    category: 'Electronics',
    isOwner: false,
    hasBid: true
  }, {
    id: 2,
    title: 'Antique Wooden Desk',
    image: 'https://images.unsplash.com/photo-1518893494013-481c1d8ed3fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    currentBid: 850,
    timeLeft: '5 hours',
    bids: 24,
    seller: 'AntiquesLover',
    category: 'Furniture',
    isOwner: false,
    hasBid: false
  }, {
    id: 3,
    title: 'Luxury Wristwatch',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    currentBid: 1200,
    timeLeft: '1 day',
    bids: 18,
    seller: 'LuxuryItems',
    category: 'Accessories',
    isOwner: false,
    hasBid: true
  }, {
    id: 4,
    title: 'Modern Art Painting',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    currentBid: 750,
    timeLeft: '3 days',
    bids: 9,
    seller: 'CurrentUser',
    category: 'Art',
    isOwner: true,
    hasBid: false
  }, {
    id: 5,
    title: 'Vintage Vinyl Records Collection',
    image: 'https://images.unsplash.com/photo-1603048588665-791ca91d0af6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    currentBid: 320,
    timeLeft: '4 days',
    bids: 7,
    seller: 'MusicCollector',
    category: 'Music',
    isOwner: false,
    hasBid: false
  }, {
    id: 6,
    title: 'Gaming Console Bundle',
    image: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    currentBid: 550,
    timeLeft: '2 days',
    bids: 15,
    seller: 'CurrentUser',
    category: 'Electronics',
    isOwner: true,
    hasBid: false
  }];
  const filteredAuctions = auctions.filter(auction => {
    if (activeTab === 'all') return true;
    if (activeTab === 'mybids') return auction.hasBid;
    if (activeTab === 'myauctions') return auction.isOwner;
    return true;
  });
  return <div className="bg-gray-50 min-h-screen w-full pb-12">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Auction Dashboard
          </h1>
          <Link to="/create-auction" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Auction
          </Link>
        </div>
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex border-b">
            <button onClick={() => setActiveTab('all')} className={`px-6 py-3 font-medium text-sm ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              All Auctions
            </button>
            <button onClick={() => setActiveTab('mybids')} className={`px-6 py-3 font-medium text-sm ${activeTab === 'mybids' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              My Bids
            </button>
            <button onClick={() => setActiveTab('myauctions')} className={`px-6 py-3 font-medium text-sm ${activeTab === 'myauctions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              My Auctions
            </button>
          </div>
        </div>
        {/* Filters and View Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <button className="flex items-center text-gray-700 mr-4">
              <FilterIcon className="w-5 h-5 mr-2" />
              <span>Filter</span>
            </button>
            <select className="border rounded-md px-3 py-1.5 text-gray-700">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Furniture</option>
              <option>Art</option>
              <option>Collectibles</option>
              <option>Jewelry</option>
            </select>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600 mr-2">View:</span>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md mr-1 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>
              <GridIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Auctions Grid/List */}
        {viewMode === 'grid' ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map(auction => <Link to={`/auction/${auction.id}`} key={auction.id} className="group">
                <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform group-hover:-translate-y-1">
                  <div className="h-48 overflow-hidden">
                    <img src={auction.image} alt={auction.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        {auction.category}
                      </span>
                      {auction.isOwner && <span className="text-xs font-medium bg-green-100 text-green-600 px-2 py-1 rounded">
                          Your Auction
                        </span>}
                      {auction.hasBid && !auction.isOwner && <span className="text-xs font-medium bg-purple-100 text-purple-600 px-2 py-1 rounded">
                          You Bid
                        </span>}
                    </div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">
                      {auction.title}
                    </h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Current Bid</p>
                        <p className="text-blue-600 font-bold">
                          ${auction.currentBid}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {auction.bids} bids
                        </p>
                        <p className="text-red-500 font-medium">
                          {auction.timeLeft} left
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>)}
          </div> : <div className="space-y-4">
            {filteredAuctions.map(auction => <Link to={`/auction/${auction.id}`} key={auction.id} className="block group">
                <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform group-hover:-translate-y-1">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-48 h-48 flex-shrink-0">
                      <img src={auction.image} alt={auction.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-4 flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            {auction.category}
                          </span>
                          {auction.isOwner && <span className="text-xs font-medium bg-green-100 text-green-600 px-2 py-1 rounded">
                              Your Auction
                            </span>}
                          {auction.hasBid && !auction.isOwner && <span className="text-xs font-medium bg-purple-100 text-purple-600 px-2 py-1 rounded">
                              You Bid
                            </span>}
                        </div>
                        <p className="text-red-500 font-medium">
                          {auction.timeLeft} left
                        </p>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-800 mb-2">
                        {auction.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Seller: {auction.seller}
                      </p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Current Bid</p>
                          <p className="text-blue-600 font-bold">
                            ${auction.currentBid}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {auction.bids} bids
                          </p>
                          <button className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>)}
          </div>}
        {filteredAuctions.length === 0 && <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              No auctions found
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'all' && 'There are currently no active auctions.'}
              {activeTab === 'mybids' && "You haven't placed any bids yet."}
              {activeTab === 'myauctions' && "You haven't created any auctions yet."}
            </p>
            {activeTab === 'myauctions' && <Link to="/create-auction" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Your First Auction
              </Link>}
          </div>}
      </div>
    </div>;
};
export default Dashboard;