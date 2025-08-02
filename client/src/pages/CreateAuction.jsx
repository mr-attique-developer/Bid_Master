import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlusIcon, XIcon, ImageIcon, CheckCircle, Mail, CreditCard } from "lucide-react";
import { useNotification } from "../components/ui/NotificationProvider";
import { useCreateProductMutation } from "../services/productApi";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";

const CreateAuction = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    condition: "",
    description: "",
    startingPrice: "",
    minBidIncrement: "5",
    bidDuration: "7",
    location: "",
    shippingOptions: "pickup",
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdProductTitle, setCreatedProductTitle] = useState("");
  const categories = [
    "Electronics",
    "Collectibles",
    "Fashion",
    "Home & Garden",
    "Art",
    "Vehicles",
    "Toys & Hobbies",
    "Jewelry",
    "Books",
    "Sports",
    "Other",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  // Handle file input change for images
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      addNotification("You can upload a maximum of 5 images.", "error");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    // For preview
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };
  const [createProduct, { isLoading, isSuccess, isError, data }] =
    useCreateProductMutation();
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Starting product creation...");
    
    if (images.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }
    
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "category" || key === "condition") {
        form.append(key, value.toLowerCase());
      } else if (key === "bidDuration" || key === "startingPrice" || key === "minBidIncrement") {
        // Ensure numeric fields are properly converted
        form.append(key, Number(value).toString());
      } else {
        form.append(key, value);
      }
    });

    images.forEach((image) => {
      form.append("images", image);
    });
    
    try {
      console.log("📤 Sending product data to server...");
      const result = await createProduct(form).unwrap();
      console.log("✅ Product creation result:", result);
      
      // Store the product title for the success modal
      setCreatedProductTitle(formData.title);
      
      // Reset form after successful submission
      setFormData({
        title: "",
        category: "",
        condition: "",
        description: "",
        startingPrice: "",
        minBidIncrement: "5",
        bidDuration: "7",
        location: "",
        shippingOptions: "pickup",
      });
      setImages([]);
      setImagePreviews([]);
      
      // Show success modal instead of immediate navigation
      setShowSuccessModal(true);
      
      console.log("✅ Product created successfully");
    } catch (error) {
      console.error("❌ Error creating auction:", error);
      // If error.data is HTML, show a generic message
      if (error?.status === "PARSING_ERROR") {
        toast.error("Server error. Please try again with different image formats (PNG/JPG).");
      } else {
        toast.error(error?.data?.message || "Failed to create auction. Please try again.");
      }
      return;
    }
  };
  if (isSuccess) {
    console.log(data.message); // "Product Created Successfully"
    // Use data.product, etc.
  }

  if (isLoading) {
    return (
      <LoadingSpinner 
        size="lg" 
        text="Creating your auction..." 
        showBackground={true}
      />
    );
  }
  // {isError && <div className="text-red-500">{error?.data?.message || "Something went wrong."}</div>}

  return (
    <div className="bg-gray-50 min-h-screen w-full pb-12">
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
                  <label
                    htmlFor="title"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Vintage Camera Collection"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="category"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="condition"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select condition</option>
                    <option value="new">New</option>
                    <option value="like new">Like New</option>
                    <option value="used">Used</option>
                    <option value="used-excellent">Used - Excellent</option>
                    <option value="used-good">Used - Good</option>
                    <option value="used-fair">Used - Fair</option>
                    <option value="for parts or not working">
                      For parts or not working
                    </option>
                  </select>
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="description"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide a detailed description of your item..."
                    required
                  />
                </div>
              </div>
              {/* Images and Pricing */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Images</h2>
                <div className="mb-6">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={images.length >= 5}
                    className="mb-2"
                  />
                  <p className="text-sm text-gray-500 mb-2">
                    Add at least one image of your item. You can add up to 5
                    images.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {imagePreviews.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Auction image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>
                <h2 className="text-lg font-semibold mb-4 mt-8">
                  Pricing & Duration
                </h2>
                <div className="mb-4">
                  <label
                    htmlFor="startingPrice"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Starting Price (₨) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="startingPrice"
                    name="startingPrice"
                    value={formData.startingPrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="minBidIncrement"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Minimum Bid Increment (₨)
                  </label>
                  <input
                    type="number"
                    id="minBidIncrement"
                    name="minBidIncrement"
                    value={formData.minBidIncrement}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5.00"
                    min="1"
                    step="1"
                  />
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="bidDuration"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Auction Duration (days)
                  </label>
                  <select
                    id="bidDuration"
                    name="bidDuration"
                    value={formData.bidDuration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
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
                  <label
                    htmlFor="location"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. New York, NY"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="shippingOptions"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Shipping Options
                  </label>
                  <select
                    id="shippingOptions"
                    name="shippingOptions"
                    value={formData.shippingOptions}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
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
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
              >
                Create Auction
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Auction Created Successfully!
              </h3>
              <p className="text-gray-600">
                Your auction "{createdProductTitle}" has been created.
              </p>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">
                    Check Your Email
                  </h4>
                  <p className="text-blue-700 text-sm">
                    We've sent you an email with instructions to pay the admin fee and activate your auction.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CreditCard className="w-6 h-6 text-amber-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-1">
                    Admin Fee Required
                  </h4>
                  <p className="text-amber-700 text-sm">
                    Complete the admin fee payment to make your auction visible to bidders.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/dashboard");
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors font-medium"
              >
                Create Another
              </button>
            </div>

            {/* Important Note */}
            <p className="text-center text-gray-500 text-xs mt-4">
              💡 Your auction will be pending until the admin fee is paid
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAuction;
