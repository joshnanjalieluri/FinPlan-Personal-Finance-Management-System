const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        currency: {
            type: String,
            required: true,
            enum: ["INR", "USD", "EUR", "GBP", "JPY", "AED", "AUD", "CAD", "SGD", "SAR"],
            default: "INR"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);