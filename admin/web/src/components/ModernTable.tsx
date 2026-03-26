import { defineComponent, type PropType, type VNodeChild } from 'vue';

export type TableRowData = Record<string, unknown>;

export interface ModernTableColumn {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: TableRowData) => VNodeChild;
}

export const ModernTable = defineComponent({
  name: 'ModernTable',
  props: {
    columns: {
      type: Array as PropType<ModernTableColumn[]>,
      required: true,
    },
    rows: {
      type: Array as PropType<TableRowData[]>,
      required: true,
    },
    onEdit: {
      type: Function as PropType<((row: TableRowData) => void) | undefined>,
      default: undefined,
    },
    onDelete: {
      type: Function as PropType<((row: TableRowData) => void) | undefined>,
      default: undefined,
    },
    onMore: {
      type: Function as PropType<((row: TableRowData) => void) | undefined>,
      default: undefined,
    },
  },
  setup(props) {
    const hasActions = () => Boolean(props.onEdit || props.onDelete || props.onMore);

    return () => (
      <div
        style={{
          overflowX: 'auto',
          borderRadius: '24px',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))',
          boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
          <thead>
            <tr
              style={{
                background: 'linear-gradient(90deg, rgba(15,118,110,0.10), rgba(29,78,216,0.10))',
              }}
            >
              {props.columns.map((column) => (
                <th
                  key={column.id}
                  style={{
                    padding: '1rem',
                    textAlign: column.align ?? 'left',
                    color: '#334155',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
                  }}
                >
                  {column.label}
                </th>
              ))}
              {hasActions() ? (
                <th
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#334155',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
                  }}
                >
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {props.rows.length ? (
              props.rows.map((row, rowIndex) => (
                <tr key={rowIndex} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                  {props.columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column.id}`}
                      style={{
                        padding: '1rem',
                        textAlign: column.align ?? 'left',
                        color: '#0f172a',
                        verticalAlign: 'middle',
                      }}
                    >
                      {column.render ? column.render(row) : String(row[column.id] ?? '—')}
                    </td>
                  ))}
                  {hasActions() ? (
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        {props.onEdit ? (
                          <ActionButton label="Edit" onClick={() => props.onEdit?.(row)} />
                        ) : null}
                        {props.onDelete ? (
                          <ActionButton label="Delete" tone="danger" onClick={() => props.onDelete?.(row)} />
                        ) : null}
                        {props.onMore ? (
                          <ActionButton label="More" tone="neutral" onClick={() => props.onMore?.(row)} />
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colspan={props.columns.length + (hasActions() ? 1 : 0)}
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: '#64748b',
                  }}
                >
                  No rows available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  },
});

const ActionButton = defineComponent({
  name: 'ModernTableActionButton',
  props: {
    label: {
      type: String,
      required: true,
    },
    tone: {
      type: String as PropType<'primary' | 'danger' | 'neutral'>,
      default: 'primary',
    },
    onClick: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    return () => (
      <button
        type="button"
        onClick={props.onClick}
        style={{
          border: 'none',
          borderRadius: '999px',
          padding: '0.45rem 0.8rem',
          fontWeight: 700,
          cursor: 'pointer',
          color:
            props.tone === 'danger'
              ? '#b91c1c'
              : props.tone === 'neutral'
                ? '#334155'
                : '#0f766e',
          background:
            props.tone === 'danger'
              ? 'rgba(220, 38, 38, 0.1)'
              : props.tone === 'neutral'
                ? 'rgba(148, 163, 184, 0.18)'
                : 'rgba(15, 118, 110, 0.12)',
        }}
      >
        {props.label}
      </button>
    );
  },
});

export default ModernTable;
