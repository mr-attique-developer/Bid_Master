import express from 'express';
import protect from '../middleware/user.middleware.js';
import upload from '../config/cloudinaryConfig.js';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  verifyAdminFee
} from '../controllers/product.controller.js';

const router = express.Router();

router.route("/createProduct").post(protect, upload.array("images", 5), createProduct);
router.route("/getAllProducts").get(protect, getAllProducts);
router.route("/getProduct/:id").get(protect, getSingleProduct);
router.route("/deleteProduct/:id").delete(protect, deleteProduct);
router.route("/updateProduct/:id").put(protect, upload.array("images", 5), updateProduct);
router.route("/verifyAdminFee/:id").put(protect, verifyAdminFee);

export default router;
