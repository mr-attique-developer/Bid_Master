import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClockIcon, TagIcon, UserIcon, MessageSquareIcon, HeartIcon, ShareIcon, AlertCircleIcon } from 'lucide-react';
import { useNotification } from '../components/ui/NotificationProvider';

const AuctionDetail = ({ isAuthenticated }) => {
  const { id } = useParams();
  const [bidAmount, setBidAmount] = useState('');
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  const { addNotification } = useNotification();

  // Mock auction data - in a real app, this would be fetched from an API
  const auction = {
    id: parseInt(id || '1'),
    title: 'Vintage Camera Collection - Leica, Canon & Nikon',
    description: 'A rare collection of vintage cameras in excellent condition. This collection includes a Leica M3 from 1954, Canon AE-1 from 1976, and Nikon F2 from 1971. All cameras have been tested and are in working condition. The collection comes with original cases and some accessories.',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1520549233664-03f65c1d1327?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    ],
    currentBid: 450,
    minBidIncrement: 25,
    startingPrice: 200,
    timeLeft: '2 days 5 hours',
    endTime: '2023-12-15T15:00:00Z',
    seller: {
      id: 101,
      name: 'JohnDoe',
      rating: 4.8,
      auctions: 57
    },
    category: 'Electronics',
    condition: 'Used - Excellent',
    location: 'New York, NY',
    shippingOptions: 'Pickup only',
    bids: [
      { id: 1, user: 'Alice', amount: 450, time: '1 hour ago' },
      { id: 2, user: 'Bob', amount: 425, time: '3 hours ago' },
      { id: 3, user: 'Charlie', amount: 400, time: '5 hours ago' },
      { id: 4, user: 'David', amount: 350, time: '1 day ago' },
      { id: 5, user: 'Eva', amount: 325, time: '1 day ago' },
      { id: 6, user: 'Frank', amount: 300, time: '2 days ago' },
      { id: 7, user: 'Grace', amount: 275, time: '2 days ago' },
      { id: 8, user: 'Hank', amount: 250, time: '3 days ago' },
      { id: 9, user: 'Ivy', amount: 225, time: '3 days ago' },
      { id: 10, user: 'Jack', amount: 200, time: '4 days ago' }
    ]
  };

  const [selectedImage, setSelectedImage] = useState(auction.images[0]);

  const handleBidSubmit = (e) => {
    e.preventDefault();
    const bidValue = parseFloat(bidAmount);
    if (bidValue <= auction.currentBid) {
      addNotification('Your bid must be higher than the current bid', 'error');
      return;
    }
    if (bidValue < auction.currentBid + auction.minBidIncrement) {
      addNotification(`Minimum bid increment is $${auction.minBidIncrement}`, 'error');
      return;
    }
    setShowBidConfirm(true);
  };

  const confirmBid = () => {
    addNotification('Your bid has been placed successfully!', 'success');
    setShowBidConfirm(false);
    auction.bids.unshift({
      id: auction.bids.length + 1,
      user: 'You',
      amount: parseFloat(bidAmount),
      time: 'Just now'
    });
    auction.currentBid = parseFloat(bidAmount);
    setBidAmount('');
  };

  const cancelBid = () => {
    setShowBidConfirm(false);
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      addNotification('Please log in to contact the seller', 'info');
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
              <div className="mb-4 h-80 overflow-hidden rounded-lg">
                <img src={selectedImage} alt={auction.title} className="w-full h-full object-contain" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {auction.images.map((image, index) => (
                  <div
                    key={index}
                    className={`h-20 overflow-hidden rounded-md cursor-pointer ${selectedImage === image ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img src={image} alt={`${auction.title} - Image ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
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
                    ${auction.currentBid}
                  </p>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-500">Starting Price:</p>
                  <p className="text-gray-700">${auction.startingPrice}</p>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-500">Min. Bid Increment:</p>
                  <p className="text-gray-700">+${auction.minBidIncrement}</p>
                </div>
                <div className="flex items-center text-red-500 mb-6">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  <span className="font-medium">{auction.timeLeft} left</span>
                </div>
                {/* Bid Form */}
                <form onSubmit={handleBidSubmit}>
                  <div className="flex items-center mb-4">
                    <div className="relative flex-grow mr-2">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        className="pl-8 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`${auction.currentBid + auction.minBidIncrement} or more`}
                        min={auction.currentBid + auction.minBidIncrement}
                        step="1"
                        required
                        disabled={!isAuthenticated}
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:bg-gray-400"
                      disabled={!isAuthenticated}
                    >
                      Place Bid
                    </button>
                  </div>
                  {!isAuthenticated && (
                    <p className="text-sm text-red-500 mb-4">
                      Please{' '}
                      <Link to="/login" className="underline">
                        log in
                      </Link>{' '}
                      to place a bid
                    </p>
                  )}
                </form>
                <div className="flex space-x-2 mb-6">
                  <button
                    onClick={handleContactSeller}
                    className="flex items-center justify-center flex-grow border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md"
                  >
                    <MessageSquareIcon className="w-4 h-4 mr-2" />
                    Contact Seller
                  </button>
                  <button className="flex items-center justify-center border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md">
                    <HeartIcon className="w-5 h-5" />
                  </button>
                  <button className="flex items-center justify-center border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md">
                    <ShareIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircleIcon className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-yellow-700">
                    This auction requires in-person payment and pickup.
                    Coordinate with the seller after winning.
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
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1">
                          {auction.seller.rating} ({auction.seller.auctions}{' '}
                          auctions)
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleContactSeller}
                    className="w-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md"
                  >
                    <MessageSquareIcon className="w-4 h-4 mr-2" />
                    Contact Seller
                  </button>
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
                      {auction.bids.slice(0, 5).map(bid => (
                        <tr key={bid.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700">
                            {bid.user}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-700">
                            ${bid.amount}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                            {bid.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {auction.bids.length > 5 && (
                    <div className="px-4 py-2 bg-gray-50 text-center text-sm text-gray-700">
                      + {auction.bids.length - 5} more bids
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
              You are about to place a bid of{' '}
              <span className="font-bold text-blue-600">${bidAmount}</span> on "
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