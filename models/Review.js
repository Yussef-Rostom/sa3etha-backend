const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        expert: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        contactRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ContactRequest",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

reviewSchema.index({ expert: 1, createdAt: -1 });
reviewSchema.index({ contactRequest: 1 }, { unique: true }); // Ensure one review per contact

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
