import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ClockIcon,
  TagIcon,
  UserIcon,
  MessageSquareIcon,
  HeartIcon,
  ShareIcon,
  AlertCircleIcon,
} from "lucide-react";
import { useNotification } from "../components/ui/NotificationProvider";
import {
  useGetSingleProductQuery,
  usePlaceBidMutation,
  useGetAllBidsQuery,
} from "../services/productApi";
import LoadingSpinner from "../components/LoadingSpinner";

const AuctionDetail = () => {
  // All hooks called unconditionally at the top
  const { id } = useParams();
  const [bidAmount, setBidAmount] = useState("");
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { addNotification } = useNotification();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetSingleProductQuery(id);
  const [placeBid, { isLoading: isPlacingBid }] = usePlaceBidMutation();
  const { 
    data: bidsResponse, 
    isLoading: bidsLoading,
    refetch: refetchBids 
  } = useGetAllBidsQuery(id);

  // Function to calculate time left
  const calculateTimeLeft = (endsAt) => {
    if (!endsAt) return "No end date specified";

    const now = new Date();
    const endDate = new Date(endsAt);
    const timeDiff = endDate - now;

    if (timeDiff <= 0) return "Auction ended";

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ${hours} hour${
        hours > 1 ? "s" : ""
      }`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${
        minutes > 1 ? "s" : ""
      }`;
    }
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  };

  // Transform product data to auction format
  const transformProductToAuction = (product) => {
    if (!product) return null;

    return {
      id: product._id,
      title: product.title,
      description: product.description,
      images: product.image?.map((img) => img.url) || [],
      currentBid: product.currentBid || product.startingPrice,
      minBidIncrement: product.minBidIncrement,
      startingPrice: product.startingPrice,
      timeLeft: calculateTimeLeft(product.endsAt),
      endTime: product.endsAt,
      bidDuration: product.bidDuration,
      seller: {
        id: product.seller?._id,
        name: product.seller?.fullName || "Unknown Seller",
        email: product.seller?.email,
        rating: product.seller?.rating || 4.5,
        auctions: product.seller?.totalAuctions || 0,
      },
      category: product.category,
      condition: product.condition,
      location: product.location,
      shippingOptions: product.shippingOption,
      status: product.status,
      adminFeePaid: product.adminFeePaid,
      bids: product.bids || [],
    };
  };

  // Set the first image when product data loads
  useEffect(() => {
    if (response?.product?.image?.length > 0) {
      setSelectedImage(response.product.image[0].url);
    }
  }, [response]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error loading auction
          </h2>
          <p className="text-gray-600 mb-4">
            {error?.data?.message || "Failed to load auction details"}
          </p>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            &larr; Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  // Handle missing product
  const auction = transformProductToAuction(response?.product);
  if (!auction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">
            Auction not found
          </h2>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            &larr; Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  // Calculate minimum next bid based on highest bid from API or current product bid
  const getMinNextBid = () => {
    if (bidsResponse?.bids && bidsResponse.bids.length > 0) {
      const highestBid = Math.max(...bidsResponse.bids.map(bid => bid.amount));
      return highestBid + auction.minBidIncrement;
    }
    return auction.currentBid + auction.minBidIncrement;
  };

  const minNextBid = getMinNextBid();

  const handleBidSubmit = (e) => {
    e.preventDefault();

    // Check if user is trying to bid on their own auction
    if (auction.seller?.id?.toString() === user?._id?.toString()) {
      addNotification("You cannot bid on your own auction", "error");
      return;
    }

    const bidValue = parseFloat(bidAmount);
    const currentHighestBid = bidsResponse?.bids && bidsResponse.bids.length > 0 
      ? Math.max(...bidsResponse.bids.map(bid => bid.amount))
      : auction.currentBid;
      
    if (bidValue <= currentHighestBid) {
      addNotification("Your bid must be higher than the current highest bid", "error");
      return;
    }
    if (bidValue < minNextBid) {
      addNotification(
        `Minimum bid increment is ₨${auction.minBidIncrement}. Minimum bid: ₨${minNextBid}`,
        "error"
      );
      return;
    }
    setShowBidConfirm(true);
  };

  const confirmBid = async () => {
    try {
      const bidData = {
        productId: auction.id,
        amount: parseFloat(bidAmount),
      };

      const result = await placeBid(bidData).unwrap();

      addNotification("Your bid has been placed successfully!", "success");
      setShowBidConfirm(false);
      setBidAmount("");

      // Refetch the product data to get updated bid information
      refetch();
      refetchBids();
    } catch (error) {
      console.error("Failed to place bid:", error);
      addNotification(
        error?.data?.message || "Failed to place bid. Please try again.",
        "error"
      );
      setShowBidConfirm(false);
    }
  };

  const cancelBid = () => {
    setShowBidConfirm(false);
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      addNotification("Please log in to contact the seller", "info");
      return;
    }
    window.location.href = `/chat/${auction.seller.id}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen w-full pb-12">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            &larr; Back to Auctions
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Image Gallery */}
            <div>
              <div className="mb-4 h-80 overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={auction.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-500 text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <p>No image available</p>
                  </div>
                )}
              </div>
              {auction.images && auction.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {auction.images.map((image, index) => (
                    <div
                      key={index}
                      className={`h-20 overflow-hidden rounded-md cursor-pointer ${
                        selectedImage === image ? "ring-2 ring-blue-500" : ""
                      }`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image}
                        alt={`${auction.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Auction Details */}
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                {auction.title}
              </h1>
              <div className="flex items-center mb-6">
                <div className="flex items-center bg-blue-100 text-blue-600 px-3 py-1 rounded-md mr-4">
                  <TagIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">
                    {auction.category}
                  </span>
                </div>
                <div className="flex items-center bg-gray-100 text-gray-600 px-3 py-1 rounded-md">
                  <span className="text-sm font-medium">
                    {auction.condition}
                  </span>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-500">Current Bid:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₨{bidsResponse?.bids && bidsResponse.bids.length > 0 
                      ? Math.max(...bidsResponse.bids.map(bid => bid.amount))
                      : auction.currentBid}
                  </p>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-500">Starting Price:</p>
                  <p className="text-gray-700">₨{auction.startingPrice}</p>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-500">Min. Bid Increment:</p>
                  <p className="text-gray-700">+₨{auction.minBidIncrement}</p>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-500">Status:</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      auction.status === "sold"
                        ? "bg-red-100 text-red-800"
                        : auction.status === "listed"
                        ? "bg-green-100 text-green-800"
                        : auction.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {auction.status === "listed"
                      ? "Active"
                      : auction.status?.charAt(0).toUpperCase() +
                        auction.status?.slice(1)}
                  </span>
                </div>
                <div
                  className={`flex items-center mb-6 ${
                    auction.timeLeft === "Auction ended"
                      ? "text-red-500"
                      : "text-red-500"
                  }`}
                >
                  <ClockIcon className="w-5 h-5 mr-2" />
                  <span className="font-medium">{auction.timeLeft}</span>
                </div>
                {/* Bid Form */}
                {auction.status === "pending" ? (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-center">
                    <p className="text-yellow-700 font-medium mb-2">
                      This auction is pending approval
                    </p>
                    <p className="text-sm text-yellow-600">
                      The seller needs to pay the admin fee before this auction
                      goes live.
                    </p>
                    {auction.seller?.id?.toString() ===
                      user?._id?.toString() && (
                      <button className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm">
                        Pay Admin Fee
                      </button>
                    )}
                  </div>
                ) : auction.status === "sold" ? (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-center">
                    <p className="text-red-700 font-medium">
                      🎉 This auction has been sold!
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Final bid: ₨{bidsResponse?.bids && bidsResponse.bids.length > 0 
                        ? Math.max(...bidsResponse.bids.map(bid => bid.amount))
                        : auction.currentBid}
                    </p>
                  </div>
                ) : auction.timeLeft === "Auction ended" ? (
                  <div className="mb-4 p-4 bg-gray-100 rounded-md text-center">
                    <p className="text-gray-600 font-medium">
                      ⏰ This auction has ended
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Final bid: ₨{bidsResponse?.bids && bidsResponse.bids.length > 0 
                        ? Math.max(...bidsResponse.bids.map(bid => bid.amount))
                        : auction.currentBid}
                    </p>
                  </div>
                ) : auction.status === "listed" ? (
                  <form onSubmit={handleBidSubmit}>
                    <div className="flex items-center mb-4">
                      <div className="relative flex-grow mr-2">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                          ₨
                        </span>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="pl-8 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`${minNextBid} or more`}
                          min={minNextBid}
                          step="1"
                          required
                          disabled={!isAuthenticated || isPlacingBid}
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={!isAuthenticated || isPlacingBid}
                      >
                        {isPlacingBid ? "Placing..." : "Place Bid"}
                      </button>
                    </div>
                    {!isAuthenticated && (
                      <p className="text-sm text-red-500 mb-4">
                        Please{" "}
                        <Link to="/login" className="underline">
                          log in
                        </Link>{" "}
                        to place a bid
                      </p>
                    )}
                    {auction.seller?.id?.toString() ===
                      user?._id?.toString() && (
                      <p className="text-sm text-orange-500 mb-4">
                        ⚠️ You cannot bid on your own auction
                      </p>
                    )}
                  </form>
                ) : (
                  <div className="mb-4 p-4 bg-gray-100 rounded-md text-center">
                    <p className="text-gray-600 font-medium">
                      This auction is not available for bidding
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Status:{" "}
                      {auction.status?.charAt(0).toUpperCase() +
                        auction.status?.slice(1)}
                    </p>
                  </div>
                )}
                {/* Contact Seller - Only show when auction ended */}
                {(auction.timeLeft === "Auction ended" || auction.status === "sold") && (
                  <div className="flex space-x-2 mb-6">
                    <button
                      onClick={handleContactSeller}
                      className="flex items-center justify-center flex-grow border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md"
                    >
                      <MessageSquareIcon className="w-4 h-4 mr-2" />
                      Contact Seller
                    </button>
                  </div>
                )}
                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircleIcon className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-yellow-700">
                    Shipping: {auction.shippingOptions}. Please coordinate with
                    the seller for payment and delivery details.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 border-t">
            {/* Description */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">
                  {auction.description}
                </p>
              </div>
              <h2 className="text-xl font-semibold mt-8 mb-4">
                Shipping & Pickup
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700">{auction.shippingOptions}</p>
                <p className="text-gray-700 mt-2">
                  Location: {auction.location}
                </p>
              </div>
            </div>
            {/* Seller Info & Bid History */}
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  Seller Information
                </h2>
                <div className="p-4 border rounded-md">
                  <div className="flex items-center mb-4">
                    <div className="bg-gray-200 rounded-full p-2 mr-3">
                      <UserIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{auction.seller.name}</p>
                      {auction.seller.email && (
                        <p className="text-sm text-gray-500 mb-1">
                          {auction.seller.email}
                        </p>
                      )}
                    
                    </div>
                  </div>
                  {/* Contact Seller button - Only show when auction ended */}
                  {(auction.timeLeft === "Auction ended" || auction.status === "sold") && (
                    <button
                      onClick={handleContactSeller}
                      className="w-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md"
                    >
                      <MessageSquareIcon className="w-4 h-4 mr-2" />
                      Contact Seller
                    </button>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4">Bid History</h2>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bidder
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bidsLoading ? (
                        <tr>
                          <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                            <LoadingSpinner size="sm" />
                            <p className="mt-2">Loading bids...</p>
                          </td>
                        </tr>
                      ) : bidsResponse?.bids && bidsResponse.bids.length > 0 ? (
                        bidsResponse.bids.slice(0, 5).map((bid, index) => (
                          <tr key={bid._id || index}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700">
                              {bid.bidder?.fullName || bid.bidder?.name || "Anonymous"}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                              ₨{bid.amount}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                              {new Date(bid.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            No bids yet. Be the first to bid!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {bidsResponse?.bids && bidsResponse.bids.length > 5 && (
                    <div className="px-4 py-2 bg-gray-50 text-center text-sm text-gray-700">
                      + {bidsResponse.bids.length - 5} more bids
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Bid Confirmation Modal */}
      {showBidConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Your Bid</h3>
            <p className="mb-6">
              You are about to place a bid of{" "}
              <span className="font-bold text-blue-600">₨{bidAmount}</span> on "
              {auction.title}".
            </p>
            <p className="mb-6 text-sm text-gray-600">
              By confirming, you agree to pay this amount if you win the
              auction. Payment will be arranged directly with the seller.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelBid}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBid}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionDetail;
