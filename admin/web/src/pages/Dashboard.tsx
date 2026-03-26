import { defineComponent } from 'vue';
import DashboardCard from '../components/DashboardCard';
import DashboardLayout from '../components/DashboardLayout';
import ModernTable, { type ModernTableColumn, type TableRowData } from '../components/ModernTable';

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', joinDate: '2024-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Active', joinDate: '2024-02-20' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'Inactive', joinDate: '2024-03-10' },
] satisfies TableRowData[];

const columns: ModernTableColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  {
    id: 'status',
    label: 'Status',
    render: (row) => {
      const isActive = row.status === 'Active';
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: '999px',
            padding: '0.35rem 0.7rem',
            background: isActive ? 'rgba(21, 128, 61, 0.12)' : 'rgba(220, 38, 38, 0.12)',
            color: isActive ? '#166534' : '#b91c1c',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          {String(row.status ?? 'Unknown')}
        </span>
      );
    },
  },
  { id: 'joinDate', label: 'Join Date' },
];

const noop = (_row: TableRowData) => undefined;

const metricIconStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  fontSize: '1.05rem',
  fontWeight: 800,
} as const;

export const Dashboard = defineComponent({
  name: 'DashboardPage',
  setup() {
    return () => (
      <DashboardLayout
        title="Dashboard"
        description="Welcome back. Here is a compact snapshot of growth, content performance, and recent user activity."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <DashboardCard
            title="Total Users"
            value="12,543"
            icon={<span style={metricIconStyle}>U</span>}
            trend={{ direction: 'up', percentage: 12.5 }}
            gradient={['#0f766e', '#1d4ed8']}
            subtitle="Last 30 days"
          />
          <DashboardCard
            title="Total Tracks"
            value="8,291"
            icon={<span style={metricIconStyle}>T</span>}
            trend={{ direction: 'up', percentage: 8.2 }}
            gradient={['#db2777', '#f97316']}
            subtitle="Active content"
          />
          <DashboardCard
            title="Total Plays"
            value="524,890"
            icon={<span style={metricIconStyle}>P</span>}
            trend={{ direction: 'up', percentage: 23.8 }}
            gradient={['#2563eb', '#06b6d4']}
            subtitle="This month"
          />
          <DashboardCard
            title="Downloads"
            value="45,230"
            icon={<span style={metricIconStyle}>D</span>}
            trend={{ direction: 'down', percentage: 5.2 }}
            gradient={['#16a34a', '#14b8a6']}
            subtitle="Last 7 days"
          />
        </div>

        <section>
          <div style={{ marginBottom: '1rem' }}>
            <h2
              style={{
                margin: 0,
                color: '#0f172a',
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
              }}
            >
              Recent Users
            </h2>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>
              Latest user registrations and activity.
            </p>
          </div>

          <ModernTable columns={columns} rows={users} onEdit={noop} onDelete={noop} onMore={noop} />
        </section>
      </DashboardLayout>
    );
  },
});

export default Dashboard;
