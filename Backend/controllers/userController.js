// controllers/userController.js

const User = require("../models/User");

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// PUT /api/users/profile   (protected — updates the logged-in user only)
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, college, year, profileImage, bio } = req.body;

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (college !== undefined) updates.college = college;
    if (year !== undefined) updates.year = year;
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (bio !== undefined) updates.bio = bio;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    }).select("-password");

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};
