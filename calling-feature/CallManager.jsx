import React, { useState } from 'react';

export default function CallManager({ contactName = 'Item Finder' }) {
  const [callStatus, setCallStatus] = useState('IDLE'); // IDLE, CONNECTING, ACTIVE, ENDED

  const handleStartCall = () => {
    setCallStatus('CONNECTING');
    setTimeout(() => setCallStatus('ACTIVE'), 1500);
  };

  const handleEndCall = () => {
    setCallStatus('ENDED');
    setTimeout(() => setCallStatus('IDLE'), 2000);
  };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-surface, #0f172a)', borderRadius: '12px', border: '1px solid var(--border-color, #334155)', color: '#f8fafc', maxWidth: '420px' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>📞 Secure Voice Contact</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Connect securely with the item finder without exposing personal telephone numbers.
      </p>

      <div style={{ textAlign: 'center', padding: '1.5rem 1rem', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{contactName}</div>
        <div style={{ fontSize: '0.85rem', color: callStatus === 'ACTIVE' ? '#10b981' : '#94a3b8', marginTop: '6px' }}>
          {callStatus === 'IDLE' && 'Ready to connect'}
          {callStatus === 'CONNECTING' && 'Establishing secure audio stream...'}
          {callStatus === 'ACTIVE' && 'Call in progress • Encrypted'}
          {callStatus === 'ENDED' && 'Call finished'}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          {callStatus === 'IDLE' ? (
            <button
              type="button"
              onClick={handleStartCall}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Start Voice Call
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEndCall}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              End Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
