// models/Skill.js

const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skill: { type: String, required: true },         // e.g. "React & Next.js"
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ["Tech", "Design", "Music", "Language", "Academics", "Sports", "Other"]
  },
  tags: [{ type: String }],
  college: { type: String, required: true },        // copied from user for easy filtering
  year: { type: String, required: true },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalSwaps: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Skill", skillSchema);
