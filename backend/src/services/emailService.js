/**
 * Email Notification Service Stub
 * Integrates with SMTP / SendGrid / Nodemailer to notify users when items are matched.
 */

class EmailService {
  /**
   * Send notification when an AI match is detected
   */
  async sendMatchAlert({ toEmail, userName, lostItemTitle, foundItemTitle, matchScore }) {
    console.log(`[EmailService] Preparing match alert email to ${toEmail}`);
    console.log(`[EmailService] Lost: "${lostItemTitle}" | Found: "${foundItemTitle}" | Score: ${(matchScore * 100).toFixed(1)}%`);

    // In production, configure nodemailer transporter:
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ ... });

    return {
      success: true,
      recipient: toEmail,
      timestamp: new Date().toISOString(),
      message: 'Match notification email queued/sent successfully (stub)',
    };
  }

  /**
   * Send claim status update
   */
  async sendStatusUpdate({ toEmail, itemTitle, newStatus }) {
    console.log(`[EmailService] Sending status update for "${itemTitle}" -> ${newStatus} to ${toEmail}`);
    return {
      success: true,
      recipient: toEmail,
      status: newStatus,
    };
  }
}

module.exports = new EmailService();
