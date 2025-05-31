import React from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, TrendingUpIcon, ShieldCheckIcon, MessageSquareIcon } from 'lucide-react';
import { useSelector } from 'react-redux';

const Home = () => {
  // Replace this with your actual user state from Redux or Context
  const {token , user} = useSelector((state) => state.auth);

  // Sample featured auctions
  const featuredAuctions = [
    {
      id: 1,
      title: 'Vintage Camera Collection',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      currentBid: 450,
      timeLeft: '2 days',
      bids: 12
    },
    {
      id: 2,
      title: 'Antique Wooden Desk',
      image: 'https://images.unsplash.com/photo-1518893494013-481c1d8ed3fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      currentBid: 850,
      timeLeft: '5 hours',
      bids: 24
    },
    {
      id: 3,
      title: 'Luxury Wristwatch',
      image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      currentBid: 1200,
      timeLeft: '1 day',
      bids: 18
    },
    {
      id: 4,
      title: 'Modern Art Painting',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      currentBid: 750,
      timeLeft: '3 days',
      bids: 9
    }
  ];

  return (
    <div className="bg-white w-full">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Discover, Bid, Win
              </h1>
              <p className="text-xl mb-8">
                Join thousands of users in our dynamic online auction
                marketplace. Find unique items and bid in real-time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user?.role === "seller" || user?.role === "both" ? (
                  <Link to="/create-auction" className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-md font-medium text-center">
                    Create Auction
                  </Link>
                ) : (
                  <Link to="/" className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-md font-medium text-center">
                    Get Started
                  </Link>
                )}

                {user ? (
                  <Link to="/dashboard" className="bg-transparent hover:bg-blue-700 border border-white px-6 py-3 rounded-md font-medium text-center">
                    Dashboard
                  </Link>
                ) : (
                  <Link to="/login" className="bg-transparent hover:bg-blue-700 border border-white px-6 py-3 rounded-md font-medium text-center">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Auction bidding"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Search Section */}
      <section className="py-10 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for auctions..."
                  className="pl-10 w-full px-4 py-3 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium">
                Search
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Popular:</span>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Electronics
              </a>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Antiques
              </a>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Collectibles
              </a>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Jewelry
              </a>
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Art
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* Featured Auctions */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">
              Featured Auctions
            </h2>
            <p className="text-gray-600 mt-2">
              Discover our most popular active auctions
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredAuctions.map(auction => (
              <Link to={`/auction/${auction.id}`} key={auction.id} className="group">
                <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform group-hover:-translate-y-1">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={auction.image}
                      alt={auction.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
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
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium">
              View All Auctions
            </Link>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">
              Why Choose BidMaster
            </h2>
            <p className="text-gray-600 mt-2">
              Our platform offers the best auction experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="mx-auto bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <TrendingUpIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Bidding</h3>
              <p className="text-gray-600">
                Experience the thrill of live auctions with our real-time
                bidding system and instant notifications.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="mx-auto bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Secure Transactions
              </h3>
              <p className="text-gray-600">
                Our platform ensures safe transactions with verified users and
                secure payment coordination.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="mx-auto bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <MessageSquareIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Direct Communication
              </h3>
              <p className="text-gray-600">
                Connect directly with buyers and sellers through our integrated
                messaging system.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-700 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Bidding?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of users and discover unique items or sell your own
            through our dynamic auction platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-blue-700 hover:bg-gray-100 px-6 py-3 rounded-md font-medium">
              Create an Account
            </Link>
            <Link to="/dashboard" className="bg-transparent hover:bg-blue-800 border border-white px-6 py-3 rounded-md font-medium">
              Browse Auctions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;