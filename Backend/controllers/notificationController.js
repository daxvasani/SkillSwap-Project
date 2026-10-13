// controllers/notificationController.js

const Notification = require("../models/Notification");

// Shared helper used by other controllers to create a notification
// whenever something important happens (swap request, accept, booking, review, etc.)
exports.createNotification = async ({ userId, type, title, message, relatedId }) => {
  try {
    await Notification.create({ userId, type, title, message, relatedId: relatedId || null });
  } catch (err) {
    // A failed notification should never break the main action (e.g. accepting a swap)
    console.error("Failed to create notification:", err.message);
  }
};

// GET /api/notifications   (protected)
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ notifications });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// PUT /api/notifications/:id/read   (protected)
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: "Notification marked as read", notification });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};

// PUT /api/notifications/read-all   (protected)
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
};
