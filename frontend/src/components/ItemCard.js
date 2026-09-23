import React from 'react';
import { MapPin, Calendar, Tag } from 'lucide-react';

export default function ItemCard({ item, onSelect }) {
  const isLost = item.type === 'LOST';
  const formattedDate = item.dateOccurred
    ? new Date(item.dateOccurred).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="item-card" onClick={() => onSelect && onSelect(item)}>
      <div className="card-image-wrapper">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="card-image" />
        ) : (
          <span>No Photo Provided</span>
        )}
        <span className={`badge-tag ${isLost ? 'badge-lost' : 'badge-found'}`}>
          {item.type}
        </span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{item.title}</h3>
        <p className="card-desc">{item.description}</p>

        <div className="card-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={14} color="var(--primary)" />
            <span>{item.category || 'General'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="var(--text-muted)" />
            <span>{item.location}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="var(--text-muted)" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
