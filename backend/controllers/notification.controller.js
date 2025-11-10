import {
  sendNotification,
  sendBulkNotification,
  getUserNotifications,
  markAsRead,
} from "../services/notificationService.js";

// Lấy danh sách thông báo của người dùng
export const getNotifications = async (req, res) => {
  try {
    const notifs = await getUserNotifications(req.user.id);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đánh dấu thông báo đã đọc
export const markNotificationRead = async (req, res) => {
  try {
    const notif = await markAsRead(req.params.id, req.user.id);
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin gửi thông báo cho 1 user
export const sendToUser = async (req, res) => {
  try {
    const { userId, title, content } = req.body;
    const notif = await sendNotification(userId, title, content);
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin gửi thông báo cho nhiều user
export const sendToMultiple = async (req, res) => {
  try {
    const { userIds, title, content } = req.body;
    const notifs = await sendBulkNotification(userIds, title, content);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
