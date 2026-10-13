// controllers/swapController.js

const SwapRequest = require("../models/SwapRequest");
const Skill = require("../models/Skill");
const User = require("../models/User");
const { createNotification } = require("./notificationController");

// POST /api/swaps   (protected)
// Business rule: swaps are only allowed between students from the SAME college.
exports.createSwapRequest = async (req, res) => {
  try {
    const { skillId, offeredSkill, requestedSkill, message } = req.body;

    if (!skillId || !offeredSkill || !requestedSkill) {
      return res.status(400).json({ message: "skillId, offeredSkill and requestedSkill are required" });
    }

    const skill = await Skill.findById(skillId);
    if (!skill) return res.status(404).json({ message: "Skill not found" });

    const sender = await User.findById(req.user.id);
    const receiverId = skill.userId.toString();

    // Prevent self-swap
    if (receiverId === req.user.id) {
      return res.status(400).json({ message: "You cannot request a swap on your own skill" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "Skill owner not found" });

    // Same-college restriction
    if (sender.college.trim().toLowerCase() !== receiver.college.trim().toLowerCase()) {
      return res.status(400).json({
        message: "You can only swap skills with students from your college."
      });
    }

    const swapRequest = await SwapRequest.create({
      senderId: sender._id,
      receiverId: receiver._id,
      skillId: skill._id,
      offeredSkill,
      requestedSkill,
      message: message || ""
    });

    await createNotification({
      userId: receiver._id,
      type: "swap_request",
      title: "New Swap Request",
      message: `${sender.firstName} ${sender.lastName} wants to swap "${offeredSkill}" for your "${skill.skill}"`,
      relatedId: swapRequest._id
    });

    res.status(201).json({ message: "Swap request sent successfully", swapRequest });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// GET /api/swaps/my   (protected — requests I sent)
exports.getMySwaps = async (req, res) => {
  try {
    const swaps = await SwapRequest.find({ senderId: req.user.id })
      .populate("receiverId", "firstName lastName college")
      .populate("skillId", "skill category")
      .sort({ createdAt: -1 });

    res.status(200).json({ swaps });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// GET /api/swaps/received   (protected — requests sent to me)
exports.getReceivedSwaps = async (req, res) => {
  try {
    const swaps = await SwapRequest.find({ receiverId: req.user.id })
      .populate("senderId", "firstName lastName college")
      .populate("skillId", "skill category")
      .sort({ createdAt: -1 });

    res.status(200).json({ swaps });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// GET /api/swaps/:id   (protected)
exports.getSwapById = async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id)
      .populate("senderId", "firstName lastName college")
      .populate("receiverId", "firstName lastName college")
      .populate("skillId", "skill category");

    if (!swap) return res.status(404).json({ message: "Swap request not found" });

    const isParticipant =
      swap.senderId._id.toString() === req.user.id || swap.receiverId._id.toString() === req.user.id;
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    res.status(200).json({ swap });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// PUT /api/swaps/:id/accept   (protected — only the receiver)
exports.acceptSwap = async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: "Swap request not found" });

    if (swap.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the receiver can accept this request" });
    }
    if (swap.status !== "pending") {
      return res.status(400).json({ message: `Cannot accept a request that is already ${swap.status}` });
    }

    swap.status = "accepted";
    swap.updatedAt = new Date();
    await swap.save();

    await createNotification({
      userId: swap.senderId,
      type: "swap_accepted",
      title: "Swap Request Accepted",
      message: "Your swap request was accepted. You can now schedule a session.",
      relatedId: swap._id
    });

    res.status(200).json({ message: "Swap request accepted", swap });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// PUT /api/swaps/:id/reject   (protected — only the receiver)
exports.rejectSwap = async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: "Swap request not found" });

    if (swap.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the receiver can reject this request" });
    }
    if (swap.status !== "pending") {
      return res.status(400).json({ message: `Cannot reject a request that is already ${swap.status}` });
    }

    swap.status = "rejected";
    swap.updatedAt = new Date();
    await swap.save();

    await createNotification({
      userId: swap.senderId,
      type: "swap_rejected",
      title: "Swap Request Rejected",
      message: "Your swap request was rejected.",
      relatedId: swap._id
    });

    res.status(200).json({ message: "Swap request rejected", swap });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// PUT /api/swaps/:id/cancel   (protected — only the sender)
exports.cancelSwap = async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: "Swap request not found" });

    if (swap.senderId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the sender can cancel this request" });
    }
    if (swap.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel a completed swap" });
    }

    swap.status = "cancelled";
    swap.updatedAt = new Date();
    await swap.save();

    res.status(200).json({ message: "Swap request cancelled", swap });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// PUT /api/swaps/:id/complete   (protected — either participant)
exports.completeSwap = async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: "Swap request not found" });

    const isParticipant =
      swap.senderId.toString() === req.user.id || swap.receiverId.toString() === req.user.id;
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    if (swap.status !== "accepted") {
      return res.status(400).json({ message: "Only an accepted swap can be marked as completed" });
    }

    swap.status = "completed";
    swap.updatedAt = new Date();
    await swap.save();

    res.status(200).json({ message: "Swap marked as completed", swap });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};
