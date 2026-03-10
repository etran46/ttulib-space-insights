import { useTheme } from '../context/ThemeContext.jsx';

export default function ChartTooltip({ active, payload, label }) {
  const { colors } = useTheme();
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: colors.tooltipBg,
      color: colors.tooltipText,
      padding: '8px 14px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 600,
      boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
      border: `1px solid ${colors.border}`,
    }}>
      <div style={{ color: colors.tooltipMuted, fontSize: '11px', marginBottom: 3 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}
