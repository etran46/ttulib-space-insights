import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import ChartTooltip from '../components/ChartTooltip.jsx';
import './Dashboard.css';

const occupancyData = [
  { time: '1 PM', occupancy: 380 }, { time: '2 PM', occupancy: 370 },
  { time: '3 PM', occupancy: 340 }, { time: '4 PM', occupancy: 330 },
  { time: '5 PM', occupancy: 345 }, { time: '6 PM', occupancy: 360 },
  { time: '7 PM', occupancy: 355 }, { time: '8 PM', occupancy: 310 },
  { time: '9 PM', occupancy: 300 }, { time: '10 PM', occupancy: 330 },
  { time: '11 PM', occupancy: 335 },
];

const locations = [
  { name: 'Main Floor',       current: 142, capacity: 449, status: 'Available' },
  { name: '9th Floor Arch Lib', current: 63, capacity: 75,  status: 'Near Capacity' },
  { name: 'Stacks 5',         current: 233, capacity: 311, status: 'Moderate' },
  { name: 'Croslin',          current: 87,  capacity: 125, status: 'Moderate' },
  { name: 'Mezzanine',        current: 75,  capacity: 116, status: 'Moderate' },
  { name: 'Public Spaces',    current: 32,  capacity: 109, status: 'Available' },
];

function StatusBadge({ status }) {
  const { colors } = useTheme();
  const map = {
    Available:     { bg: colors.statusGreenBg,  color: colors.statusGreenText,  label: 'Available' },
    'Near Capacity': { bg: colors.statusRedBg,  color: colors.statusRedText,    label: 'Near Capacity' },
    Moderate:      { bg: colors.statusAmberBg,  color: colors.statusAmberText,  label: 'Moderate' },
  };
  const s = map[status] || map.Available;
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      fontSize: '11px',
      fontWeight: 700,
      padding: '2px 10px',
      borderRadius: '20px',
    }}>
      {s.label}
    </span>
  );
}

function OccBar({ pct, status }) {
  const { colors } = useTheme();
  const barColor =
    status === 'Available'      ? colors.statusGreen :
    status === 'Near Capacity'  ? colors.statusRed   :
                                  colors.statusAmber;
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${pct}% occupied`}
      style={{ background: colors.bgSubtle, borderRadius: '99px', height: '7px', overflow: 'hidden' }}
    >
      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '99px' }} />
    </div>
  );
}

const statDefs = [
  { label: 'Total Occupancy',   value: '632',  sub: 'of 1,185 capacity',   Icon: Users,          accentKey: 'accent' },
  { label: 'Capacity Used',     value: '53%',  sub: '↗ Within limits',     Icon: TrendingUp,     accentKey: 'statusGreen', subKey: 'positiveText' },
  { label: 'Available Spots',   value: '553',  sub: 'across all areas',    Icon: CheckCircle,    accentKey: 'statusAmber' },
  { label: 'High Capacity Areas', value: '1', sub: 'need attention',      Icon: AlertTriangle,  accentKey: 'statusRed',  subKey: 'negativeText' },
];

export default function Dashboard() {
  const { colors } = useTheme();
  const [animIn, setAnimIn] = useState(false);
  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  return (
    <div
      id="main-content"
      className="dashboard-page"
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
            Library Occupancy Dashboard
          </h1>
          <p style={{ color: colors.muted, fontSize: '13px', margin: '4px 0 0', fontWeight: 500 }}>
            Real-time occupancy monitoring across all locations
          </p>
        </div>

        {/* Stat Cards */}
        <div className="stat-grid" role="region" aria-label="Summary statistics">
          {statDefs.map(({ label, value, sub, Icon, accentKey, subKey }) => (
            <div key={label} className="card" style={{
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              background: colors.surface,
            }}>
              <div>
                <div style={{ fontSize: '12px', color: colors.muted, fontWeight: 500, marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: '30px', fontWeight: 800, color: colors.body, lineHeight: 1.1 }}>
                  {value}
                </div>
                <div style={{ fontSize: '12px', color: subKey ? colors[subKey] : colors.secondary, marginTop: 4, fontWeight: 500 }}>
                  {sub}
                </div>
              </div>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: colors[`${accentKey}Bg`] || colors.bgSubtle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={18} color={colors[accentKey] || colors.primary} aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{
          background: colors.surface,
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          marginBottom: 28,
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: colors.body, marginBottom: 20 }}>
            Live Occupancy Trend
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={occupancyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 530]} ticks={[0, 150, 300, 530]} tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="occupancy" name="Occupancy" stroke={colors.accent} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, gap: 6, alignItems: 'center' }}>
            <span style={{ width: 20, height: 2.5, background: colors.accent, borderRadius: 2, display: 'inline-block' }} aria-hidden="true" />
            <span style={{ fontSize: '12px', color: colors.accent, fontWeight: 600 }}>Total Occupancy</span>
          </div>
        </div>

        {/* Location Grid */}
        <div role="region" aria-label="Location status">
          <div style={{ fontSize: '15px', fontWeight: 800, color: colors.body, marginBottom: 16 }}>
            Location Status
          </div>
          <div className="location-grid">
            {locations.map(loc => {
              const pct = Math.round((loc.current / loc.capacity) * 100);
              return (
                <div
                  key={loc.name}
                  className="card"
                  style={{
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: colors.body, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={13} color={colors.muted} aria-hidden="true" />
                      {loc.name}
                    </span>
                    <StatusBadge status={loc.status} />
                  </div>
                  <div style={{ fontSize: '12px', color: colors.muted, marginBottom: 12 }}>
                    {loc.current} / {loc.capacity} people
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '12px', color: colors.secondary, fontWeight: 500 }}>Occupancy</span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: colors.body }}>{pct}%</span>
                  </div>
                  <OccBar pct={pct} status={loc.status} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
