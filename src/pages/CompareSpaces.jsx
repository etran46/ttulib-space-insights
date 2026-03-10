import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import ChartTooltip from '../components/ChartTooltip.jsx';
import './CompareSpaces.css';

// ── Static data ─────────────────────────────────────────────────────────────

const monthlyData = [
  { m: 'Jan', Quiet: 40,  Collaborative: 25,  Lab: 15, Social: 20 },
  { m: 'Feb', Quiet: 60,  Collaborative: 35,  Lab: 20, Social: 28 },
  { m: 'Mar', Quiet: 90,  Collaborative: 55,  Lab: 30, Social: 40 },
  { m: 'Apr', Quiet: 130, Collaborative: 80,  Lab: 45, Social: 58 },
  { m: 'May', Quiet: 175, Collaborative: 105, Lab: 60, Social: 75 },
  { m: 'Jun', Quiet: 210, Collaborative: 130, Lab: 75, Social: 90 },
  { m: 'Jul', Quiet: 235, Collaborative: 145, Lab: 85, Social: 100 },
  { m: 'Aug', Quiet: 200, Collaborative: 120, Lab: 70, Social: 85 },
  { m: 'Sep', Quiet: 160, Collaborative: 95,  Lab: 55, Social: 68 },
  { m: 'Oct', Quiet: 110, Collaborative: 65,  Lab: 38, Social: 48 },
  { m: 'Nov', Quiet: 70,  Collaborative: 42,  Lab: 24, Social: 32 },
  { m: 'Dec', Quiet: 45,  Collaborative: 28,  Lab: 16, Social: 22 },
];

const weeklyBar = [
  { day: 'Mon', w1: 155, w2: 140, w3: 160, w4: 148 },
  { day: 'Tue', w1: 175, w2: 165, w3: 180, w4: 170 },
  { day: 'Wed', w1: 190, w2: 185, w3: 195, w4: 188 },
  { day: 'Thu', w1: 170, w2: 160, w3: 175, w4: 165 },
  { day: 'Fri', w1: 145, w2: 135, w3: 150, w4: 140 },
  { day: 'Sat', w1: 90,  w2: 85,  w3: 95,  w4: 88  },
];

const spacePerf = [
  { type: 'Social',               chartKey: 'Social',        avgOcc: 72,  cap: 110, util: 65, peak: '2–4 PM' },
  { type: 'Quiet Zones',          chartKey: 'Quiet',         avgOcc: 145, cap: 180, util: 81, peak: '12–2 PM' },
  { type: 'Computer Labs',        chartKey: 'Lab',           avgOcc: 59,  cap: 80,  util: 73, peak: '11 AM–1 PM' },
  { type: 'Collaborative Spaces', chartKey: 'Collaborative', avgOcc: 32,  cap: 40,  util: 80, peak: '3–5 PM' },
];

// ── Filter lookup tables ────────────────────────────────────────────────────

const ALL_LINE_KEYS = ['Quiet', 'Collaborative', 'Lab', 'Social'];

const SPACE_TYPE_KEYS = {
  'All Types':     ALL_LINE_KEYS,
  'Quiet Zones':   ['Quiet'],
  'Collaborative': ['Collaborative'],
  'Computer Labs': ['Lab'],
  'Social Spaces': ['Social'],
};

const LOCATION_KEYS = {
  'All Locations':      ALL_LINE_KEYS,
  'Main Floor':         ['Quiet', 'Social'],
  '9th Floor Arch Lib': ['Quiet'],
  'Stacks 5':           ['Quiet'],
  'Croslin':            ['Collaborative'],
  'Mezzanine':          ['Collaborative', 'Lab'],
  'Public Spaces':      ['Social'],
};

const TIME_FRAME_MONTHS = {
  'This Week':     { start: 11, end: 12 },
  'Last 2 Weeks':  { start: 10, end: 12 },
  'This Month':    { start: 11, end: 12 },
  'Last 3 Months': { start: 9,  end: 12 },
  'Semester':      { start: 0,  end: 12 },
};

const TIME_FRAME_WEEKS = {
  'This Week':     1,
  'Last 2 Weeks':  2,
  'This Month':    4,
  'Last 3 Months': 4,
  'Semester':      4,
};

const TREND_BY_TIME = {
  'This Week':     '↑ 3.2%',
  'Last 2 Weeks':  '↑ 5.1%',
  'This Month':    '↑ 6.8%',
  'Last 3 Months': '↑ 8.2%',
  'Semester':      '↑ 8.2%',
};

const ALL_WEEK_KEYS   = ['w1', 'w2', 'w3', 'w4'];
const ALL_WEEK_LABELS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

const FILTER_OPTIONS = {
  'Time Frame': ['Semester', 'Last 3 Months', 'This Month', 'Last 2 Weeks', 'This Week'],
  'Location':   ['All Locations', 'Main Floor', '9th Floor Arch Lib', 'Stacks 5', 'Croslin', 'Mezzanine', 'Public Spaces'],
  'Space Type': ['All Types', 'Quiet Zones', 'Collaborative', 'Computer Labs', 'Social Spaces'],
};

