import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MessageSquareIcon, LoaderIcon } from 'lucide-react';
import { useCreateChatRoomMutation } from '../services/chatApi';

const StartChatButton = ({ product, className = "" }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [createChatRoom, { isLoading }] = useCreateChatRoomMutation();
  const [error, setError] = useState('');

  // Check if user is eligible to chat (seller or winner)
  const isEligibleToChat = () => {
    if (!user || !product) return false;
    
    // Check if auction is closed and has a winner
    if (product.status !== 'closed' || !product.winner) return false;
    
    // Check if current user is either the seller or the winner
    const isSeller = product.seller && (product.seller._id === user._id || product.seller === user._id);
    const isWinner = product.winner === user._id;
    
    return isSeller || isWinner;
  };

  // Get the role of current user
  const getUserRole = () => {
    if (!user || !product) return null;
    
    const isSeller = product.seller && (product.seller._id === user._id || product.seller === user._id);
    return isSeller ? 'seller' : 'winner';
  };

  // Get the button text based on user role
  const getButtonText = () => {
    if (!user || !product) return 'Chat';
    
    const isSeller = product.seller && (product.seller._id === user._id || product.seller === user._id);
    
    if (isSeller) {
      return 'Chat with Winner';
    } else {
      return 'Contact Seller';
    }
  };

  const handleStartChat = async () => {
    if (!isEligibleToChat()) {
      setError('You are not eligible to start this chat.');
      return;
    }

    console.log('🚀 Starting chat with product:', {
      productId: product?._id,
      productTitle: product?.title,
      sellerId: product?.seller?._id || product?.seller,
      winnerId: product?.winner,
      userRole: getUserRole()
    });

    try {
      setError('');
      
      // Create or find existing chat room
      const result = await createChatRoom({
        sellerId: product.seller._id || product.seller,
        winnerId: product.winner,
        productId: product._id
      }).unwrap();

      console.log('✅ Chat room created/found:', result);
      
      // Navigate to the chat page with the product ID
      console.log('🧭 Navigating to:', `/chat/${product._id}`);
      navigate(`/chat/${product._id}`);
    } catch (error) {
      console.error('❌ Error creating chat room:', error);
      setError(error?.data?.message || 'Failed to start chat. Please try again.');
    }
  };

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  // Don't render if auction is not closed or has no winner
  if (product?.status !== 'closed' || !product?.winner) {
    return null;
  }

  // Don't render if user is not eligible
  if (!isEligibleToChat()) {
    return null;
  }

  const userRole = getUserRole();
  const buttonText = getButtonText();

  return (
    <div className="space-y-2">
      <button
        onClick={handleStartChat}
        disabled={isLoading}
        className={`
          flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors w-full
          ${isLoading 
            ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
          }
          ${className}
        `}
      >
        {isLoading ? (
          <>
            <LoaderIcon className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <MessageSquareIcon className="h-5 w-5" />
            <span>{buttonText}</span>
          </>
        )}
      </button>
      
      {/* Show user role info */}
      <p className="text-sm text-gray-600 text-center">
        💬 Private chat between winner and seller
      </p>
      
      {/* Show error if any */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
      
     
    </div>
  );
};

export default StartChatButton;
