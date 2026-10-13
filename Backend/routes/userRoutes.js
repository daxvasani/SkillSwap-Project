// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const { getUserById, updateProfile } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// NOTE: /profile must be declared before /:id so Express doesn't treat "profile" as an id
router.put("/profile", authMiddleware, updateProfile);
router.get("/:id", getUserById);

module.exports = router;
