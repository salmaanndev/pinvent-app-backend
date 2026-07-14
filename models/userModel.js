const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please add a name"]
        },
        email: {
            type: String,
            required: [true, "Please add an email"],
            unique: true,
            trim: true, //To remove any space around the email,
            match: [
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                "Please enter a valid email"
            ]  // open the array, match and validate the email
        },
        password: {
            type: String,
            required: [true, "Please add a password"],
            minLength: [6, "Password must be upto 6 characters"],
            //maxLength: [23, "Password cannot be more than 23 characters"]
        },
        photo: {
            type: String,
            required: [true, "Please add a photo"],
            default: "https://i.ibb.co/4pDNDK1/avatar.png"
        },
        phone: {
            type: String,
            default: "+92"
        },
        bio: {
            type: String,
            maxLength: [250, "Bio cannot be more than 250 characters"],
            default: "bio"
        }
    },
    {
        timestamps: true
    }
);

// Encrypt password before saving to DB
userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) {
        return next();
    }

    // Hashed Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt)// takes 2 arguemnts, 1st what do you want to hash, 2nd where do you want to hash
    this.password = hashedPassword;
});

const User = mongoose.model("User", userSchema);

module.exports = User;