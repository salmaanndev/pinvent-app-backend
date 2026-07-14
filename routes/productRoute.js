const express = require("express");
const protect = require("../middlewares/authMiddleware");
const { createProduct, getProducts, deleteProduct, updateProduct, getProduct } = require("../controllers/productController");
const { upload } = require("../utils/fileUpload");
const router = express.Router();

router.post("/", protect, upload.single("image"), createProduct);
router.get("/", protect, getProducts);
router.get("/:id", protect, getProduct);
router.delete("/:id", protect, deleteProduct);
router.patch("/:id", protect, upload.single("image"), updateProduct);

module.exports = router;