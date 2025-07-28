import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, TrendingUpIcon, ShieldCheckIcon, MessageSquareIcon } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useGetAllProductsQuery } from '../services/productApi';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const { isAuthenticated , user} = useSelector((state) => state.auth);
  
  const { data: productsResponse, isLoading, isError } = useGetAllProductsQuery();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const transformProducts = (products) => {
    if (!products) return [];
    return products.map(product => ({
      id: product._id,
      title: product.title,
      image: product.image?.[0]?.url || 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      currentBid: product.currentBid || product.startingPrice,
      category: product.category?.toLowerCase() || 'other',
      timeLeft: calculateTimeLeft(product.endsAt),
      bids: product.bidCount || 0, // ✅ Use bidCount from backend instead of bids.length
      status: product.status
    }));
  };

  const calculateTimeLeft = (endsAt) => {
    if (!endsAt) return 'No end date';
    
    const now = new Date();
    const endDate = new Date(endsAt);
    const timeDiff = endDate - now;
    
    if (timeDiff <= 0) return 'Ended';
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Less than 1 hour';
  };

  const allProducts = transformProducts(productsResponse?.products || []);

  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    if (debouncedSearchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    filtered = filtered.filter(product => product.status === 'listed');

    return filtered;
  }, [allProducts, debouncedSearchTerm, categoryFilter]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(allProducts.map(p => p.category))];
    return ['all', ...uniqueCategories];
  }, [allProducts]);

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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button 
                onClick={() => setSearchTerm('')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
              >
                Clear
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Categories:</span>
              <div className="flex justify-center gap-2 mb-8 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`text-sm hover:cursor-pointer text-blue-600 hover:underline ${categoryFilter === cat ? 'underline font-semibold' : ''} transition`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Featured Auctions */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">
              {debouncedSearchTerm ? `Search Results for "${debouncedSearchTerm}"` : 'Featured Auctions'}
            </h2>
            <p className="text-gray-600 mt-2">
              {debouncedSearchTerm 
                ? `Found ${filteredProducts.length} auction${filteredProducts.length !== 1 ? 's' : ''}`
                : 'Discover our most popular active auctions'
              }
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Failed to load auctions</p>
              <p className="text-gray-600">Please try again later</p>
            </div>
          )}

          {/* No Results */}
          {!isLoading && !isError && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">
                {debouncedSearchTerm || categoryFilter !== 'all' 
                  ? 'No auctions found matching your criteria' 
                  : 'No active auctions available'
                }
              </p>
              {(debouncedSearchTerm || categoryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !isError && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map(auction => (
                <Link to={`/auction/${auction.id}`} key={auction.id} className="group">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform group-hover:-translate-y-1">
                    <div className="h-48 overflow-hidden">
                      <img
                        src={auction.image}
                        alt={auction.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">
                        {auction.title}
                      </h3>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Current Bid</p>
                          <p className="text-blue-600 font-bold">
                            ₨ {auction.currentBid}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {auction.bids} bid{auction.bids !== 1 ? 's' : ''}
                          </p>
                          <p className={`font-medium ${
                            auction.timeLeft === 'Ended' ? 'text-red-500' : 
                            auction.timeLeft.includes('hour') ? 'text-orange-500' : 'text-green-500'
                          }`}>
                            {auction.timeLeft === 'Ended' ? 'Ended' : `${auction.timeLeft} left`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Show More Button */}
          {!isLoading && !isError && filteredProducts.length > 0 && (
            <div className="mt-12 text-center">
              <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium">
                View All Auctions
              </Link>
            </div>
          )}
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
            {
              !isAuthenticated && (
                <Link to="/register" className="bg-white text-blue-700 hover:bg-gray-100 px-6 py-3 rounded-md font-medium">
                  Create an Account
                </Link>
              )
            }
           
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