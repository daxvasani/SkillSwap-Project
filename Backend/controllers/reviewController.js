// controllers/reviewController.js

const Review = require("../models/Review");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Skill = require("../models/Skill");
const { createNotification } = require("./notificationController");

// POST /api/reviews   (protected)
// Only allowed once the booking/session has status "completed"
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ message: "bookingId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isParticipant =
      booking.teacherId.toString() === req.user.id || booking.learnerId.toString() === req.user.id;
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    if (booking.status !== "completed") {
      return res.status(400).json({ message: "You can only review a completed session" });
    }

    // The person being reviewed is whichever participant is NOT the reviewer
    const reviewedUserId =
      req.user.id === booking.teacherId.toString() ? booking.learnerId : booking.teacherId;

    const alreadyReviewed = await Review.findOne({
      reviewerId: req.user.id,
      bookingId
    });
    if (alreadyReviewed) {
      return res.status(400).json({ message: "You have already reviewed this session" });
    }

    const review = await Review.create({
      reviewerId: req.user.id,
      reviewedUserId,
      swapRequestId: booking.swapRequestId,
      bookingId,
      rating,
      comment: comment || ""
    });

    // Recalculate the reviewed user's average rating
    const userReviews = await Review.find({ reviewedUserId });
    const avg = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;

    await User.findByIdAndUpdate(reviewedUserId, {
      avgRating: Math.round(avg * 10) / 10,
      totalReviews: userReviews.length
    });

    // If the reviewed user owns the skill from this booking, update the skill's rating too
    const skill = await Skill.findById(booking.skillId);
    if (skill && skill.userId.toString() === reviewedUserId.toString()) {
      const skillReviews = await Review.find({ reviewedUserId, swapRequestId: booking.swapRequestId });
      skill.rating = Math.round(avg * 10) / 10;
      skill.totalReviews = userReviews.length;
      await skill.save();
    }

    await createNotification({
      userId: reviewedUserId,
      type: "review_received",
      title: "New Review Received",
      message: `You received a ${rating}-star review.`,
      relatedId: review._id
    });

    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// GET /api/reviews/user/:userId
exports.getReviewsForUser = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedUserId: req.params.userId })
      .populate("reviewerId", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};
