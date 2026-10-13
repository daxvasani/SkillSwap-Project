// models/Notification.js

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who receives it
  type: {
    type: String,
    enum: [
      "swap_request", "swap_accepted", "swap_rejected", "swap_cancelled",
      "booking_created", "booking_confirmed", "booking_cancelled",
      "session_completed", "review_received"
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId, default: null }, // id of swap/booking/review
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);
