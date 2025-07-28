import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FilterIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useGetAllProductsQuery, useGetUserBidsQuery } from "../services/productApi";
import { useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";

const Dashboard = () => {
  const [viewMode, setViewMode] = useState("grid");
  const user = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState(
    user?.role === "buyer" ? "all" : "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isError, refetch } = useGetAllProductsQuery();
  const { data: userBidsData, isLoading: bidsLoading } = useGetUserBidsQuery();

  
  const products = data?.products || [];
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];
    return uniqueCategories;
  }, [products]);

  const filteredAuctions = useMemo(() => {
    let filtered = products;

    if (activeTab === "mybids") {
    
      if (userBidsData?.bids) {
        const bidProductIds = userBidsData.bids.map(bid => bid.product?._id).filter(Boolean);
        filtered = products.filter(product => bidProductIds.includes(product._id));
      } else {
        filtered = [];
      }
    } else if (activeTab === "myauctions") {
      filtered = filtered.filter((auction) => {
        const sellerId = auction.seller?._id?.toString();
        const userId = user?._id?.toString() || user?.id?.toString(); // Handle both _id and id
        console.log("🔍 Comparing seller:", sellerId, "with user:", userId);
        return sellerId === userId;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (auction) =>
          auction.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          auction.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (auction) => auction.category === categoryFilter
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((auction) => auction.status === statusFilter);
    }

    return filtered;
  }, [
    products,
    activeTab,
    searchTerm,
    categoryFilter,
    statusFilter,
    user?._id,
    userBidsData?.bids,
  ]);


  useEffect(() => {
    if (user?.role === "buyer" && activeTab === "myauctions") {
      setActiveTab("all");
    }
  }, [user?.role, activeTab]);

  // Helper function to get user's bid for a specific product
  const getUserBidForProduct = (productId) => {
    if (!userBidsData?.bids) return null;
    const userBids = userBidsData.bids.filter(bid => bid.product?._id === productId);
    if (userBids.length === 0) return null;
    // Return the highest bid by the user for this product
    return Math.max(...userBids.map(bid => bid.amount));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm || categoryFilter !== "all" || statusFilter !== "all";

  function getTimeLeft(endsAt) {
    if (!endsAt) return "";
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end - now;
    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} left`;
    if (mins > 0) return `${mins} min${mins > 1 ? "s" : ""} left`;
    return "Ending soon";
  }

  // Helper function to get time urgency color based on time remaining
  function getTimeUrgencyColor(endsAt) {
    if (!endsAt) return "text-gray-500";
    
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) return "text-red-500"; // Ended
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    
    // 🔴 RED: 1 day or less remaining (urgent)
    if (days <= 1) return "text-red-500";
    
    // 🟠 ORANGE: 2-3 days remaining (warning)  
    if (days <= 3) return "text-orange-500";
    
    // 🟢 GREEN: More than 3 days remaining (safe)
    return "text-green-500";
  }

  // Loading state
  if (isLoading || (activeTab === "mybids" && bidsLoading)) {
    return (
      <LoadingSpinner 
        size="lg" 
        text="Loading auctions..." 
        showBackground={true}
      />
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-gray-50 min-h-screen w-full pb-12">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load auctions</p>
            <p className="text-gray-600">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen w-full pb-12">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">
              {user?.role === "buyer" ? "Browse Auctions" : "Auction Dashboard"}
            </h1>
            <button
              onClick={() => {
                console.log("🔄 Manual refresh triggered");
                refetch();
              }}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
            >
              🔄 Refresh
            </button>
          </div>
          {/* Only show Create Auction button for sellers and both roles */}
          {(user?.role === "seller" || user?.role === "both") && (
            <Link
              to="/create-auction"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Auction
            </Link>
          )}
        </div>
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "all"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Auctions
            </button>
            <button
              onClick={() => setActiveTab("mybids")}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === "mybids"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              My Bids
            </button>
            {/* Only show My Auctions tab for sellers and both roles */}
            {(user?.role === "seller" || user?.role === "both") && (
              <button
                onClick={() => setActiveTab("myauctions")}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "myauctions"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My Auctions
              </button>
            )}
          </div>
        </div>
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-4">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-grow relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search auctions by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 border rounded-md transition-colors ${
                showFilters || hasActiveFilters
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FilterIcon className="w-5 h-5 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                  {
                    [
                      searchTerm,
                      categoryFilter !== "all",
                      statusFilter !== "all",
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="listed">Active</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <XIcon className="w-4 h-4 mr-2" />
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-2 hover:text-blue-600"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {categoryFilter !== "all" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Category:{" "}
                  {categoryFilter.charAt(0).toUpperCase() +
                    categoryFilter.slice(1)}
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className="ml-2 hover:text-green-600"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Status:{" "}
                  {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="ml-2 hover:text-purple-600"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count and View Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600">
              Showing {filteredAuctions.length} of {products.length} auction
              {filteredAuctions.length !== 1 ? "s" : ""}
              {activeTab === "mybids" && " where you've placed bids"}
              {activeTab === "myauctions" && " that you've created"}
            </p>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600 mr-2">View:</span>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md mr-1 ${
                viewMode === "grid"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <GridIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md ${
                viewMode === "list"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Auctions Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auction) => (
              <Link
                to={`/auction/${auction._id}`}
                key={auction.id}
                className="group"
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform group-hover:-translate-y-1">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={
                        auction.image?.[0]?.url ||
                        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                      }
                      alt={auction.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded capitalize">
                        {auction.category}
                      </span>
                      {activeTab === "myauctions" &&
                        auction.seller?._id?.toString() ===
                          user?.id?.toString() && (
                          <span className="text-xs font-medium bg-green-100 text-green-600 px-2 py-1 rounded">
                            Your Auction
                          </span>
                        )}
                      {activeTab === "mybids" &&
                        auction.bids?.some(
                          (bid) => bid.bidder === user?._id
                        ) && (
                          <span className="text-xs font-medium bg-purple-100 text-purple-600 px-2 py-1 rounded">
                            You Bid
                          </span>
                        )}
                    </div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">
                      {auction.title}
                    </h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">
                          {activeTab === "mybids" ? "Your Bid" : "Current Bid"}
                        </p>
                        <p className="text-blue-600 font-bold">
                          {activeTab === "mybids" 
                            ? `₨${getUserBidForProduct(auction._id) || auction.currentBid || auction.startingPrice}`
                            : `₨${auction.currentBid || auction.startingPrice}`}
                        </p>
                      </div>
                      <div className="text-right">
                        {activeTab === "mybids" && (
                          <>
                            <p className="text-sm text-gray-500">Current Bid</p>
                            <p className="text-green-600 font-medium">
                              ₨{auction.currentBid || auction.startingPrice}
                            </p>
                          </>
                        )}
                        {activeTab !== "mybids" && (
                          <>
                            <p className="text-sm text-gray-500">
                              {auction.bidCount || 0} bid
                              {(auction.bidCount || 0) !== 1 ? "s" : ""}
                            </p>
                            <p className={`font-medium ${getTimeUrgencyColor(auction.endsAt)}`}>
                              {getTimeLeft(auction.endsAt)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAuctions.map((auction) => (
              <Link
                to={`/auction/${auction._id}`}
                key={auction.id}
                className="block group"
              >
                <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform group-hover:-translate-y-1">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-48 h-48 flex-shrink-0">
                      <img
                        src={
                          auction.image?.[0]?.url ||
                          "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                        }
                        alt={auction.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                        }}
                      />
                    </div>
                    <div className="p-4 flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded capitalize">
                            {auction.category}
                          </span>
                          {/* Status Badge */}
                          <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                            auction.status === "closed"
                              ? "bg-purple-100 text-purple-600"
                              : auction.status === "sold"
                              ? "bg-red-100 text-red-600"
                              : auction.status === "listed"
                              ? "bg-green-100 text-green-600"
                              : auction.status === "pending"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {auction.status === "listed" ? "Active" : auction.status}
                          </span>
                          {activeTab === "myauctions" &&
                            auction.seller?._id?.toString() ===
                              user?.id?.toString() && (
                              <span className="text-xs font-medium bg-green-100 text-green-600 px-2 py-1 rounded">
                                Your Auction
                              </span>
                            )}
                          {activeTab === "mybids" &&
                            auction.bids?.some(
                              (bid) => bid.bidder === user?._id
                            ) && (
                              <span className="text-xs font-medium bg-purple-100 text-purple-600 px-2 py-1 rounded">
                                You Bid
                              </span>
                            )}
                        </div>
                        <p className={`font-medium ${getTimeUrgencyColor(auction.endsAt)}`}>
                          {getTimeLeft(auction.endsAt)}
                        </p>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">
                        {auction.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Seller: {auction.seller?.fullName}
                      </p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Current Bid</p>
                          <p className="text-blue-600 font-bold">
                            ₨{auction.currentBid || auction.startingPrice}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {auction.bidCount || 0} bid
                            {(auction.bidCount || 0) !== 1 ? "s" : ""}
                          </p>
                          <button className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {filteredAuctions.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              No auctions found
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === "all" &&
                !hasActiveFilters &&
                "There are currently no active auctions."}
              {activeTab === "all" &&
                hasActiveFilters &&
                "No auctions match your current filters."}
              {activeTab === "mybids" &&
                !hasActiveFilters &&
                "You haven't placed any bids yet."}
              {activeTab === "mybids" &&
                hasActiveFilters &&
                "No bids match your current filters."}
              {activeTab === "myauctions" &&
                !hasActiveFilters &&
                "You haven't created any auctions yet."}
              {activeTab === "myauctions" &&
                hasActiveFilters &&
                "No auctions match your current filters."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mb-4 text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            )}
            {activeTab === "myauctions" && !hasActiveFilters && (
              <Link
                to="/create-auction"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Your First Auction
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
