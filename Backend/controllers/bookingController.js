// controllers/bookingController.js

const Booking = require("../models/Booking");
const SwapRequest = require("../models/SwapRequest");
const { createNotification } = require("./notificationController");

// POST /api/bookings   (protected)
// Only allowed when the linked swap request has status "accepted"
exports.createBooking = async (req, res) => {
  try {
    const { swapRequestId, date, startTime, endTime, mode, meetingLink, notes } = req.body;

    if (!swapRequestId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "swapRequestId, date, startTime and endTime are required" });
    }

    const swap = await SwapRequest.findById(swapRequestId);
    if (!swap) return res.status(404).json({ message: "Swap request not found" });

    const isParticipant =
      swap.senderId.toString() === req.user.id || swap.receiverId.toString() === req.user.id;
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    if (swap.status !== "accepted") {
      return res.status(400).json({ message: "You can only book a session for an accepted swap request" });
    }

    // teacher = the skill owner (receiver of the request), learner = the sender
    const teacherId = swap.receiverId;
    const learnerId = swap.senderId;

    // Basic overlap check: same student, same date, overlapping time range
    const overlap = await Booking.findOne({
      date,
      status: "scheduled",
      $or: [{ teacherId }, { learnerId }, { teacherId: learnerId }, { learnerId: teacherId }],
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    });

    if (overlap) {
      return res.status(400).json({ message: "One of the students already has a booking at this time" });
    }

    const booking = await Booking.create({
      swapRequestId,
      teacherId,
      learnerId,
      skillId: swap.skillId,
      date,
      startTime,
      endTime,
      mode: mode || "online",
      meetingLink: meetingLink || "",
      notes: notes || ""
    });

    const otherUserId = req.user.id === teacherId.toString() ? learnerId : teacherId;
    await createNotification({
      userId: otherUserId,
      type: "booking_created",
      title: "New Session Booking",
      message: `A session has been booked for ${date} at ${startTime}.`,
      relatedId: booking._id
    });

    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// GET /api/bookings/my   (protected — bookings where I'm teacher or learner)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ teacherId: req.user.id }, { learnerId: req.user.id }]
    })
      .populate("teacherId", "firstName lastName")
      .populate("learnerId", "firstName lastName")
      .populate("skillId", "skill")
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({ bookings });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// GET /api/bookings/:id   (protected)
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("teacherId", "firstName lastName")
      .populate("learnerId", "firstName lastName")
      .populate("skillId", "skill");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isParticipant =
      booking.teacherId._id.toString() === req.user.id || booking.learnerId._id.toString() === req.user.id;
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    res.status(200).json({ booking });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// PUT /api/bookings/:id/cancel   (protected — either participant)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isParticipant =
      booking.teacherId.toString() === req.user.id || booking.learnerId.toString() === req.user.id;
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    if (booking.status !== "scheduled") {
      return res.status(400).json({ message: `Cannot cancel a booking that is already ${booking.status}` });
    }

    booking.status = "cancelled";
    await booking.save();

    const otherUserId =
      req.user.id === booking.teacherId.toString() ? booking.learnerId : booking.teacherId;
    await createNotification({
      userId: otherUserId,
      type: "booking_cancelled",
      title: "Booking Cancelled",
      message: `The session scheduled for ${booking.date} at ${booking.startTime} was cancelled.`,
      relatedId: booking._id
    });

    res.status(200).json({ message: "Booking cancelled", booking });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// PUT /api/bookings/:id/complete   (protected — either participant)
exports.completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isParticipant =
      booking.teacherId.toString() === req.user.id || booking.learnerId.toString() === req.user.id;
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    if (booking.status !== "scheduled") {
      return res.status(400).json({ message: `Cannot complete a booking that is already ${booking.status}` });
    }

    booking.status = "completed";
    await booking.save();

    const otherUserId =
      req.user.id === booking.teacherId.toString() ? booking.learnerId : booking.teacherId;
    await createNotification({
      userId: otherUserId,
      type: "session_completed",
      title: "Session Completed",
      message: "Your session was marked as completed. You can now leave a review.",
      relatedId: booking._id
    });

    res.status(200).json({ message: "Booking marked as completed", booking });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};
