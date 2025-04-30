import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, XIcon, ImageIcon } from 'lucide-react';
import { useNotification } from '../components/ui/NotificationProvider';
const CreateAuction = () => {
  const navigate = useNavigate();
  const {
    addNotification
  } = useNotification();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    condition: '',
    description: '',
    startingPrice: '',
    minBidIncrement: '5',
    duration: '7',
    location: '',
    shippingOptions: 'pickup'
  });
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const categories = ['Electronics', 'Collectibles', 'Fashion', 'Home & Garden', 'Art', 'Vehicles', 'Toys & Hobbies', 'Jewelry', 'Books', 'Sports', 'Other'];
  const conditions = ['New', 'Like New', 'Used - Excellent', 'Used - Good', 'Used - Fair', 'For parts or not working'];
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageInput) return;
    // In a real app, this would upload the image to a server
    // Here we're just simulating by adding the URL directly
    setImages(prev => [...prev, imageInput]);
    setImageInput('');
  };
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form
    if (!formData.title || !formData.category || !formData.condition || !formData.description || !formData.startingPrice || images.length === 0) {
      addNotification('Please fill in all required fields and add at least one image', 'error');
      return;
    }
    // In a real app, this would send the data to an API
    addNotification('Your auction has been created successfully!', 'success');
    // Navigate to the dashboard
    navigate('/dashboard');
  };
  return <div className="bg-gray-50 min-h-screen w-full pb-12">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Create New Auction
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Basic Information
                </h2>
                <div className="mb-4">
                  <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Vintage Camera Collection" required />
                </div>
                <div className="mb-4">
                  <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select id="category" name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="">Select a category</option>
                    {categories.map(category => <option key={category} value={category}>
                        {category}
                      </option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="condition" className="block mb-2 text-sm font-medium text-gray-700">
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <select id="condition" name="condition" value={formData.condition} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="">Select condition</option>
                    {conditions.map(condition => <option key={condition} value={condition}>
                        {condition}
                      </option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={5} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Provide a detailed description of your item..." required />
                </div>
              </div>
              {/* Images and Pricing */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Images</h2>
                <div className="mb-6">
                  <div className="flex mb-2">
                    <input type="text" value={imageInput} onChange={e => setImageInput(e.target.value)} className="flex-grow px-4 py-2 border rounded-l-md focus:ring-blue-500 focus:border-blue-500" placeholder="Enter image URL" />
                    <button onClick={handleAddImage} type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md">
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    Add at least one image of your item. You can add up to 5
                    images.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {images.map((image, index) => <div key={index} className="relative group">
                        <img src={image} alt={`Auction image ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                        <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>)}
                    {images.length < 5 && <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>}
                  </div>
                </div>
                <h2 className="text-lg font-semibold mb-4 mt-8">
                  Pricing & Duration
                </h2>
                <div className="mb-4">
                  <label htmlFor="startingPrice" className="block mb-2 text-sm font-medium text-gray-700">
                    Starting Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input type="number" id="startingPrice" name="startingPrice" value={formData.startingPrice} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="0.00" min="0.01" step="0.01" required />
                </div>
                <div className="mb-4">
                  <label htmlFor="minBidIncrement" className="block mb-2 text-sm font-medium text-gray-700">
                    Minimum Bid Increment ($)
                  </label>
                  <input type="number" id="minBidIncrement" name="minBidIncrement" value={formData.minBidIncrement} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="5.00" min="1" step="1" />
                </div>
                <div className="mb-4">
                  <label htmlFor="duration" className="block mb-2 text-sm font-medium text-gray-700">
                    Auction Duration (days)
                  </label>
                  <select id="duration" name="duration" value={formData.duration} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option value="3">3 days</option>
                    <option value="5">5 days</option>
                    <option value="7">7 days</option>
                    <option value="10">10 days</option>
                    <option value="14">14 days</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Location and Shipping */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                Location & Shipping
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="location" className="block mb-2 text-sm font-medium text-gray-700">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input type="text" id="location" name="location" value={formData.location} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. New York, NY" required />
                </div>
                <div>
                  <label htmlFor="shippingOptions" className="block mb-2 text-sm font-medium text-gray-700">
                    Shipping Options
                  </label>
                  <select id="shippingOptions" name="shippingOptions" value={formData.shippingOptions} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option value="pickup">Local Pickup Only</option>
                    <option value="arrangement">Shipping by Arrangement</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Terms */}
            <div className="mb-8">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 className="font-medium text-yellow-800 mb-2">
                  Payment Terms
                </h3>
                <p className="text-sm text-yellow-700">
                  By creating this auction, you agree to coordinate payment
                  directly with the winning bidder. BidMaster facilitates the
                  auction but is not responsible for payment processing. You
                  will need to arrange payment and item pickup/delivery with the
                  buyer after the auction ends.
                </p>
              </div>
            </div>
            {/* Submit Button */}
            <div className="flex justify-end">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium">
                Create Auction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>;
};
export default CreateAuction;