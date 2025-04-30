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
    image: {
      type: String,
      required: [true, "Please enter your product image"],
    },
    startingPrice: {
      type: Number,
      required: [true, "Please enter your product price"],
    },
    minBid: {
      type: Number,
      required: [true, "Please enter your minimun Bid"],
    },
    bidDuration: {
      type: Number,
      required: [true, "Please enter your Bid duration"],
    },
    location: {
      type: String,
      required: [true, "Please enter your product location"],
    },
    category: {
      type: String,
      required: [true, "Please enter your product category"],
      enum: [
        "electronics",
        "clothing",
        "furniture",
        "toys",
        "books",
        "sports",
        "jewelry",
        "automotive",
        "health",
        "beauty",
        "others",
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
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bids: [
      {
        bidder: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        bidAmount: {
          type: Number,
          required: true,
        },
        bidTime: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
