import { cloudinary } from "../config/cloudinaryConfig.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import sendEmail from "../utils/email.js";

export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      startingPrice,
      minBidIncrement,
      bidDuration,
      location,
      category,
      condition,
    } = req.body;

    if (
      !title ||
      !description ||
      !startingPrice ||
      !minBidIncrement ||
      !bidDuration ||
      !location ||
      !category ||
      !condition
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all the fields" });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload at least one image" });
    }

    const sellerId = req.user._id;
    const image = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));

    // Calculate endsAt robustly
    const endsAt = new Date(Date.now() + Number(bidDuration) * 24 * 60 * 60 * 1000);

    const product = await Product.create({
      title,
      description,
      image,
      startingPrice,
      minBidIncrement,
      bidDuration,
      location,
      category,
      condition,
      seller: sellerId,
      adminFeePaid: false,
      status: "pending",
      endsAt,
    });

    // Send email to seller
    await sendEmail(
      req.user.email,
      "Pay 5% Admin Fee to List Your Product",
      `Hi ${req.user.fullName},\n\nYour product has been saved as 'Pending'.\nTo list it for bidding, please pay the 5% admin fee via JazzCash or EasyPaisa, then send the receipt to the admin on WhatsApp.\n\nPlease send the receipt here: https://wa.me/923164963275\n\nThank you!`
    );

    // Notify all other users
    const users = await User.find({ _id: { $ne: sellerId } }).select("email");
    for (const user of users) {
      await sendEmail(
        user.email,
        "New Product Added",
        `A new product has been added by ${req.user.fullName}, auction titled "${title}". Check it out!`
      );
    }

    res.status(201).json({
      success: true,
      message: "Product Created Successfully",
      product,
    });
  } 
 catch (error) {
  console.error(error);
  res.status(500).json({ success: false, message: error.message || "Error in creating Product" });
}
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).populate(
      "seller",
      "fullName email"
    );
    res
      .status(200)
      .json({
        count: Product.length,
        success: true,
        message: "Products fetched successfully",
        products,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error in fetching Products" });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      "seller",
      "fullName email"
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Product fetched successfully",
        product,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error in fetching Product" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      "seller",
      "fullName email"
    );
    console.log(product);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (product.seller._id.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({
          success: false,
          message: "You are not authorized to delete this product",
        });
    }
    await Product.findByIdAndDelete(id);
    for (const img of product.image) {
      cloudinary.uploader.destroy(img.public_id);
    }
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error in deleting Product" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      "seller",
      "fullName email"
    );
    console.log(product);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (product.seller._id.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({
          success: false,
          message: "You are not authorized to update this product",
        });
    }
    const {
      title,
      description,
      startingPrice,
      minBidIncrement,
      bidDuration,
      location,
      category,
      condition,
    } = req.body;
    if (
      !title ||
      !description ||
      !startingPrice ||
      !minBidIncrement ||
      !bidDuration ||
      !location ||
      !category ||
      !condition
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all the fields" });
    }
    console.log(
      title,
      description,
      startingPrice,
      minBidIncrement,
      bidDuration,
      location,
      category,
      condition
    );
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload at least one image" });
    }
    const image = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
    product.title = title;
    product.description = description;
    product.image = image;
    product.startingPrice = startingPrice;
    product.minBidIncrement = minBidIncrement;
    product.bidDuration = bidDuration;
    product.location = location;
    product.category = category;
    product.condition = condition;
    await product.save();
    res
      .status(200)
      .json({
        success: true,
        message: "Product updated successfully",
        product,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error in updating Product" });
  }
};



export const verifyAdminFee = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const now = new Date()
   const endsAt = new Date(now.getTime() + product.bidDuration * 24 * 60 * 60 * 1000); // add bid duration days
    product.adminFeePaid = true
    product.status = "listed"
    product.endsAt = endsAt


    await product.save();

    res.status(200).json({ success: true, message: "Admin fee verified and product is now listed", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error verifying admin fee" });
  }
};
