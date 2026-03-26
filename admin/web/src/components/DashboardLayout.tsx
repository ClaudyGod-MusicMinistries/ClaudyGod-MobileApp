import { defineComponent } from 'vue';

const navItems = [
  { icon: '◫', label: 'Dashboard' },
  { icon: '⚙', label: 'Settings' },
  { icon: '⇢', label: 'Logout' },
];

export const DashboardLayout = defineComponent({
  name: 'DashboardLayout',
  props: {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  setup(props, { slots }) {
    return () => (
      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top left, rgba(15,118,110,0.14), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
          color: '#0f172a',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr)',
            minHeight: '100vh',
          }}
        >
          <aside
            style={{
              borderRight: '1px solid rgba(15, 23, 42, 0.08)',
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(18px)',
              padding: '1.5rem',
            }}
          >
            <div
              style={{
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #0f766e, #1d4ed8)',
                color: '#fff',
                padding: '1.4rem',
                boxShadow: '0 18px 44px rgba(15, 23, 42, 0.18)',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  width: '54px',
                  height: '54px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.14)',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                }}
              >
                C
              </div>
              <div style={{ marginTop: '1rem', fontSize: '1.15rem', fontWeight: 800 }}>
                Claudy Admin
              </div>
              <p style={{ margin: '0.35rem 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                Management dashboard
              </p>
            </div>

            <nav style={{ display: 'grid', gap: '0.75rem', marginTop: '1.4rem' }}>
              {navItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    borderRadius: '18px',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    background: 'rgba(255,255,255,0.82)',
                    padding: '0.9rem 1rem',
                    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: '1rem' }}>
                    {item.icon}
                  </span>
                  <span style={{ fontWeight: 700 }}>{item.label}</span>
                </div>
              ))}
            </nav>
          </aside>

          <main style={{ minWidth: 0, padding: '1.5rem' }}>
            <header
              style={{
                borderRadius: '30px',
                background:
                  'linear-gradient(135deg, rgba(15,118,110,0.98) 0%, rgba(29,78,216,0.94) 100%)',
                color: '#fff',
                padding: '1.6rem 1.75rem',
                boxShadow: '0 24px 60px rgba(29, 78, 216, 0.22)',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <span aria-hidden="true">◫</span>
                <span>Admin Workspace</span>
              </div>
              <h1
                style={{
                  margin: '1rem 0 0',
                  fontSize: 'clamp(1.85rem, 4vw, 2.6rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                }}
              >
                {props.title}
              </h1>
              {props.description ? (
                <p style={{ margin: '0.55rem 0 0', maxWidth: '42rem', opacity: 0.92 }}>
                  {props.description}
                </p>
              ) : null}
            </header>

            <section
              style={{
                marginTop: '1.5rem',
                borderRadius: '30px',
                background: 'rgba(255,255,255,0.76)',
                border: '1px solid rgba(15, 23, 42, 0.08)',
                boxShadow: '0 24px 50px rgba(15, 23, 42, 0.08)',
                padding: '1.5rem',
              }}
            >
              {slots.default?.()}
            </section>
          </main>
        </div>
      </div>
    );
  },
});

export default DashboardLayout;
