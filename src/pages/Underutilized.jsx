import { useState, useEffect } from 'react';
import { Flag, BarChart2, Search, DollarSign, MapPin } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import './Underutilized.css';

const underutilized = [
  {
    name: 'Basement Southside', location: 'Main University Library', pct: 5,
    capacity: 395, avgOcc: 5, wasted: 95, trend: 'declining',
    savings: '$12,000/year in operational cost', weekly: [4, 3, 5, 4, 2, 3, 4],
  },
  {
    name: 'Stacks 5', location: 'Main University Library West Wing', pct: 7,
    capacity: 311, avgOcc: 7, wasted: 93, trend: 'stable',
    savings: '$18,500/year in operational costs', weekly: [10, 8, 11, 9, 7, 8, 9],
  },
  {
    name: 'Room 132', location: 'Main University – Library First Floor', pct: 12,
    capacity: 40, avgOcc: 12, wasted: 88, trend: 'declining',
    savings: '$8,000/year in operational costs', weekly: [7, 5, 6, 5, 4, 5, 4],
  },
  {
    name: 'Public Spaces', location: '4th Floor', pct: 12,
    capacity: 109, avgOcc: 12, wasted: 88, trend: 'stable',
    savings: '$15,000/year in operational cost', weekly: [13, 10, 14, 12, 11, 12, 10],
  },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function MiniBar({ vals, spaceLabel }) {
  const { colors } = useTheme();
  const max = Math.max(...vals);
  return (
    <div role="img" aria-label={`Weekly usage pattern for ${spaceLabel}`}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 36 }}>
        {vals.map((v, i) => (
          <div key={i} title={`${DAYS[i]}: ${v}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '100%',
              height: `${(v / max) * 28}px`,
              background: colors.statusRed,
              borderRadius: '3px 3px 0 0',
              opacity: 0.7,
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: colors.muted }}>{d.slice(0, 3)}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {vals.map((v, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: colors.muted }}>{v}</div>
        ))}
      </div>
    </div>
  );
}

const statDefs = [
  { label: 'Flagged Spaces',         value: '4',   sub: 'Below threshold',           Icon: Flag,      accentKey: 'statusAmber' },
  { label: 'Total Wasted Capacity',  value: '795', sub: 'seats/spots available',      Icon: BarChart2, accentKey: 'accent' },
  { label: 'Analysis Period',        value: '8',   sub: 'weeks analyzed',             Icon: Search,    accentKey: 'statusGreen' },
  { label: 'Potential Savings',      value: '$54K',sub: 'per year',                   Icon: DollarSign,accentKey: 'statusGreen', subKey: 'positiveText' },
];

export default function Underutilized() {
  const { colors } = useTheme();
  const [animIn, setAnimIn] = useState(false);
  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  return (
    <div
      id="main-content"
      className="underutilized-page"
      style={{
        background: colors.bg,
        opacity: animIn ? 1 : 0,
        transform: animIn ? 'none' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: colors.heading, margin: 0 }}>
            Underutilized Space Identifier
          </h1>
          <p style={{ color: colors.muted, fontSize: '13px', margin: '4px 0 0', fontWeight: 500 }}>
            Spaces below 20% utilization threshold – opportunities for optimization
          </p>
        </div>

        {/* Top Stats */}
        <div className="stat-grid" role="region" aria-label="Summary statistics">
          {statDefs.map(({ label, value, sub, Icon, accentKey, subKey }) => (
            <div key={label} className="card" style={{
              padding: '18px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
            }}>
              <div>
                <div style={{ fontSize: '11px', color: colors.muted, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: subKey ? colors[subKey] : colors.heading }}>{value}</div>
                <div style={{ fontSize: '11px', color: colors.muted, marginTop: 2 }}>{sub}</div>
              </div>
              <div style={{
                width: 36, height: 36,
                background: colors[`${accentKey}Bg`] || colors.bgSubtle,
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color={colors[accentKey] || colors.primary} aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>

        {/* Space Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} role="region" aria-label="Underutilized spaces">
          {underutilized.map(sp => (
            <div key={sp.name} className="card" style={{
              padding: '20px 22px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={15} color={colors.muted} aria-hidden="true" />
                    <span style={{ fontWeight: 800, fontSize: '16px', color: colors.heading }}>{sp.name}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: colors.muted, marginLeft: 23, marginTop: 2 }}>{sp.location}</div>
                </div>
                <span style={{
                  background: colors.statusAmberBg,
                  color: colors.statusAmberText,
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Flag size={11} aria-hidden="true" /> {sp.pct}% Utilized
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Capacity',         value: sp.capacity,                                  color: null },
                  { label: 'Avg Occupancy',    value: `${sp.avgOcc}%`,                              color: colors.statusRed },
                  { label: 'Wasted Capacity',  value: `${sp.wasted}%`,                              color: colors.statusRed },
                  { label: 'Trend',            value: sp.trend === 'declining' ? '↓ Declining' : '→ Stable', color: sp.trend === 'declining' ? colors.statusRed : colors.statusAmber },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontSize: '11px', color: colors.muted, fontWeight: 600, marginBottom: 3 }}>{m.label}</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: m.color || colors.heading }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '12px', color: colors.secondary, fontWeight: 600, marginBottom: 8 }}>
                  Weekly Usage Pattern
                </div>
                <MiniBar vals={sp.weekly} spaceLabel={sp.name} />
              </div>

              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: colors.positiveText,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}>
                <DollarSign size={14} aria-hidden="true" />
                Potential Savings: {sp.savings}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
