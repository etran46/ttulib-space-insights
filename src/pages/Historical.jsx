import { useState, useEffect, useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
} from 'recharts';
import { Calendar, TrendingUp, Award, Database, Loader, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import ChartTooltip from '../components/ChartTooltip.jsx';
import { fetchLocations, fetchDailyOccupancy, parseLocalDate } from '../api/occuspace.js';
import './Historical.css';

// Semester definitions — update these each academic year
const SEMESTER_DEFS = {
  spring2026: { label: 'Spring 2026', start: '2026-01-13', end: '2026-05-03' },
  fall2025:   { label: 'Fall 2025',   start: '2025-08-25', end: '2025-12-13' },
  spring2025: { label: 'Spring 2025', start: '2025-01-13', end: '2025-05-03' },
};

const SEMESTER_OPTIONS = Object.entries(SEMESTER_DEFS).map(([key, s]) => ({
  value: key,
  label: `${s.label}: ${s.start} – ${s.end}`,
}));

function classifySemesterPhase(dateStr, semStart, semEnd) {
  const d = new Date(dateStr);
  const start = new Date(semStart);
  const end = new Date(semEnd);
  const totalDays = (end - start) / (1000 * 60 * 60 * 24);
  const dayIn = (d - start) / (1000 * 60 * 60 * 24);
  const pct = dayIn / totalDays;

  if (pct < 0.15) return 'Start of Semester';
  if (pct < 0.75) return 'Mid-Semester';
  if (pct < 0.92) return 'Finals Period';
  return 'Break Periods';
}

export default function Historical() {
  const { colors } = useTheme();
  const [animIn, setAnimIn] = useState(false);
  const [selectedKey, setSelectedKey] = useState('spring2026');
  const [semesterData, setSemesterData] = useState({});
  const [rootId, setRootId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  // Load the root location once
  useEffect(() => {
    async function init() {
      try {
        const allLocations = await fetchLocations();
        const root = allLocations.find(l => l.parentId == null) || allLocations[0];
        setRootId(root?.id);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch semester data when rootId or selectedKey changes
  useEffect(() => {
    if (!rootId) return;
    let cancelled = false;

    async function loadSemester() {
      // If we already have data for this semester, skip
      if (semesterData[selectedKey]) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const semDef = SEMESTER_DEFS[selectedKey];
        const days = await fetchDailyOccupancy(rootId, semDef.start, semDef.end);

        const chartDays = (days || []).map(d => {
          const date = d.normalizedDate || d.timestamp?.slice(0, 10);
          const localDate = parseLocalDate(date);
          return {
            date: localDate
              ? localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : date,
            occ: d.avgOccupancy,
            peak: d.peakOccupancy,
            rawDate: date,
          };
        });

        // Seasonal breakdown
        const phases = {};
        chartDays.forEach(d => {
          const phase = classifySemesterPhase(d.rawDate, semDef.start, semDef.end);
          if (!phases[phase]) phases[phase] = [];
          phases[phase].push(d.occ);
        });

        const seasonal = ['Start of Semester', 'Mid-Semester', 'Finals Period', 'Break Periods'].map((period, i, arr) => {
          const vals = phases[period] || [];
          const avg = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
          const prevPeriod = i > 0 ? arr[i - 1] : null;
          const prevVals = prevPeriod ? (phases[prevPeriod] || []) : [];
          const prevAvg = prevVals.length > 0 ? Math.round(prevVals.reduce((s, v) => s + v, 0) / prevVals.length) : 0;
          const growth = prevAvg > 0 ? Math.round(((avg - prevAvg) / prevAvg) * 100) : 0;
          return {
            period,
            avg,
            growth: `${growth >= 0 ? '+' : ''}${growth}%`,
            growthPos: growth >= 0,
          };
        });

        const peakOcc = chartDays.length > 0 ? Math.max(...chartDays.map(d => d.peak || d.occ)) : 0;

        if (!cancelled) {
          setSemesterData(prev => ({
            ...prev,
            [selectedKey]: {
              days: chartDays,
              seasonal,
              peakOcc,
              dataPoints: chartDays.length,
            },
          }));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    loadSemester();
    return () => { cancelled = true; };
  }, [rootId, selectedKey]);

  const sem = semesterData[selectedKey];
  const semDef = SEMESTER_DEFS[selectedKey];

  // Multi-year comparison: fetch all three semesters' average for a summary
  const multiYear = useMemo(() => {
    const years = {};
    Object.entries(semesterData).forEach(([key, data]) => {
        const year = SEMESTER_DEFS[key].start.slice(0, 4);
        if (!years[year]) years[year] = [];
        data.days.forEach(d => {
          const localDate = parseLocalDate(d.rawDate);
          if (localDate) {
            years[year].push({ month: localDate.getMonth(), occ: d.occ });
          }
        });
      });

    // Build month-by-month comparison
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, mi) => {
      const row = { m };
      Object.entries(years).forEach(([year, entries]) => {
        const monthEntries = entries.filter(e => e.month === mi);
        row[`y${year}`] = monthEntries.length > 0
          ? Math.round(monthEntries.reduce((s, e) => s + e.occ, 0) / monthEntries.length)
          : null;
      });
      return row;
    });
  }, [semesterData]);

  const allYears = [...new Set(Object.keys(SEMESTER_DEFS).map(k => SEMESTER_DEFS[k].start.slice(0, 4)))].sort();

  const statDefs = sem ? [
    { label: 'Selected Semester', value: semDef.label,           sub: `${semDef.start} – ${semDef.end}`, Icon: Calendar,   accentKey: 'accent' },
    { label: 'Peak Occupancy',    value: String(sem.peakOcc),    sub: 'highest single day',               Icon: Award,      accentKey: 'statusAmber' },
    { label: 'Data Points',       value: String(sem.dataPoints), sub: 'days analyzed',                    Icon: Database,   accentKey: 'primary' },
    { label: 'Avg Occupancy',     value: sem.days.length > 0 ? String(Math.round(sem.days.reduce((s, d) => s + d.occ, 0) / sem.days.length)) : '—', sub: 'daily average', Icon: TrendingUp, accentKey: 'statusGreen', valueKey: 'positiveText' },
  ] : [];

  const peakOcc = sem?.peakOcc || 100;

  const yearColors = allYears.map((_, i) => {
    const opacity = Math.round(((i + 1) / allYears.length) * 255).toString(16).padStart(2, '0');
    return colors.primary + opacity;
  });

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

        {error && !sem ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.statusRedText, background: colors.statusRedBg, borderRadius: '12px' }}>
            <AlertTriangle size={24} style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Failed to load data</div>
            <div style={{ fontSize: '13px', color: colors.muted }}>{error}</div>
          </div>
        ) : loading && !sem ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '80px 0', color: colors.muted }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Loading historical data...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : sem ? (
          <>
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

            {/* Semester Area Chart */}
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
                Daily occupancy data aligned with the TTU academic calendar.
              </div>
              {sem.days.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={sem.days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={colors.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.muted }} axisLine={false} tickLine={false} interval={Math.max(Math.floor(sem.days.length / 8), 1)} />
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
              ) : (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted, fontSize: '13px' }}>
                  No data available for this semester
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ width: 16, height: 2.5, background: colors.primary, borderRadius: 2, display: 'inline-block' }} aria-hidden="true" />
                  <span style={{ fontSize: '12px', color: colors.primary, fontWeight: 600 }}>Avg Daily Occupancy</span>
                </div>
                <div style={{ fontSize: '11px', color: colors.muted }}>
                  Peak: <strong style={{ color: colors.body }}>{peakOcc}</strong> &nbsp;·&nbsp;
                  Range: <strong style={{ color: colors.body }}>{semDef.start} – {semDef.end}</strong>
                </div>
              </div>
            </div>

            {/* Multi-Year Line (built from loaded semesters) */}
            {multiYear.some(r => allYears.some(y => r[`y${y}`] != null)) && (
              <div className="card" style={{
                padding: '20px 22px', marginBottom: 24,
                background: colors.surface, border: `1px solid ${colors.border}`,
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: colors.body, marginBottom: 16 }}>
                  Multi-Year Monthly Comparison ({allYears.join('–')})
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={multiYear} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="m" tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    {allYears.map((year, i) => (
                      <Line key={year} type="monotone" dataKey={`y${year}`} name={year} stroke={yearColors[i]} strokeWidth={i === allYears.length - 1 ? 2.5 : 2} dot={false} connectNulls={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                  {allYears.map((year, i) => (
                    <span key={year} style={{ fontSize: '12px', color: yearColors[i], fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 16, height: 2.5, background: yearColors[i], borderRadius: 2, display: 'inline-block' }} aria-hidden="true" />{year}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Seasonal Table */}
            <div className="card" style={{
              padding: '20px 22px',
              background: colors.surface, border: `1px solid ${colors.border}`,
            }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: colors.body, marginBottom: 4 }}>
                Seasonal Usage Patterns — {semDef.label}
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
                    {sem.seasonal.map(r => (
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
                            <div style={{ width: `${peakOcc > 0 ? (r.avg / peakOcc) * 100 : 0}%`, height: '100%', background: colors.primary, borderRadius: '99px' }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
