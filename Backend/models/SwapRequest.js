// models/SwapRequest.js

const mongoose = require("mongoose");

const swapRequestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true }, // the skill being requested
  offeredSkill: { type: String, required: true },   // free-text: what the sender is offering in return
  requestedSkill: { type: String, required: true }, // free-text: what the sender wants to learn
  message: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
    default: "pending"
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SwapRequest", swapRequestSchema);
