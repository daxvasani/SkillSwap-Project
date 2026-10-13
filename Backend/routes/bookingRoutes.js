// routes/bookingRoutes.js

const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  completeBooking
} = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createBooking);
router.get("/my", authMiddleware, getMyBookings);
router.get("/:id", authMiddleware, getBookingById);
router.put("/:id/cancel", authMiddleware, cancelBooking);
router.put("/:id/complete", authMiddleware, completeBooking);

module.exports = router;
