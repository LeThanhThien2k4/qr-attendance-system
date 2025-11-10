import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { sendEmail } from "./emailService.js";

/**
 * Gửi thông báo cho 1 người dùng
 */
export const sendNotification = async (userId, title, content, type = "INFO") => {
  try {
    const notification = await Notification.create({ userId, title, content, type });

    // Gửi email song song (nếu người dùng có email)
    const user = await User.findById(userId);
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `[Thông báo] ${title}`,
        html: `
          <h3>${title}</h3>
          <p>${content}</p>
          <hr />
          <small>Hệ thống điểm danh QR</small>
        `,
      });
    }

    return notification;
  } catch (err) {
    console.error("❌ Error sending notification:", err.message);
  }
};

/**
 * Gửi thông báo hàng loạt (broadcast)
 */
export const sendBulkNotification = async (userIds, title, content, type = "INFO") => {
  try {
    const notifications = userIds.map((id) => ({
      userId: id,
      title,
      content,
      type,
    }));
    const created = await Notification.insertMany(notifications);
    console.log(`📢 Bulk notify → ${userIds.length} users`);
    return created;
  } catch (err) {
    console.error("❌ Bulk notification error:", err.message);
  }
};

/**
 * Đánh dấu thông báo đã đọc
 */
export const markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
};

/**
 * Lấy danh sách thông báo của user
 */
export const getUserNotifications = async (userId) => {
  return Notification.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Gửi thông báo hệ thống (ghi log để kiểm tra)
 */
export const sendSystemNotification = async (userId, title, content, type = "INFO") => {
  const notif = await sendNotification(userId, title, content, type);
  console.log(`🧩 [SYSTEM] ${title} → user:${userId}`);
  return notif;
};
