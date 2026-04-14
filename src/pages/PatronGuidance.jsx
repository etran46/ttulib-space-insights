import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { fetchLocations, fetchLocationNow } from '../api/occuspace.js';
import './PatronGuidance.css';

function getStatusInfo(pctAvailable) {
  if (pctAvailable >= 50) return { type: 'plenty', label: 'Plenty of Space', icon: '✓' };
  if (pctAvailable >= 25) return { type: 'filling', label: 'Filling Up', icon: '○' };
  return { type: 'busy', label: 'Busy', icon: '⚠' };
}

export default function PatronGuidance() {
  const { colors } = useTheme();
  const [animIn, setAnimIn] = useState(false);
  const [topSpaces, setTopSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const allLocations = await fetchLocations();
        const root = allLocations.find(l => l.parentID == null) || allLocations[0];
        const children = allLocations.filter(l => l.parentID === root?.id);
        const locationsToQuery = children.length > 0 ? children : allLocations;

        const nowPromises = locationsToQuery.map(loc => fetchLocationNow(loc.id));
        const nowResults = await Promise.allSettled(nowPromises);

        const spaces = locationsToQuery
          .map((loc, i) => {
            const result = nowResults[i];
            if (result.status !== 'fulfilled' || !result.value.isActive) return null;
            const d = result.value;
            const spots = loc.capacity - d.count;
            const pctAvailable = loc.capacity > 0 ? Math.round((spots / loc.capacity) * 100) : 0;
            const statusInfo = getStatusInfo(pctAvailable);
            return {
              name: loc.name,
              spots: Math.max(0, spots),
              capacity: loc.capacity,
              pctAvailable,
              statusType: statusInfo.type,
              status: statusInfo.label,
              icon: statusInfo.icon,
            };
          })
          .filter(Boolean)
          .sort((a, b) => b.spots - a.spots)
          .slice(0, 3)
          .map((sp, i) => ({ ...sp, rank: i + 1 }));

        if (!cancelled) {
          setTopSpaces(spaces);
          setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
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
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <div
      id="main-content"
      className="patron-guidance-page"
      style={{
        background: colors.bg,
        opacity: animIn ? 1 : 0,
        transform: animIn ? 'none' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '36px', fontWeight: 900, color: colors.heading, margin: 0 }}>
            Library Usage Analytics
          </h1>
          <div style={{ fontSize: '15px', color: colors.secondary, fontWeight: 600, marginTop: 8 }}>
            Top 3 Available Spaces Right Now
          </div>
          <div style={{ fontSize: '12px', color: colors.muted, marginTop: 4 }}>
            {lastUpdated ? `Updated ${lastUpdated}` : 'Loading...'}
          </div>
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
            {/* Space Cards */}
            <div className="location-grid" style={{ marginBottom: 40 }}>
              {topSpaces.map(sp => {
                const pct = Math.round((sp.spots / sp.capacity) * 100);
                const statusBg    = sp.statusType === 'plenty' ? colors.statusGreenBg    : sp.statusType === 'filling' ? colors.statusAmberBg    : colors.statusRedBg;
                const statusColor = sp.statusType === 'plenty' ? colors.statusGreenText  : sp.statusType === 'filling' ? colors.statusAmberText  : colors.statusRedText;
                const statusBorder= sp.statusType === 'plenty' ? colors.statusGreen      : sp.statusType === 'filling' ? colors.statusAmber      : colors.statusRed;
                const barColor    = sp.statusType === 'plenty' ? colors.statusGreen      : sp.statusType === 'filling' ? colors.statusAmber      : colors.statusRed;

                return (
                  <div
                    key={sp.rank}
                    style={{
                      background: colors.surface,
                      borderRadius: '16px',
                      padding: '36px 22px 22px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                      border: `1px solid ${colors.border}`,
                      textAlign: 'center',
                      position: 'relative',
                      marginTop: 22,
                      transition: 'box-shadow 0.2s, transform 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    {/* Rank Badge */}
                    <div
                      aria-label={`Rank ${sp.rank}`}
                      style={{
                        position: 'absolute',
                        top: -22,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: colors.primaryLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        fontWeight: 900,
                        color: colors.primary,
                        border: `3px solid ${colors.bg}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                      }}
                    >
                      #{sp.rank}
                    </div>

                    <div style={{ fontWeight: 900, fontSize: '20px', color: colors.heading, marginBottom: 4 }}>
                      {sp.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: colors.muted,
                      marginBottom: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}>
                      <MapPin size={12} aria-hidden="true" color={colors.muted} /> Capacity: {sp.capacity}
                    </div>

                    {/* Spots Available */}
                    <div style={{
                      background: colors.bgSubtle,
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      marginBottom: 14,
                    }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, color: colors.heading }}>{sp.spots}</span>
                      <span style={{ fontSize: '13px', color: colors.secondary, fontWeight: 500 }}>spots available</span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${pct}% of capacity available`}
                      style={{ background: colors.bgSubtle, borderRadius: '99px', height: '6px', marginBottom: 14 }}
                    >
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: '99px',
                      }} />
                    </div>

                    {/* Status */}
                    <div style={{
                      border: `1.5px solid ${statusBorder}`,
                      background: statusBg,
                      color: statusColor,
                      borderRadius: '10px',
                      padding: '10px',
                      fontWeight: 700,
                      fontSize: '14px',
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}>
                      {sp.icon} {sp.status}
                    </div>

                    {/* Location info */}
                    <div style={{
                      background: colors.accentBg,
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '12px',
                      color: colors.accent,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <Navigation size={12} aria-hidden="true" /> {sp.name}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="card" style={{
              padding: '20px 24px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: colors.body, marginBottom: 16 }}>Legend</div>
              <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                {[
                  { icon: '✓', label: 'Plenty of Space', sub: '50%+ capacity available',    bg: colors.statusGreenBg,  color: colors.statusGreenText },
                  { icon: '○', label: 'Filling Up',       sub: '25–50% capacity available',  bg: colors.statusAmberBg,  color: colors.statusAmberText },
                  { icon: '⚠', label: 'Busy',             sub: 'Less than 25% available',    bg: colors.statusRedBg,    color: colors.statusRedText },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '8px',
                      background: l.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      color: l.color,
                      fontWeight: 900,
                      flexShrink: 0,
                      border: `1px solid ${l.color}40`,
                    }} aria-hidden="true">
                      {l.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: colors.body }}>{l.label}</div>
                      <div style={{ fontSize: '12px', color: colors.muted }}>{l.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
