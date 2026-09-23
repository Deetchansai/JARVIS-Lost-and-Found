const Notification = require('../models/Notification');
const emailService = require('./emailService');

/**
 * In-App and Push Notification Management Service
 */
class NotificationService {
  /**
   * Dispatch a notification for an identified item match
   */
  async createMatchNotification({ recipientId, recipientEmail, recipientName, lostItem, foundItem, score }) {
    try {
      const percentage = (score * 100).toFixed(0);
      const title = `Potential Match Found (${percentage}%)`;
      const message = `A found item "${foundItem.title}" strongly matches your reported lost item "${lostItem.title}".`;

      const notification = await Notification.create({
        recipient: recipientId,
        title,
        message,
        type: 'MATCH_FOUND',
        relatedItem: foundItem._id,
      });

      // Also trigger email notification if address available
      if (recipientEmail) {
        await emailService.sendMatchAlert({
          toEmail: recipientEmail,
          userName: recipientName || 'Campus Member',
          lostItemTitle: lostItem.title,
          foundItemTitle: foundItem.title,
          matchScore: score,
        });
      }

      return notification;
    } catch (error) {
      console.error('[NotificationService] Error creating match notification:', error);
      throw error;
    }
  }

  /**
   * Fetch unread notifications for a user
   */
  async getUserNotifications(userId) {
    return Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(20);
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
  }
}

module.exports = new NotificationService();
