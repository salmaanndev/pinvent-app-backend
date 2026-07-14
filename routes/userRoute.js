const express = require("express");
const { registerUser, loginUser, logoutUser, getUser, loginStatus, updateUser, changePassword, forgotPassword, resetPassword } = require("../controllers/userController");
const protect = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.get("/getuser", protect, getUser);// Protect middleware to restrict the user that is logged out
router.get("/loggedin", loginStatus);
router.patch("/updateuser", protect, updateUser);// Protect middleware to restrict the user that is logged out
router.patch("/changepassword", protect, changePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);
module.exports = router;