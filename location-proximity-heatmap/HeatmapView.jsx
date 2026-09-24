import React, { useState } from 'react';

export default function HeatmapView() {
  const [selectedZone, setSelectedZone] = useState('All');

  const zones = [
    { id: 1, name: 'Library & Study Hall', activity: 'High', count: 18, color: '#ef4444' },
    { id: 2, name: 'Student Cafeteria', activity: 'High', count: 14, color: '#ef4444' },
    { id: 3, name: 'Sports Complex', activity: 'Medium', count: 7, color: '#f59e0b' },
    { id: 4, name: 'Engineering Block A', activity: 'Low', count: 3, color: '#10b981' },
  ];

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-surface, #0f172a)', borderRadius: '12px', border: '1px solid var(--border-color, #334155)', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>📍 Location Proximity Heatmap</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
            Visual density map of lost and found report clusters across campus zones.
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', background: '#1e293b', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #334155' }}>
          Live Tracking
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {zones.map((zone) => (
          <div
            key={zone.id}
            onClick={() => setSelectedZone(zone.name)}
            style={{
              padding: '1rem',
              borderRadius: '8px',
              background: selectedZone === zone.name ? 'rgba(59, 130, 246, 0.15)' : '#1e293b',
              border: `1px solid ${selectedZone === zone.name ? '#3b82f6' : '#334155'}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.95rem' }}>{zone.name}</strong>
              <span style={{ height: '10px', width: '10px', borderRadius: '50%', backgroundColor: zone.color }} />
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
              Incident Intensity: <strong>{zone.activity}</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '4px' }}>
              {zone.count} active reports nearby
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
