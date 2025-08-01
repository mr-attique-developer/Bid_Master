import mongoose from "mongoose";

const productSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter your product title"],
    },
    description: {
      type: String,
      required: [true, "Please enter your product description"],
    },
    image: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    startingPrice: {
      type: Number,
      required: [true, "Please enter your product price"],
    },
    minBidIncrement: {
      type: Number,
      required: [true, "Please enter your minimun Bid"],
      default: 10,
    },
    bidDuration: {
      type: Number,
      enum: [3, 5, 7, 10, 14, 30],
      required: [true, "Please enter your Bid duration"],
      default: 7,
    },
    location: {
      type: String,
      required: [true, "Please enter your product location"],
    },
    status: {
      type: String,
      enum: ["pending", "listed", "closed", "sold", "ended", "rejected"],
      default: "pending",
    },
    adminFeePaid: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      required: [true, "Please enter your product category"],
      enum: [
        "electronics",
        "collectibles",
        "fashion",
        "home & garden",
        "art",
        "vehicles",
        "toys & hobbies",
        "jewelry",
        "books",
        "sports",
        "other",
      ],
      default: "others",
    },
    condition: {
      type: String,
      required: [true, "Please enter your product condition"],
      enum: [
        "new",
        "like new",
        "used",
        "used-excellent",
        "used-good",
        "used-fair",
        "for parts or not working",
      ],
      default: "new",
    },
    shippingOption: {
      type: String,
      enum: ["Local Pickup Only", "Shipping Available"],
      default: "Local Pickup Only",
    },
    endsAt: { type: Date },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    winningBid: {
      type: Number,
      default: null,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
