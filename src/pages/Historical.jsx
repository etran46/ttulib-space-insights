import { useState, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
} from 'recharts';
import { Calendar, TrendingUp, Award, Database } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import ChartTooltip from '../components/ChartTooltip.jsx';
import './Historical.css';

// ── Per-semester data ────────────────────────────────────────────────────────

const SEMESTERS = {
  spring2026: {
    value:       'spring2026',
    label:       'Spring 2026',
    dateRange:   'Jan 13 – May 3',
    yoyGrowth:   '+12.4%',
    yoyVs:       'vs. Spring 2025',
    finalsPeak:  '520',
    dataPoints:  '2,856',
    days: Array.from({ length: 30 }, (_, i) => ({
      date: `Jan ${i + 1}`,
      occ:  Math.round(80 + i * 14 + Math.sin(i * 0.4) * 30),
    })),
  },
  fall2025: {
    value:       'fall2025',
    label:       'Fall 2025',
    dateRange:   'Aug 25 – Dec 13',
    yoyGrowth:   '+8.1%',
    yoyVs:       'vs. Fall 2024',
    finalsPeak:  '485',
    dataPoints:  '2,640',
    days: Array.from({ length: 30 }, (_, i) => ({
      date: `Aug ${25 + i}`,
      // moderate start, builds mid-semester, spikes near finals
      occ:  Math.round(
        200 + i * 8 + Math.sin(i * 0.5) * 35 + (i > 24 ? (i - 24) * 18 : 0)
      ),
    })),
  },
  spring2025: {
    value:       'spring2025',
    label:       'Spring 2025',
    dateRange:   'Jan 13 – May 3',
    yoyGrowth:   '+6.7%',
    yoyVs:       'vs. Spring 2024',
    finalsPeak:  '468',
    dataPoints:  '2,544',
    days: Array.from({ length: 30 }, (_, i) => ({
      date: `Jan ${13 + i}`,
      // same pattern as 2026 but ~13% lower
      occ:  Math.round((80 + i * 14 + Math.sin(i * 0.4) * 30) * 0.87),
    })),
  },
};

const SEMESTER_OPTIONS = [
  { value: 'spring2026', label: 'Spring 2026: Jan 14, 2026 – May 5, 2026' },
  { value: 'fall2025',   label: 'Fall 2025: Aug 25, 2025 – Dec 13, 2025'  },
  { value: 'spring2025', label: 'Spring 2025: Jan 13, 2025 – May 3, 2025' },
];

// ── Static data (multi-year + seasonal table don't change with semester) ─────

const multiYear = [
  { m: 'Jan', y2024: 180, y2025: 200, y2026: 220 },
  { m: 'Feb', y2024: 240, y2025: 260, y2026: 285 },
  { m: 'Mar', y2024: 310, y2025: 335, y2026: 360 },
  { m: 'Apr', y2024: 370, y2025: 390, y2026: 415 },
  { m: 'May', y2024: 410, y2025: 435, y2026: 460 },
  { m: 'Jun', y2024: 350, y2025: 375, y2026: 395 },
  { m: 'Jul', y2024: 290, y2025: 315, y2026: null },
  { m: 'Aug', y2024: 330, y2025: 355, y2026: null },
  { m: 'Sep', y2024: 380, y2025: 400, y2026: null },
  { m: 'Oct', y2024: 420, y2025: 445, y2026: null },
  { m: 'Nov', y2024: 390, y2025: 410, y2026: null },
  { m: 'Dec', y2024: 270, y2025: 290, y2026: null },
];

const SEASONAL_BY_SEMESTER = {
  spring2026: [
    { period: 'Start of Semester', avg: 305, growth: '+15%', growthPos: true },
    { period: 'Mid-Semester',      avg: 425, growth: '+39%', growthPos: true },
    { period: 'Finals Period',     avg: 520, growth: '+22%', growthPos: true },
    { period: 'Break Periods',     avg: 195, growth: '-63%', growthPos: false },
  ],
  fall2025: [
    { period: 'Start of Semester', avg: 280, growth: '+12%', growthPos: true },
    { period: 'Mid-Semester',      avg: 390, growth: '+39%', growthPos: true },
    { period: 'Finals Period',     avg: 485, growth: '+24%', growthPos: true },
    { period: 'Break Periods',     avg: 180, growth: '-63%', growthPos: false },
  ],
  spring2025: [
    { period: 'Start of Semester', avg: 265, growth: '+10%', growthPos: true },
    { period: 'Mid-Semester',      avg: 370, growth: '+40%', growthPos: true },
    { period: 'Finals Period',     avg: 468, growth: '+26%', growthPos: true },
    { period: 'Break Periods',     avg: 172, growth: '-63%', growthPos: false },
  ],
};

// ── Component ────────────────────────────────────────────────────────────────

