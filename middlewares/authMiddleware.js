const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const protect = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies.token; // Check if token exists
        if (!token) {
            res.status(401);
            throw new Error("Not Authorized, Please Login!");
        }

        // Verify Token
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // Get user id from token
        const user = await User.findById(verified.id).select("-password"); // Use select method for the fields you don't want to return, In our case it's password field
        if (!user) {
            res.status(401);
            throw new Error("User not found!");
        }
        req.user = user; // Save the user data in request object
        next();
    } catch (error) {
        res.status(401);
        throw new Error("Not Authorized, Please Login!");
    }
});

module.exports = protect;