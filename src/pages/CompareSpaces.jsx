import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { Download, Loader, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import ChartTooltip from '../components/ChartTooltip.jsx';
import { fetchLocations, fetchDailyOccupancy, fetchHourlyOccupancy, daysAgo, today } from '../api/occuspace.js';
import './CompareSpaces.css';

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

// Time frame ranges in days
const TIME_FRAMES = {
  'This Week':     7,
  'Last 2 Weeks':  14,
  'This Month':    30,
  'Last 3 Months': 90,
  'Semester':      150,
};

// ── Main component ──────────────────────────────────────────────────────────

export default function CompareSpaces() {
  const { colors } = useTheme();
  const [animIn, setAnimIn] = useState(false);
  const [allLocations, setAllLocations] = useState([]);
  const [locationData, setLocationData] = useState({}); // { locId: { daily: [], hourly: [] } }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    timeFrame: 'Semester',
    location:  'All Locations',
  });

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  // Load locations and their data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const locs = await fetchLocations();
        const root = locs.find(l => l.parentID == null) || locs[0];
        const children = locs.filter(l => l.parentID === root?.id);
        const spaces = children.length > 0 ? children : locs;

        // Fetch daily occupancy for semester range for each space
        const start = daysAgo(150);
        const end = today();

        const results = {};
        const promises = spaces.map(async (loc) => {
          try {
            const [daily, hourly] = await Promise.all([
              fetchDailyOccupancy(loc.id, start, end),
              fetchHourlyOccupancy(loc.id, start, end),
            ]);
            results[loc.id] = { daily: daily || [], hourly: hourly || [] };
          } catch {
            results[loc.id] = { daily: [], hourly: [] };
          }
        });

        await Promise.all(promises);

        if (!cancelled) {
          setAllLocations(spaces);
          setLocationData(results);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Location filter options
  const locationOptions = useMemo(() =>
    ['All Locations', ...allLocations.map(l => l.name)],
    [allLocations]
  );

  // Filter locations
  const visibleLocations = useMemo(() => {
    if (filters.location === 'All Locations') return allLocations;
    return allLocations.filter(l => l.name === filters.location);
  }, [allLocations, filters.location]);

  // Time range
  const daysBack = TIME_FRAMES[filters.timeFrame] || 150;
  const cutoffDate = daysAgo(daysBack);

  // Monthly chart data — aggregate daily data by month for visible locations
  const monthlyData = useMemo(() => {
    const months = {};
    visibleLocations.forEach(loc => {
      const data = locationData[loc.id]?.daily || [];
      data.forEach(d => {
        const date = d.normalizedDate || d.timestamp?.slice(0, 10);
        if (date < cutoffDate) return;
        const monthKey = new Date(date).toLocaleDateString('en-US', { month: 'short' });
        if (!months[monthKey]) months[monthKey] = {};
        if (!months[monthKey][loc.name]) months[monthKey][loc.name] = [];
        months[monthKey][loc.name].push(d.avgOccupancy);
      });
    });

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthOrder
      .filter(m => months[m])
      .map(m => {
        const row = { m };
        Object.entries(months[m]).forEach(([name, vals]) => {
          row[name] = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
        });
        return row;
      });
  }, [visibleLocations, locationData, cutoffDate]);

  // Weekly bar data — aggregate by day of week
  const weeklyBar = useMemo(() => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const byDow = dayNames.map(() => ({ total: 0, count: 0 }));

    visibleLocations.forEach(loc => {
      const data = locationData[loc.id]?.daily || [];
      data.forEach(d => {
        const date = d.normalizedDate || d.timestamp?.slice(0, 10);
        if (date < cutoffDate) return;
        const dow = (new Date(date).getDay() + 6) % 7; // Mon=0
        byDow[dow].total += d.avgOccupancy;
        byDow[dow].count++;
      });
    });

    return dayNames.map((day, i) => ({
      day,
      avg: byDow[i].count > 0 ? Math.round(byDow[i].total / byDow[i].count) : 0,
    }));
  }, [visibleLocations, locationData, cutoffDate]);

  // Performance table
  const spacePerf = useMemo(() => {
    return visibleLocations.map(loc => {
      const data = locationData[loc.id]?.daily || [];
      const filtered = data.filter(d => {
        const date = d.normalizedDate || d.timestamp?.slice(0, 10);
        return date >= cutoffDate;
      });
      if (filtered.length === 0) return null;

      const avgOcc = Math.round(filtered.reduce((s, d) => s + d.avgOccupancy, 0) / filtered.length);
      const peakOcc = Math.max(...filtered.map(d => d.peakOccupancy));
      const util = loc.capacity > 0 ? Math.round((avgOcc / loc.capacity) * 100) : 0;

      // Find peak hour from hourly data
      const hourly = locationData[loc.id]?.hourly || [];
      const hourAvgs = {};
      hourly.forEach(h => {
        const time = h.normalizedTime?.slice(0, 2) || '00';
        if (!hourAvgs[time]) hourAvgs[time] = { total: 0, count: 0 };
        hourAvgs[time].total += h.avgOccupancy;
        hourAvgs[time].count++;
      });
      let peakHour = '—';
      let maxHourAvg = 0;
      Object.entries(hourAvgs).forEach(([hour, { total, count }]) => {
        const avg = total / count;
        if (avg > maxHourAvg) {
          maxHourAvg = avg;
          const h = parseInt(hour);
          const nextH = h + 1;
          peakHour = `${h > 12 ? h - 12 : h || 12}${h >= 12 ? 'PM' : 'AM'}–${nextH > 12 ? nextH - 12 : nextH || 12}${nextH >= 12 ? 'PM' : 'AM'}`;
        }
      });

      return {
        name: loc.name,
        avgOcc,
        cap: loc.capacity,
        util,
        peak: peakHour,
        peakOcc,
      };
    }).filter(Boolean);
  }, [visibleLocations, locationData, cutoffDate]);

  // Chart colors
  const chartColors = colors.chartColors || ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
  const locNames = visibleLocations.map(l => l.name);

  // Bottom stats
  const topPerf = spacePerf.reduce((best, r) => r.util > (best?.util ?? 0) ? r : best, null);
  const bottomStats = [
    {
      label: 'Highest Utilization',
      value: topPerf?.name ?? '—',
      sub: topPerf ? `${topPerf.util}% average utilization` : 'No spaces selected',
      valueColor: topPerf ? colors.primary : colors.muted,
    },
    {
      label: 'Peak Usage Time',
      value: topPerf?.peak ?? '—',
      sub: topPerf ? `Busiest time for ${topPerf.name}` : 'Select a location',
      valueColor: colors.heading,
    },
    {
      label: 'Total Avg Occupancy',
      value: spacePerf.length > 0 ? String(spacePerf.reduce((s, r) => s + r.avgOcc, 0)) : '—',
      sub: 'across selected spaces',
      valueColor: colors.positiveText,
    },
  ];

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
              Compare spaces across location and time periods for data-driven decisions
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

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '80px 0', color: colors.muted }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Loading comparison data...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.statusRedText, background: colors.statusRedBg, borderRadius: '12px' }}>
            <AlertTriangle size={24} style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Failed to load data</div>
            <div style={{ fontSize: '13px', color: colors.muted }}>{error}</div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="card" style={{ padding: '20px 22px', marginBottom: 24, background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: colors.body, marginBottom: 12 }}>
                Comparison Filters
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <label htmlFor="filter-timeFrame" style={{ fontSize: '11px', color: colors.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    TIME FRAME
                  </label>
                  <select
                    id="filter-timeFrame"
                    value={filters.timeFrame}
                    onChange={e => setFilter('timeFrame', e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      border: `1.5px solid ${colors.border}`, fontSize: '13px',
                      color: colors.secondary, background: colors.surface, cursor: 'pointer',
                    }}
                  >
                    {Object.keys(TIME_FRAMES).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <label htmlFor="filter-location" style={{ fontSize: '11px', color: colors.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    LOCATION
                  </label>
                  <select
                    id="filter-location"
                    value={filters.location}
                    onChange={e => setFilter('location', e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      border: `1.5px solid ${colors.border}`, fontSize: '13px',
                      color: colors.secondary, background: colors.surface, cursor: 'pointer',
                    }}
                  >
                    {locationOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              {/* Active filter chips */}
              {(filters.timeFrame !== 'Semester' || filters.location !== 'All Locations') && (
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
                  <button
                    onClick={() => setFilters({ timeFrame: 'Semester', location: 'All Locations' })}
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
                Monthly Avg Occupancy by Location
              </div>
              {monthlyData.length === 0 || locNames.length === 0 ? (
                <EmptyChart height={220} message="No data available for the selected filters" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="m" tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    {locNames.map((name, i) => (
                      <Line key={name} type="monotone" dataKey={name} stroke={chartColors[i % chartColors.length]} strokeWidth={2} dot={monthlyData.length <= 2} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                {locNames.map((name, i) => (
                  <span key={name} style={{ fontSize: '12px', color: chartColors[i % chartColors.length], fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 16, height: 2.5, background: chartColors[i % chartColors.length], borderRadius: 2, display: 'inline-block' }} aria-hidden="true" />
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Performance Table */}
            <div className="card" style={{ padding: '20px 22px', marginBottom: 24, background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: colors.body, marginBottom: 14 }}>
                Space Performance
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1.5px solid ${colors.border}` }}>
                      {['Location', 'Avg Occupancy', 'Capacity', 'Utilization Rate', 'Peak Time'].map(h => (
                        <th key={h} style={{ fontSize: '11px', color: colors.muted, fontWeight: 700, padding: '8px 0', textAlign: 'left', letterSpacing: '0.05em' }}>
                          {h.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {spacePerf.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px 0', textAlign: 'center', color: colors.muted, fontSize: '13px' }}>
                          No data available for the selected filters
                        </td>
                      </tr>
                    ) : spacePerf.map(r => (
                      <tr key={r.name} style={{ borderBottom: `1px solid ${colors.bgSubtle}` }}>
                        <td style={{ padding: '12px 0', fontSize: '13px', fontWeight: 600, color: colors.body }}>{r.name}</td>
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
                Average Occupancy by Day of Week
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyBar} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="avg" name="Avg Occupancy" fill={colors.primary} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
          </>
        )}
      </div>
    </div>
  );
}
