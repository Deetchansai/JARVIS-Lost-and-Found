import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../services/api';

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const loadNotifications = async () => {
      try {
        const res = await api.getNotifications(userId);
        if (res.data?.notifications) {
          setNotifications(res.data.notifications);
        }
      } catch (err) {
        console.warn('Failed to load notifications:', err.message);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id, userId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-main)',
          cursor: 'pointer',
          position: 'relative',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '9999px',
              padding: '2px 5px',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '36px',
            width: '320px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow)',
            padding: '12px',
            zIndex: 200,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {unreadCount} unread
            </span>
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleMarkAsRead(n._id)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    background: n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid',
                    borderColor: n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.3)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{n.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
