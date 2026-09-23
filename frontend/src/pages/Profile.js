import React, { useState } from 'react';
import { User } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState({
    name: 'Alex Chen',
    email: 'alex.chen@university.edu',
    campusId: 'STU-2024-8891',
    role: 'Student',
    emailAlerts: true,
    inAppAlerts: true,
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (key) => {
    setProfile((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="form-container" style={{ maxWidth: '600px' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem',
          }}
        >
          <User size={32} color="white" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{profile.name}</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{profile.role} Account</span>
      </div>

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Campus Email</label>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <input
              type="email"
              className="form-input"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Campus ID / Roll Number</label>
          <input
            type="text"
            className="form-input"
            value={profile.campusId}
            onChange={(e) => setProfile({ ...profile, campusId: e.target.value })}
          />
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Notification Preferences</h4>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Instant AI Match Email Alerts</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Receive instant emails when a newly reported item matches your listing.
              </div>
            </div>
            <input
              type="checkbox"
              checked={profile.emailAlerts}
              onChange={() => handleToggle('emailAlerts')}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>In-App Push Indicators</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Show bell badges when status updates or comments are added.
              </div>
            </div>
            <input
              type="checkbox"
              checked={profile.inAppAlerts}
              onChange={() => handleToggle('inAppAlerts')}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1.5rem' }}>
          {saved ? 'Saved Successfully!' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
}
