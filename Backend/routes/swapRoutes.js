// routes/swapRoutes.js

const express = require("express");
const router = express.Router();
const {
  createSwapRequest,
  getMySwaps,
  getReceivedSwaps,
  getSwapById,
  acceptSwap,
  rejectSwap,
  cancelSwap,
  completeSwap
} = require("../controllers/swapController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createSwapRequest);
router.get("/my", authMiddleware, getMySwaps);
router.get("/received", authMiddleware, getReceivedSwaps);
router.get("/:id", authMiddleware, getSwapById);
router.put("/:id/accept", authMiddleware, acceptSwap);
router.put("/:id/reject", authMiddleware, rejectSwap);
router.put("/:id/cancel", authMiddleware, cancelSwap);
router.put("/:id/complete", authMiddleware, completeSwap);

module.exports = router;
