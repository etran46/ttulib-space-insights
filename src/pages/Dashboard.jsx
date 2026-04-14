import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, CheckCircle, AlertTriangle, MapPin, Loader } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import ChartTooltip from '../components/ChartTooltip.jsx';
import { fetchLocations, fetchLocationNow, fetchHourlyOccupancy, today } from '../api/occuspace.js';
import './Dashboard.css';

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

function getStatus(pct) {
  if (pct >= 85) return 'Near Capacity';
  if (pct >= 50) return 'Moderate';
  return 'Available';
}

export default function Dashboard() {
  const { colors } = useTheme();
  const [animIn, setAnimIn] = useState(false);
  const [locations, setLocations] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all locations
        const allLocations = await fetchLocations();

        // Find the root location (no parent) — typically the building itself
        const root = allLocations.find(l => l.parentID == null) || allLocations[0];
        // Child locations are the individual spaces
        const children = allLocations.filter(l => l.parentID === root?.id);
        const locationsToShow = children.length > 0 ? children : allLocations;

        // Fetch real-time data for each location
        const nowPromises = locationsToShow.map(loc => fetchLocationNow(loc.id));
        const nowResults = await Promise.allSettled(nowPromises);

        const locs = locationsToShow.map((loc, i) => {
          const result = nowResults[i];
          if (result.status === 'fulfilled') {
            const d = result.value;
            const pct = d.percentage ?? Math.round((d.count / loc.capacity) * 100);
            return {
              name: loc.name,
              current: d.count,
              capacity: loc.capacity,
              status: getStatus(pct),
              isActive: d.isActive,
            };
          }
          return {
            name: loc.name,
            current: 0,
            capacity: loc.capacity,
            status: 'Available',
            isActive: loc.isActive,
          };
        });

        if (cancelled) return;
        setLocations(locs);

        // Fetch hourly occupancy for the root/building for today's trend chart
        const rootId = root?.id || locationsToShow[0]?.id;
        if (rootId) {
          try {
            const hourly = await fetchHourlyOccupancy(rootId, today(), today());
            const chartData = (hourly || []).map(h => ({
              time: h.normalizedTime
                ? new Date(`1970-01-01T${h.normalizedTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: undefined, hour12: true })
                : h.timestamp,
              occupancy: h.avgOccupancy,
            }));
            if (!cancelled) setOccupancyData(chartData);
          } catch {
            // Hourly data may not be available; leave chart empty
          }
        }

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();
    // Refresh every 5 minutes
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Derived stats
  const totalCurrent = locations.reduce((s, l) => s + l.current, 0);
  const totalCapacity = locations.reduce((s, l) => s + l.capacity, 0);
  const capacityPct = totalCapacity > 0 ? Math.round((totalCurrent / totalCapacity) * 100) : 0;
  const availableSpots = totalCapacity - totalCurrent;
  const highCapCount = locations.filter(l => l.status === 'Near Capacity').length;

  const statDefs = [
    { label: 'Total Occupancy',      value: totalCurrent.toLocaleString(),  sub: `of ${totalCapacity.toLocaleString()} capacity`, Icon: Users,         accentKey: 'accent' },
    { label: 'Capacity Used',        value: `${capacityPct}%`,             sub: capacityPct < 85 ? '↗ Within limits' : '⚠ High usage', Icon: TrendingUp,    accentKey: 'statusGreen', subKey: capacityPct < 85 ? 'positiveText' : 'negativeText' },
    { label: 'Available Spots',      value: availableSpots.toLocaleString(), sub: 'across all areas',   Icon: CheckCircle,   accentKey: 'statusAmber' },
    { label: 'High Capacity Areas',  value: String(highCapCount),           sub: highCapCount > 0 ? 'need attention' : 'all clear', Icon: AlertTriangle, accentKey: 'statusRed', subKey: highCapCount > 0 ? 'negativeText' : 'positiveText' },
  ];

  const maxOcc = Math.max(...occupancyData.map(d => d.occupancy), 100);

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

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '80px 0', color: colors.muted }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Loading live data...</span>
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
              {occupancyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={occupancyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, Math.ceil(maxOcc / 50) * 50 + 50]} tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="occupancy" name="Occupancy" stroke={colors.accent} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.muted, fontSize: '13px' }}>
                  No hourly data available yet for today
                </div>
              )}
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
                  const pct = loc.capacity > 0 ? Math.round((loc.current / loc.capacity) * 100) : 0;
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
                        opacity: loc.isActive === false ? 0.5 : 1,
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
          </>
        )}
      </div>
    </div>
  );
}
