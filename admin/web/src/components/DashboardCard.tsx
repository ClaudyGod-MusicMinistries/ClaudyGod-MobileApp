import { computed, defineComponent, type CSSProperties, type PropType, type VNodeChild } from 'vue';

export interface DashboardCardTrend {
  direction: 'up' | 'down';
  percentage: number;
}

export const DashboardCard = defineComponent({
  name: 'DashboardCard',
  props: {
    title: {
      type: String,
      required: true,
    },
    value: {
      type: [String, Number] as PropType<string | number>,
      required: true,
    },
    icon: {
      type: null as unknown as PropType<VNodeChild>,
      default: null,
    },
    trend: {
      type: Object as PropType<DashboardCardTrend | undefined>,
      default: undefined,
    },
    gradient: {
      type: Array as unknown as PropType<readonly [string, string] | undefined>,
      default: undefined,
    },
    subtitle: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const colors = computed(() => props.gradient ?? ['#0f766e', '#1d4ed8'] as const);
    const trendTone = computed(() =>
      props.trend?.direction === 'down'
        ? { fg: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', icon: '↓' }
        : { fg: '#15803d', bg: 'rgba(21, 128, 61, 0.12)', icon: '↑' },
    );

    return () => (
      <article
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '22px',
          border: '1px solid rgba(15, 23, 42, 0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))',
          boxShadow: '0 22px 50px rgba(15, 23, 42, 0.12)',
          padding: '1.4rem',
          minHeight: '220px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '0 auto auto 0',
            width: '100%',
            height: '5px',
            background: `linear-gradient(90deg, ${colors.value[0]}, ${colors.value[1]})`,
          }}
        />
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            background: `linear-gradient(135deg, ${colors.value[0]}, ${colors.value[1]})`,
            color: '#fff',
            boxShadow: `0 14px 30px ${hexToRgba(colors.value[1], 0.28)}`,
            fontSize: '1.2rem',
            fontWeight: 700,
          }}
        >
          {props.icon}
        </div>

        <p
          style={{
            margin: '1rem 0 0.45rem',
            color: '#475569',
            fontSize: '0.73rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {props.title}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: '#0f172a',
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
              }}
            >
              {props.value}
            </div>
            {props.subtitle ? (
              <p
                style={{
                  margin: '0.45rem 0 0',
                  color: '#64748b',
                  fontSize: '0.86rem',
                }}
              >
                {props.subtitle}
              </p>
            ) : null}
          </div>

          {props.trend ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '999px',
                padding: '0.5rem 0.75rem',
                background: trendTone.value.bg,
                color: trendTone.value.fg,
                fontSize: '0.82rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <span aria-hidden="true">{trendTone.value.icon}</span>
              <span>{Math.abs(props.trend.percentage)}%</span>
            </div>
          ) : null}
        </div>
      </article>
    );
  },
});

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized
        .split('')
        .map((part) => `${part}${part}`)
        .join('')
    : normalized;

  const bigint = Number.parseInt(expanded, 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export default DashboardCard;
