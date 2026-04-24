import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, CheckCircle, AlertTriangle, MapPin, Loader, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import ChartTooltip from '../components/ChartTooltip.jsx';
import { fetchLocations, fetchLocationNow, fetchHourlyOccupancy, today, daysAgo, cleanName } from '../api/occuspace.js';
import './Dashboard.css';

function StatusBadge({ status }) {
  const { colors } = useTheme();
  const map = {
    Available:       { bg: colors.statusGreenBg, color: colors.statusGreenText, label: 'Available' },
    'Near Capacity': { bg: colors.statusRedBg,   color: colors.statusRedText,   label: 'Near Capacity' },
    Moderate:        { bg: colors.statusAmberBg, color: colors.statusAmberText, label: 'Moderate' },
  };
  const s = map[status] || map.Available;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: '11px', fontWeight: 700,
      padding: '2px 10px', borderRadius: '20px',
    }}>
      {s.label}
    </span>
  );
}

function OccBar({ pct, status }) {
  const { colors } = useTheme();
  const barColor =
    status === 'Available'     ? colors.statusGreen :
    status === 'Near Capacity' ? colors.statusRed   :
                                 colors.statusAmber;
  return (
    <div
      role="progressbar"
      aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
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

function processNow(loc, d) {
  const pct = d.percentage != null
    ? Math.round(d.percentage * 100)
    : loc.capacity > 0 ? Math.round((d.count / loc.capacity) * 100) : 0;
  return {
    id: loc.id,
    name: cleanName(loc.name),
    current: d.count,
    capacity: loc.capacity,
    status: getStatus(pct),
    isActive: d.isActive,
  };
}

function LocationCard({ loc, hasChildren, isExpanded, isChildLoading, onClick, colors }) {
  const pct = loc.capacity > 0 ? Math.round((loc.current / loc.capacity) * 100) : 0;
  return (
    <div
      className="card"
      role={hasChildren ? 'button' : undefined}
      aria-expanded={hasChildren ? isExpanded : undefined}
      tabIndex={hasChildren ? 0 : undefined}
      onKeyDown={hasChildren ? (e => (e.key === 'Enter' || e.key === ' ') && onClick?.()) : undefined}
      style={{
        padding: '18px 20px',
        cursor: hasChildren ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
        background: colors.surface,
        border: `1px solid ${isExpanded ? colors.accent : colors.border}`,
        opacity: loc.isActive === false ? 0.5 : 1,
      }}
      onClick={hasChildren ? onClick : undefined}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.10)';
        if (hasChildren) e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: '14px', color: colors.body, display: 'flex', alignItems: 'center', gap: 5 }}>
          <MapPin size={13} color={colors.muted} aria-hidden="true" />
          {loc.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusBadge status={loc.status} />
          {hasChildren && (
            isChildLoading
              ? <Loader size={14} color={colors.muted} style={{ animation: 'spin 1s linear infinite' }} aria-label="Loading" />
              : isExpanded
                ? <ChevronDown size={15} color={colors.accent} aria-hidden="true" />
                : <ChevronRight size={15} color={colors.muted} aria-hidden="true" />
          )}
        </div>
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
}

function ExpandableLocationGrid({ locationIds, allLocs, locNow, expanded, childLoading, onToggle, colors, depth }) {
  return (
    <div>
      <div className="location-grid">
        {locationIds.map(id => {
          const loc = locNow[id];
          if (!loc) return null;
          const hasChildren = allLocs.some(l => l.parentId === id);
          return (
            <LocationCard
              key={id}
              loc={loc}
              hasChildren={hasChildren}
              isExpanded={expanded.has(id)}
              isChildLoading={childLoading.has(id)}
              onClick={() => onToggle(id)}
              colors={colors}
            />
          );
        })}
      </div>

      {locationIds.map(id => {
        if (!expanded.has(id)) return null;
        const parentLoc = locNow[id];
        const childLocs = allLocs.filter(l => l.parentId === id);
        const accentOpacity = Math.max(1 - depth * 0.25, 0.4);
        return (
          <div
            key={`expanded-${id}`}
            style={{
              marginTop: 16,
              borderLeft: `3px solid ${colors.accent}`,
              paddingLeft: 16,
              opacity: accentOpacity > 0 ? 1 : 1,
            }}
          >
            <div style={{
              fontSize: '12px', fontWeight: 700, color: colors.accent,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <ChevronDown size={13} aria-hidden="true" />
              {parentLoc?.name} — Sections
            </div>

            {childLoading.has(id) ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0', color: colors.muted }}>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Loading sections...</span>
              </div>
            ) : (
              <ExpandableLocationGrid
                locationIds={childLocs.map(l => l.id)}
                allLocs={allLocs}
                locNow={locNow}
                expanded={expanded}
                childLoading={childLoading}
                onToggle={onToggle}
                colors={colors}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { colors } = useTheme();
  const [animIn, setAnimIn] = useState(false);
  const [allLocs, setAllLocs] = useState([]);
  const [topLevelIds, setTopLevelIds] = useState([]);
  const [locNow, setLocNow] = useState({});
  const [occupancyData, setOccupancyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [childLoading, setChildLoading] = useState(new Set());

  // Keep a ref so toggleExpand always has the latest allLocs without a stale closure
  const allLocsRef = useRef([]);

  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const locs = await fetchLocations();
        if (cancelled) return;

        allLocsRef.current = locs;
        setAllLocs(locs);

        const root = locs.find(l => l.parentId == null) || locs[0];
        const children = locs.filter(l => l.parentId === root?.id);
        const toShow = children.length > 0 ? children : locs;
        setTopLevelIds(toShow.map(l => l.id));

        const results = await Promise.allSettled(toShow.map(l => fetchLocationNow(l.id)));
        if (cancelled) return;

        const nowMap = {};
        toShow.forEach((loc, i) => {
          const r = results[i];
          nowMap[loc.id] = r.status === 'fulfilled'
            ? processNow(loc, r.value)
            : { id: loc.id, name: cleanName(loc.name), current: 0, capacity: loc.capacity, status: 'Available', isActive: loc.isActive };
        });
        setLocNow(nowMap);

        const rootId = root?.id;
        if (rootId) {
          try {
            let hourly = await fetchHourlyOccupancy(rootId, today(), today());
            if (!hourly?.length) hourly = await fetchHourlyOccupancy(rootId, daysAgo(1), daysAgo(1));
            const chartData = (hourly || []).map(h => ({
              time: h.normalizedTime
                ? new Date(`1970-01-01T${h.normalizedTime}`).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
                : h.timestamp,
              occupancy: h.avgOccupancy,
            }));
            if (!cancelled) setOccupancyData(chartData);
          } catch {}
        }

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false); }
      }
    }

    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  async function toggleExpand(locId) {
    const locs = allLocsRef.current;
    const children = locs.filter(l => l.parentId === locId);
    if (children.length === 0) return;

    const isCurrentlyExpanded = expanded.has(locId);

    setExpanded(prev => {
      const next = new Set(prev);
      isCurrentlyExpanded ? next.delete(locId) : next.add(locId);
      return next;
    });

    if (!isCurrentlyExpanded) {
      const unloaded = children.filter(c => !locNow[c.id]);
      if (unloaded.length > 0) {
        setChildLoading(prev => new Set([...prev, locId]));
        const results = await Promise.allSettled(unloaded.map(c => fetchLocationNow(c.id)));
        setLocNow(prev => {
          const next = { ...prev };
          unloaded.forEach((loc, i) => {
            const r = results[i];
            next[loc.id] = r.status === 'fulfilled'
              ? processNow(loc, r.value)
              : { id: loc.id, name: cleanName(loc.name), current: 0, capacity: loc.capacity, status: 'Available', isActive: loc.isActive };
          });
          return next;
        });
        setChildLoading(prev => { const n = new Set(prev); n.delete(locId); return n; });
      }
    }
  }

  const topLocs = topLevelIds.map(id => locNow[id]).filter(Boolean);
  const totalCurrent = topLocs.reduce((s, l) => s + l.current, 0);
  const totalCapacity = topLocs.reduce((s, l) => s + (l.capacity || 0), 0);
  const capacityPct = totalCapacity > 0 ? Math.round((totalCurrent / totalCapacity) * 100) : 0;
  const availableSpots = totalCapacity - totalCurrent;
  const highCapCount = topLocs.filter(l => l.status === 'Near Capacity').length;

  const statDefs = [
    { label: 'Total Occupancy',     value: totalCurrent.toLocaleString(),    sub: `of ${totalCapacity.toLocaleString()} capacity`,             Icon: Users,         accentKey: 'accent' },
    { label: 'Capacity Used',       value: `${capacityPct}%`,                sub: capacityPct < 85 ? '↗ Within limits' : '⚠ High usage',      Icon: TrendingUp,    accentKey: 'statusGreen', subKey: capacityPct < 85 ? 'positiveText' : 'negativeText' },
    { label: 'Available Spots',     value: availableSpots.toLocaleString(),  sub: 'across all areas',                                          Icon: CheckCircle,   accentKey: 'statusAmber' },
    { label: 'High Capacity Areas', value: String(highCapCount),             sub: highCapCount > 0 ? 'need attention' : 'all clear',           Icon: AlertTriangle, accentKey: 'statusRed',   subKey: highCapCount > 0 ? 'negativeText' : 'positiveText' },
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
                    <div style={{ fontSize: '12px', color: colors.muted, fontWeight: 500, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: '30px', fontWeight: 800, color: colors.body, lineHeight: 1.1 }}>{value}</div>
                    <div style={{ fontSize: '12px', color: subKey ? colors[subKey] : colors.secondary, marginTop: 4, fontWeight: 500 }}>{sub}</div>
                  </div>
                  <div style={{
                    width: 40, height: 40, borderRadius: '10px',
                    background: colors[`${accentKey}Bg`] || colors.bgSubtle,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={18} color={colors[accentKey] || colors.primary} aria-hidden="true" />
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{
              background: colors.surface, borderRadius: '16px', padding: '24px 28px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 28,
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

            {/* Location Grid + Expandable Children */}
            <div role="region" aria-label="Location status">
              <div style={{ fontSize: '15px', fontWeight: 800, color: colors.body, marginBottom: 16 }}>
                Location Status
              </div>

              <ExpandableLocationGrid
                locationIds={topLevelIds}
                allLocs={allLocs}
                locNow={locNow}
                expanded={expanded}
                childLoading={childLoading}
                onToggle={toggleExpand}
                colors={colors}
                depth={0}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