const FILTER_KEYS = ['timeFrame', 'location', 'spaceType'];

// ── Sub-components ──────────────────────────────────────────────────────────

function UtilBar({ val }) {
  const { colors } = useTheme();
  const barColor   = val >= 80 ? colors.statusRed   : val >= 60 ? colors.statusAmber   : colors.statusGreen;
  const trackColor = val >= 80 ? colors.statusRedBg : val >= 60 ? colors.statusAmberBg : colors.statusGreenBg;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        role="progressbar"
        aria-valuenow={val} aria-valuemin={0} aria-valuemax={100}
        aria-label={`${val}% utilization`}
        style={{ background: trackColor, borderRadius: '99px', height: '6px', width: 80, overflow: 'hidden' }}
      >
        <div style={{ width: `${val}%`, height: '100%', background: barColor, borderRadius: '99px' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color: barColor }}>{val}%</span>
    </div>
  );
}

function EmptyChart({ height, message }) {
  const { colors } = useTheme();
  return (
    <div style={{
      height,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      color: colors.muted,
      fontSize: '13px',
      background: colors.bgSubtle,
      borderRadius: '10px',
    }}>
      <span style={{ fontSize: '22px' }}>—</span>
      {message}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function CompareSpaces() {
  const { colors } = useTheme();
  const [animIn, setAnimIn] = useState(false);
  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  const [filters, setFilters] = useState({
    timeFrame: 'Semester',
    location:  'All Locations',
    spaceType: 'All Types',
  });

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  // Derive which line keys are visible based on the two space-axis filters
  const byType = SPACE_TYPE_KEYS[filters.spaceType] || ALL_LINE_KEYS;
  const byLoc  = LOCATION_KEYS[filters.location]   || ALL_LINE_KEYS;
  const visibleKeys = ALL_LINE_KEYS.filter(k => byType.includes(k) && byLoc.includes(k));

  // Monthly chart data slice based on time frame
  const { start, end } = TIME_FRAME_MONTHS[filters.timeFrame] || { start: 0, end: 12 };
  const visibleMonthly = monthlyData.slice(start, end);

  // Weekly bar: show only the last N weeks
  const weekCount       = TIME_FRAME_WEEKS[filters.timeFrame] || 4;
  const visibleBarKeys  = ALL_WEEK_KEYS.slice(4 - weekCount);
  const visibleBarLabels= ALL_WEEK_LABELS.slice(4 - weekCount);

  // Performance table rows
  const visiblePerf = spacePerf.filter(r => visibleKeys.includes(r.chartKey));

  // Chart colors aligned to ALL_LINE_KEYS order
  const chartColors = colors.chartColors;
  const barColors   = colors.barColors;

  // Bottom stats derived from visible data
  const topPerf = visiblePerf.reduce((best, r) => r.util > (best?.util ?? 0) ? r : best, null);
  const bottomStats = [
    {
      label: 'Highest Utilization',
      value: topPerf?.type ?? '—',
      sub:   topPerf ? `${topPerf.util}% average utilization` : 'No spaces selected',
      valueColor: topPerf ? colors.primary : colors.muted,
    },
    {
      label: 'Peak Usage Time',
      value: topPerf?.peak ?? '—',
      sub:   topPerf ? `Busiest time for ${topPerf.type}` : 'Select a space type',
      valueColor: colors.heading,
    },
    {
      label: 'Trend Direction',
      value: TREND_BY_TIME[filters.timeFrame] ?? '↑ 8.2%',
      sub:   `vs. previous ${filters.timeFrame.toLowerCase()}`,
      valueColor: colors.positiveText,
    },
  ];

  const monthChartTitle =
    end - start <= 1 ? 'Occupancy by Space Type – This Month' :
    end - start <= 3 ? 'Occupancy by Space Type – Last 3 Months' :
                       'Occupancy by Space Type – Monthly Breakdown';

  const barChartTitle =
    weekCount === 1 ? 'Weekly Trend (This Week)' :
    weekCount === 2 ? 'Weekly Trend (Last 2 Weeks)' :
                     `Weekly Trend Comparison (Last ${weekCount} Weeks)`;

  return (
    <div
      id="main-content"
      className="compare-spaces-page"
      style={{
        background: colors.bg,
        opacity: animIn ? 1 : 0,
        transform: animIn ? 'none' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: colors.heading, margin: 0 }}>
              Comparative Space Explorer
            </h1>
            <p style={{ color: colors.muted, fontSize: '13px', margin: '4px 0 0', fontWeight: 500 }}>
              Compare spaces across location, space type, and time periods for data-driven decisions
            </p>
          </div>
          <button style={{
            background: colors.primary, color: '#fff', border: 'none', borderRadius: '8px',
            padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Download size={14} aria-hidden="true" /> Export Report
          </button>
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: '20px 22px', marginBottom: 24, background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.body, marginBottom: 12 }}>
            Comparison Filters
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Object.entries(FILTER_OPTIONS).map(([label, options], idx) => {
              const key = FILTER_KEYS[idx];
              return (
                <div key={label} style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <label
                    htmlFor={`filter-${key}`}
                    style={{ fontSize: '11px', color: colors.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}
                  >
                    {label.toUpperCase()}
                  </label>
                  <select
                    id={`filter-${key}`}
                    value={filters[key]}
                    onChange={e => setFilter(key, e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      border: `1.5px solid ${colors.border}`, fontSize: '13px',
                      color: colors.secondary, background: colors.surface, cursor: 'pointer',
                    }}
                  >
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
          {/* Active filter chips */}
          {(filters.timeFrame !== 'Semester' || filters.location !== 'All Locations' || filters.spaceType !== 'All Types') && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {filters.timeFrame !== 'Semester' && (
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px', background: colors.accentBg, color: colors.accent }}>
                  {filters.timeFrame}
                </span>
              )}
              {filters.location !== 'All Locations' && (
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px', background: colors.accentBg, color: colors.accent }}>
                  {filters.location}
                </span>
              )}
              {filters.spaceType !== 'All Types' && (
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px', background: colors.accentBg, color: colors.accent }}>
                  {filters.spaceType}
                </span>
              )}
              <button
                onClick={() => setFilters({ timeFrame: 'Semester', location: 'All Locations', spaceType: 'All Types' })}
                style={{
                  fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px',
                  background: 'transparent', border: `1px solid ${colors.border}`,
                  color: colors.muted, cursor: 'pointer',
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Monthly Line Chart */}
        <div className="card" style={{ padding: '20px 22px', marginBottom: 24, background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: colors.body, marginBottom: 16 }}>
            {monthChartTitle}
          </div>
          {visibleKeys.length === 0 ? (
            <EmptyChart height={220} message="No space types match the selected location + type filters" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={visibleMonthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                {visibleKeys.map(k => {
                  const idx = ALL_LINE_KEYS.indexOf(k);
                  return <Line key={k} type="monotone" dataKey={k} stroke={chartColors[idx]} strokeWidth={2} dot={visibleMonthly.length <= 2} />;
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            {visibleKeys.map(k => {
              const idx = ALL_LINE_KEYS.indexOf(k);
              return (
                <span key={k} style={{ fontSize: '12px', color: chartColors[idx], fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 16, height: 2.5, background: chartColors[idx], borderRadius: 2, display: 'inline-block' }} aria-hidden="true" />
                  {k}
                </span>
              );
            })}
          </div>
        </div>

        {/* Performance Table */}
        <div className="card" style={{ padding: '20px 22px', marginBottom: 24, background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: colors.body, marginBottom: 14 }}>
            Space Type Performance
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${colors.border}` }}>
                  {['Space Type', 'Avg Occupancy', 'Capacity', 'Utilization Rate', 'Peak Time'].map(h => (
                    <th key={h} style={{ fontSize: '11px', color: colors.muted, fontWeight: 700, padding: '8px 0', textAlign: 'left', letterSpacing: '0.05em' }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiblePerf.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px 0', textAlign: 'center', color: colors.muted, fontSize: '13px' }}>
                      No spaces match the selected filters
                    </td>
                  </tr>
                ) : visiblePerf.map(r => (
                  <tr key={r.type} style={{ borderBottom: `1px solid ${colors.bgSubtle}` }}>
                    <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 600, color: colors.body }}>{r.type}</td>
                    <td style={{ padding: '12px 0', fontSize: '13px', color: colors.secondary }}>{r.avgOcc}</td>
                    <td style={{ padding: '12px 0', fontSize: '13px', color: colors.secondary }}>{r.cap}</td>
                    <td style={{ padding: '12px 0' }}><UtilBar val={r.util} /></td>
                    <td style={{ padding: '12px 0', fontSize: '12px', color: colors.muted, fontWeight: 500 }}>{r.peak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="card" style={{ padding: '20px 22px', marginBottom: 24, background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: colors.body, marginBottom: 16 }}>
            {barChartTitle}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyBar} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              {visibleBarKeys.map((k, i) => (
                <Bar key={k} dataKey={k} name={visibleBarLabels[i]} fill={barColors[4 - weekCount + i]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            {visibleBarLabels.map((l, i) => (
              <span key={l} style={{ fontSize: '12px', color: barColors[4 - weekCount + i], fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, background: barColors[4 - weekCount + i], borderRadius: 3, display: 'inline-block' }} aria-hidden="true" />
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="stat-grid">
          {bottomStats.map(s => (
            <div key={s.label} className="card" style={{ padding: '18px 20px', background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '11px', color: colors.muted, fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: s.valueColor, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: colors.muted }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
