import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { Download, Loader, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import ChartTooltip from '../components/ChartTooltip.jsx';
import { fetchLocations, fetchDailyOccupancy, daysAgo, today, cleanName } from '../api/occuspace.js';
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

const DEFAULT_CHART_COLORS = ['#CC0000', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

// ── Main component ──────────────────────────────────────────────────────────

export default function CompareSpaces() {
  const { colors } = useTheme();
  const [animIn, setAnimIn] = useState(false);
  const [allLocations, setAllLocations] = useState([]);
  const [locationData, setLocationData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    timeFrame: 'Semester',
    location:  'All Locations',
  });

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  // Load locations and their daily occupancy data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const locs = await fetchLocations();
        const root = locs.find(l => l.parentId == null) || locs[0];
        const children = locs.filter(l => l.parentId === root?.id);
        const spaces = children.length > 0 ? children : locs;

        const start = daysAgo(150);
        const end = today();

        const results = {};
        const promises = spaces.map(async (loc) => {
          try {
            const daily = await fetchDailyOccupancy(loc.id, start, end);
            results[loc.id] = { daily: daily || [] };
          } catch {
            results[loc.id] = { daily: [] };
          }
        });

        await Promise.all(promises);

        if (!cancelled) {
          setAllLocations(spaces.map(l => ({ ...l, displayName: cleanName(l.name) })));
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
    ['All Locations', ...allLocations.map(l => l.displayName)],
    [allLocations]
  );

  // Filter locations
  const visibleLocations = useMemo(() => {
    if (filters.location === 'All Locations') return allLocations;
    return allLocations.filter(l => l.displayName === filters.location);
  }, [allLocations, filters.location]);

  // Time range
  const daysBack = TIME_FRAMES[filters.timeFrame] || 150;
  const cutoffDate = useMemo(() => daysAgo(daysBack), [daysBack]);

  // Monthly chart data
  const monthlyData = useMemo(() => {
    if (visibleLocations.length === 0) return [];
    const months = {};
    visibleLocations.forEach(loc => {
      const data = locationData[loc.id]?.daily || [];
      data.forEach(d => {
        const date = d.normalizedDate || d.timestamp?.slice(0, 10);
        if (!date || date < cutoffDate) return;
        const monthKey = new Date(date).toLocaleDateString('en-US', { month: 'short' });
        if (!months[monthKey]) months[monthKey] = {};
        if (!months[monthKey][loc.displayName]) months[monthKey][loc.displayName] = [];
        months[monthKey][loc.displayName].push(d.avgOccupancy || 0);
      });
    });

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthOrder
      .filter(m => months[m])
      .map(m => {
        const row = { m };
        Object.entries(months[m]).forEach(([name, vals]) => {
          row[name] = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
        });
        return row;
      });
  }, [visibleLocations, locationData, cutoffDate]);

  // Weekly bar data
  const weeklyBar = useMemo(() => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const byDow = dayNames.map(() => ({ total: 0, count: 0 }));

    visibleLocations.forEach(loc => {
      const data = locationData[loc.id]?.daily || [];
      data.forEach(d => {
        const date = d.normalizedDate || d.timestamp?.slice(0, 10);
        if (!date || date < cutoffDate) return;
        const dow = (new Date(date).getDay() + 6) % 7;
        byDow[dow].total += d.avgOccupancy || 0;
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
        return date && date >= cutoffDate;
      });
      if (filtered.length === 0) return null;

      const avgOcc = Math.round(filtered.reduce((s, d) => s + (d.avgOccupancy || 0), 0) / filtered.length);
      const peakVals = filtered.map(d => d.peakOccupancy || 0);
      const peakOcc = peakVals.length > 0 ? Math.max(...peakVals) : 0;
      const util = loc.capacity > 0 ? Math.round((avgOcc / loc.capacity) * 100) : 0;

      return {
        name: loc.displayName,
        avgOcc,
        cap: loc.capacity,
        util: Math.min(util, 100),
        peakOcc,
      };
    }).filter(Boolean);
  }, [visibleLocations, locationData, cutoffDate]);

  // Chart colors
  const chartColors = colors.chartColors || DEFAULT_CHART_COLORS;
  const locNames = visibleLocations.map(l => l.displayName);

  // Bottom stats
  const topPerf = spacePerf.length > 0
    ? spacePerf.reduce((best, r) => r.util > best.util ? r : best, spacePerf[0])
    : null;

  const bottomStats = [
    {
      label: 'Highest Utilization',
      value: topPerf?.name ?? '—',
      sub: topPerf ? `${topPerf.util}% average utilization` : 'No spaces selected',
      valueColor: topPerf ? colors.primary : colors.muted,
    },
    {
      label: 'Peak Occupancy',
      value: topPerf ? String(topPerf.peakOcc) : '—',
      sub: topPerf ? `Highest count for ${topPerf.name}` : 'Select a location',
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
                      {['Location', 'Avg Occupancy', 'Capacity', 'Utilization Rate', 'Peak Occupancy'].map(h => (
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
                        <td style={{ padding: '12px 0', fontSize: '13px', color: colors.secondary, fontWeight: 500 }}>{r.peakOcc}</td>
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
              {weeklyBar.every(d => d.avg === 0) ? (
                <EmptyChart height={200} message="No weekly data available for the selected filters" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyBar} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="avg" name="Avg Occupancy" fill={colors.primary} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
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
