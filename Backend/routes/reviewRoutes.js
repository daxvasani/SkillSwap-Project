// routes/reviewRoutes.js

const express = require("express");
const router = express.Router();
const { createReview, getReviewsForUser } = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createReview);
router.get("/user/:userId", getReviewsForUser);

module.exports = router;
