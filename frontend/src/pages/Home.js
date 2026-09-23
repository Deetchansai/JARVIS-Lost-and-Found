import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import ItemCard from '../components/ItemCard';
import { api } from '../services/api';

const CATEGORIES = [
  'All',
  'Electronics',
  'Books & Notebooks',
  'ID & Cards',
  'Clothing & Accessories',
  'Bags & Backpacks',
  'Keys',
  'Water Bottles',
  'Other',
];

export default function Home() {
  const [items, setItems] = useState([]);
  const [typeFilter, setTypeFilter] = useState(''); // '' = All, 'LOST', 'FOUND'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, categoryFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await api.getItems({
        type: typeFilter,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        search: searchQuery || undefined,
      });
      setItems(res.data?.items || []);
    } catch (err) {
      console.error('Failed to load items:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadItems();
  };

  return (
    <div>
      {/* Hero Search Section */}
      <section style={{ textAlign: 'center', margin: '2rem 0 3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Find What You Lost on Campus
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          Our AI multimodal engine automatically pairs reported lost items with found belongings using image and text matching.
        </p>

        <form
          onSubmit={handleSearchSubmit}
          style={{
            maxWidth: '550px',
            margin: '0 auto',
            display: 'flex',
            gap: '8px',
            background: 'var(--bg-surface)',
            padding: '6px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '12px', color: 'var(--text-muted)' }}>
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search by title, location, or keywords (e.g. blue Hydro Flask)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 1.2rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </section>

      {/* Filters Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setTypeFilter('')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: typeFilter === '' ? 'var(--primary)' : 'var(--bg-surface)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            All Items
          </button>
          <button
            onClick={() => setTypeFilter('LOST')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: typeFilter === 'LOST' ? '#ef4444' : 'var(--bg-surface)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Lost Only
          </button>
          <button
            onClick={() => setTypeFilter('FOUND')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: typeFilter === 'FOUND' ? '#10b981' : 'var(--bg-surface)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Found Only
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          Loading campus items...
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <h3>No items found</h3>
          <p style={{ marginTop: '0.5rem' }}>Try adjusting your search criteria or report a new item.</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
