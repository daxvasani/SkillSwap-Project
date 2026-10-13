// models/Booking.js

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  swapRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "SwapRequest", required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // skill owner
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // requester
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
  date: { type: String, required: true },       // "2026-09-01"
  startTime: { type: String, required: true },  // "15:00"
  endTime: { type: String, required: true },    // "16:00"
  mode: { type: String, enum: ["online", "offline"], default: "online" },
  meetingLink: { type: String, default: "" },
  status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);
