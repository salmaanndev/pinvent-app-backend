const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" }); //It takes 3 parameters, throught id parameter we are generating token with id, JWT_SECRET and expiresIn property
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please fill in all fields");
    }
    if (password.length < 6) {
        res.status(400);
        throw new Error("Password must be upto 6 characters");
    }

    // Check if user email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(404);
        throw new Error("User Already Exists");
    }

    // Create User
    const user = await User.create({ name, email, password });
    // Generate Token
    const token = generateToken(user._id);
    //Send HTTP-Only cookie
    res.cookie("token", token, {
        path: "/", // This is the path where cookie will be stored. Default is "/"
        httpOnly: true, // This boolean parameter flags the cookie to be only used by the web server
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: "none", // Our frontend and backend can have different URL's
        secure: true // This marks the cookie to be used only with https
    })
    if (user) {
        const { _id, name, email, photo, phone, bio } = user;
        res.status(201).json({ _id, name, email, photo, phone, bio, token });
    }
    else {
        res.status(400);
        throw new Error("Invalid User Data");
    }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate Request
    if (!email || !password) {
        res.status(400);
        throw new Error("Please add email and password");
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error("User not found please sign up");
    }

    //User exists, check if password is correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    // Generate Token
    const token = generateToken(user._id);
    //Send HTTP-Only cookie
    res.cookie("token", token, {
        path: "/", // This is the path where cookie will be stored. Default is "/"
        httpOnly: true, // This boolean parameter flags the cookie to be only used by the web server
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: "none", // Our frontend and backend can have different URL's
        secure: true // This marks the cookie to be used only with https
    });

    if (user && passwordIsCorrect) {
        const { _id, name, email, photo, phone, bio } = user;
        res.status(200).json({ _id, name, email, photo, phone, bio, token });
    }
    else {
        res.status(404);
        throw new Error("Invalid email or password");
    }
});

// Logout User
const logoutUser = asyncHandler(async (req, res) => {

    //Expire HTTP-Only cookie
    res.cookie("token", "", {
        path: "/", // This is the path where cookie will be stored. Default is "/"
        httpOnly: true, // This boolean parameter flags the cookie to be only used by the web server
        expires: new Date(0), // Expire the cookie
        sameSite: "none", // Our frontend and backend can have different URL's
        secure: true // This marks the cookie to be used only with https
    });
    return res.status(200).json({ message: "Successfully Logged Out" });
});

// Get User Data
const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id); //access the id from user saved in req from protect middleware
    if (user) {
        const { _id, name, email, photo, phone, bio } = user;
        res.status(201).json({ _id, name, email, photo, phone, bio, });
    }
    else {
        res.status(400);
        throw new Error("User not found!");
    }
});

// Get Login Status
const loginStatus = asyncHandler(async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json(false)
    }

    // Verify Token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified) {
        return res.json(true);
    }
    return res.json(false);
});

// Update User
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id); //access the id from user saved in req from protect middleware
    if (user) {
        const { name, email, photo, phone, bio } = user;
        user.email = email;
        user.name = req.body.name || name;
        user.phone = req.body.phone || phone;
        user.bio = req.body.bio || bio;
        user.photo = req.body.photo || photo;

        const updatedUser = await user.save();
        res.status(200).json({ _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, photo: updatedUser.photo, phone: updatedUser.phone, bio: updatedUser.bio });
    }
    else {
        res.status(404);
        throw new Error("User not found!");
    }
});

// Change Password
const changePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id); //access the id from user saved in req from protect middleware
    const { oldPassword, password } = req.body;

    // Check if user exists
    if (!user) {
        res.status(400);
        throw new Error("User not found please sign up!");
    }

    // Validate
    if (!oldPassword || !password) {
        res.status(400);
        throw new Error("Please add and new password!");
    }

    // Check if old password matches with password in DB
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

    // Save new password
    if (user && passwordIsCorrect) {
        user.password = password;
        await user.save();
        res.status(200).send("Password Changed Successfully");
    }
    else {
        res.status(400);
        throw new Error("Old password is incorrect!");
    }
});

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error("User does not exists!");
    }

    // Delete Token if it exists in DB
    let token = await Token.findOne({ userId: user._id });
    if (token) {
        await token.deleteOne();
    }

    // Create Reset Token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
    console.log(resetToken);

    // Hash Token before saving to DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save token to DB
    await new Token(
        {
            userId: user._id,
            token: hashedToken,
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * (60 * 1000) // Thirty Minutes
        }
    ).save();

    // Construct Reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    //Reset Email
    const message = `
    <h2>Hello ${user.name}</h2>
    <p>Please use the url below to reset your password</p>
    <p>This reset link is valid for 30 minutes</p>
    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    <p>Regars</p>
    <p>Salman Ahmad</p>
    `;

    const subject = "Password Reset Request";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    try {
        await sendEmail(subject, message, send_to, sent_from)
        res.status(200).json({ success: true, message: "Reset Email Sent" })
    } catch (error) {
        res.status(500);
        throw new Error("Email not Sent Please Try Again");
    }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { resetToken } = req.params;

    // Hash Token then compare to that one in the database
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Find token in DB
    const userToken = await Token.findOne({ token: hashedToken, expiresAt: { $gt: Date.now() } });

    if (!userToken) {
        res.status(404);
        throw new Error("Invalid or expired token");
    }

    // Find user
    const user = await User.findOne({ _id: userToken.userId });
    user.password = password;
    await user.save();
    res.status(200).json({
        messsage: "Password Reset Successful, please login!"
    });

});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword
}