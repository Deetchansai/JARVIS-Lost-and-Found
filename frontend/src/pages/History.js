import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Sparkles, Check, X } from 'lucide-react';

export default function History({ currentUserId }) {
  const [userItems, setUserItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    loadUserItems();
  }, [currentUserId]);

  const loadUserItems = async () => {
    try {
      const res = await api.getItems({ limit: 50 });
      // In demo/full setup, filter by user id; here display recent items for exploration
      setUserItems(res.data?.items || []);
      if (res.data?.items?.length > 0) {
        handleSelectItem(res.data.items[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectItem = async (item) => {
    setSelectedItem(item);
    setLoadingMatches(true);
    try {
      const res = await api.getMatchesForItem(item._id);
      setMatches(res.data?.matches || []);
    } catch (err) {
      console.error(err);
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleConfirmMatch = async (matchId, newStatus) => {
    try {
      await api.updateMatchStatus(matchId, newStatus);
      if (selectedItem) {
        handleSelectItem(selectedItem);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Item Tracking & AI Matches
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Review your reported items and inspect AI-discovered match candidates.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        {/* Left Column: Reported Items List */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Recent Reports</h3>
          {userItems.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No reported items yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {userItems.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleSelectItem(item)}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: selectedItem?._id === item._id ? 'var(--primary)' : 'var(--border-color)',
                    background: selectedItem?._id === item._id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{item.title}</strong>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: item.type === 'LOST' ? '#ef4444' : '#10b981',
                        color: 'white',
                      }}
                    >
                      {item.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {item.location} • Status: {item.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Match Candidates */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          {selectedItem ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <Sparkles size={20} color="#3b82f6" />
                <h3 style={{ fontSize: '1.1rem' }}>AI Matches for "{selectedItem.title}"</h3>
              </div>

              {loadingMatches ? (
                <p style={{ color: 'var(--text-muted)' }}>Calculating multimodal pairings...</p>
              ) : matches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  <p>No high-confidence match candidates identified yet.</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Our AI service continuously screens incoming reports against this listing.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {matches.map((m) => {
                    const candidate = selectedItem.type === 'LOST' ? m.foundItem : m.lostItem;
                    const percent = (m.hybridScore * 100).toFixed(1);
                    return (
                      <div
                        key={m._id}
                        style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px',
                          background: '#0f172a',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '1rem' }}>{candidate?.title || 'Matching Candidate'}</h4>
                          <span
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                              color: 'white',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                            }}
                          >
                            {percent}% Match
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '6px 0' }}>
                          {candidate?.description}
                        </p>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                          Location: {candidate?.location} | Status: {m.status}
                        </div>

                        {m.status === 'SUGGESTED' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleConfirmMatch(m._id, 'CONFIRMED_BY_USER')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                              }}
                            >
                              <Check size={14} /> Confirm Match
                            </button>
                            <button
                              onClick={() => handleConfirmMatch(m._id, 'REJECTED')}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                border: '1px solid var(--border-color)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                              }}
                            >
                              <X size={14} /> Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Select an item to view AI match pairings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