export default function Historical() {
  const { colors } = useTheme();
  const [animIn, setAnimIn] = useState(false);
  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  const [selectedKey, setSelectedKey] = useState('spring2026');
  const sem = SEMESTERS[selectedKey];
  const seasonal = SEASONAL_BY_SEMESTER[selectedKey];

  const statDefs = [
    { label: 'Selected Semester', value: sem.label,      sub: sem.dateRange,       Icon: Calendar,   accentKey: 'accent' },
    { label: 'YoY Growth',        value: sem.yoyGrowth,  sub: sem.yoyVs,           Icon: TrendingUp, accentKey: 'statusGreen', valueKey: 'positiveText' },
    { label: 'Finals Week Peak',  value: sem.finalsPeak, sub: 'avg daily occupancy', Icon: Award,    accentKey: 'statusAmber' },
    { label: 'Data Points',       value: sem.dataPoints, sub: 'hours analyzed',     Icon: Database,   accentKey: 'primary' },
  ];

  const yearColors = [
    colors.primary + '66',
    colors.primary + 'aa',
    colors.primary,
  ];

  const peakOcc = Math.max(...sem.days.map(d => d.occ));

  return (
    <div
      id="main-content"
      className="historical-page"
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
            Historical Usage Analytics
          </h1>
          <p style={{ color: colors.muted, fontSize: '13px', margin: '4px 0 0', fontWeight: 500 }}>
            Long-term trends aligned with Texas Tech academic calendar for strategic planning
          </p>
        </div>

        {/* Dynamic Stat Cards */}
        <div className="stat-grid" role="region" aria-label="Summary statistics">
          {statDefs.map(({ label, value, sub, Icon, accentKey, valueKey }) => (
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
                <div style={{ fontSize: '20px', fontWeight: 900, color: valueKey ? colors[valueKey] : colors.heading }}>{value}</div>
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

        {/* Semester Area Chart — controlled by dropdown */}
        <div className="card" style={{
          padding: '20px 22px', marginBottom: 24,
          background: colors.surface, border: `1px solid ${colors.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: colors.body }}>Semester Analysis</div>
            <select
              aria-label="Select semester"
              value={selectedKey}
              onChange={e => setSelectedKey(e.target.value)}
              style={{
                border: `1.5px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '12px',
                background: colors.surface,
                color: colors.secondary,
                cursor: 'pointer',
              }}
            >
              {SEMESTER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '11px', color: colors.muted, marginBottom: 14 }}>
            Grid includes regular mid-terms, break periods, and finals weeks aligned with the TTU academic calendar.
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={sem.days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={colors.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.muted }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} domain={[0, Math.ceil(peakOcc / 100) * 100 + 50]} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="occ"
                stroke={colors.primary}
                strokeWidth={2.5}
                fill="url(#primaryGrad)"
                dot={false}
                name="Avg Daily Occupancy"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ width: 16, height: 2.5, background: colors.primary, borderRadius: 2, display: 'inline-block' }} aria-hidden="true" />
              <span style={{ fontSize: '12px', color: colors.primary, fontWeight: 600 }}>Avg Daily Occupancy</span>
            </div>
            <div style={{ fontSize: '11px', color: colors.muted }}>
              Peak: <strong style={{ color: colors.body }}>{peakOcc}</strong> &nbsp;·&nbsp;
              Range: <strong style={{ color: colors.body }}>{sem.dateRange}</strong>
            </div>
          </div>
        </div>

        {/* Multi-Year Line (static) */}
        <div className="card" style={{
          padding: '20px 22px', marginBottom: 24,
          background: colors.surface, border: `1px solid ${colors.border}`,
        }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: colors.body, marginBottom: 16 }}>
            Multi-Year Monthly Comparison (2024–2026)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={multiYear} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="y2024" name="2024" stroke={yearColors[0]} strokeWidth={2}   dot={false} />
              <Line type="monotone" dataKey="y2025" name="2025" stroke={yearColors[1]} strokeWidth={2}   dot={false} />
              <Line type="monotone" dataKey="y2026" name="2026" stroke={yearColors[2]} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            {['2024', '2025', '2026'].map((l, i) => (
              <span key={l} style={{ fontSize: '12px', color: yearColors[i], fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 16, height: 2.5, background: yearColors[i], borderRadius: 2, display: 'inline-block' }} aria-hidden="true" />{l}
              </span>
            ))}
          </div>
        </div>

        {/* Seasonal Table — updates with semester */}
        <div className="card" style={{
          padding: '20px 22px',
          background: colors.surface, border: `1px solid ${colors.border}`,
        }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: colors.body, marginBottom: 4 }}>
            Seasonal Usage Patterns — {sem.label}
          </div>
          <div style={{ fontSize: '11px', color: colors.muted, marginBottom: 14 }}>
            Average occupancy by semester phase
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${colors.border}` }}>
                  {['Semester Period', 'Avg Occupancy', 'Growth vs Previous', 'Visualization'].map(h => (
                    <th key={h} style={{ fontSize: '11px', color: colors.muted, fontWeight: 700, padding: '6px 0', textAlign: 'left', letterSpacing: '0.04em' }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seasonal.map(r => (
                  <tr key={r.period} style={{ borderBottom: `1px solid ${colors.bgSubtle}` }}>
                    <td style={{ padding: '13px 0', fontSize: '13px', fontWeight: 600, color: colors.body }}>{r.period}</td>
                    <td style={{ padding: '13px 0', fontSize: '13px', color: colors.secondary }}>{r.avg}</td>
                    <td style={{ padding: '13px 0', fontSize: '13px', fontWeight: 700, color: r.growthPos ? colors.positiveText : colors.negativeText }}>
                      {r.growth}
                    </td>
                    <td style={{ padding: '13px 0' }}>
                      <div
                        role="progressbar"
                        aria-valuenow={r.avg}
                        aria-valuemin={0}
                        aria-valuemax={peakOcc}
                        aria-label={`${r.avg} average occupancy`}
                        style={{ background: colors.bgSubtle, borderRadius: '99px', height: '6px', width: 120, overflow: 'hidden' }}
                      >
                        <div style={{ width: `${(r.avg / peakOcc) * 100}%`, height: '100%', background: colors.primary, borderRadius: '99px' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
