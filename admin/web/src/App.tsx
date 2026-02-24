import React, { useEffect, useState } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'audio' | 'video' | 'playlist' | 'announcement';
  url?: string;
  createdAt: string;
}

const types: ContentItem['type'][] = ['audio', 'video', 'playlist', 'announcement'];

export default function App() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [form, setForm] = useState({ title: '', description: '', type: 'audio', url: '' });
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    const res = await axios.get(`${apiUrl}/v1/content`);
    setItems(res.data.items || []);
  };

  const submit = async () => {
    if (!form.title || !form.description) return;
    setLoading(true);
    try {
      await axios.post(`${apiUrl}/v1/content`, form);
      setForm({ title: '', description: '', type: form.type, url: '' });
      await fetchItems();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems().catch(console.error);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#05060d', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ padding: '24px 32px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Claudy Admin</div>
          <div style={{ color: '#9ca3af', marginTop: 4 }}>Push new drops, sermons, and announcements to mobile clients.</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            style={primaryButton}
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <section style={card}>
          <div style={sectionTitle}>Create content</div>
          <label style={label}>Title</label>
          <input
            style={input}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Sunday Live Service"
          />
          <label style={label}>Description</label>
          <textarea
            style={{ ...input, minHeight: 80 }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add summary, timestamps, or links"
          />
          <label style={label}>Type</label>
          <select
            style={input}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as ContentItem['type'] })}
          >
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <label style={label}>Media URL (optional)</label>
          <input
            style={input}
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://cdn.yourhost.com/stream.mp3"
          />
          <button
            style={{ ...primaryButton, marginTop: 16 }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Publish to API'}
          </button>
        </section>

        <section style={card}>
          <div style={sectionTitle}>Recently published</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 520, overflowY: 'auto' }}>
            {items.map((item) => (
              <div key={item.id} style={listItem}>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.title}</div>
                  <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>{item.description}</div>
                  <div style={{ color: '#22d3ee', fontSize: 12, marginTop: 4 }}>{item.type.toUpperCase()}</div>
                </div>
                <div style={{ color: '#6b7280', fontSize: 12 }}>{new Date(item.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {items.length === 0 && <div style={{ color: '#6b7280' }}>Nothing published yet.</div>}
          </div>
        </section>
      </main>
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#0f1118',
  border: '1px solid #1f2937',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 20px 40px rgba(0,0,0,0.35)'
};

const sectionTitle: React.CSSProperties = { fontSize: 18, fontWeight: 800, marginBottom: 12 };
const label: React.CSSProperties = { color: '#9ca3af', marginTop: 12, marginBottom: 6, fontSize: 13 };
const input: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #1f2937',
  background: '#111827',
  color: '#f8fafc',
  outline: 'none',
};

const primaryButton: React.CSSProperties = {
  background: '#1ed760',
  color: '#05060d',
  border: 'none',
  padding: '12px 18px',
  borderRadius: 999,
  fontWeight: 800,
  cursor: 'pointer'
};

const listItem: React.CSSProperties = {
  border: '1px solid #1f2937',
  padding: 14,
  borderRadius: 12,
  background: '#0c0e16',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12
};
