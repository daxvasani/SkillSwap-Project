// models/Review.js

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reviewedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  swapRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "SwapRequest", required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Review", reviewSchema);
