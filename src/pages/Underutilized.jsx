import { useState, useEffect } from 'react';
import { Flag, BarChart2, Search, DollarSign, MapPin, Loader, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { fetchLocations, fetchDailyOccupancy, daysAgo, today, cleanName, parseLocalDate } from '../api/occuspace.js';
import './Underutilized.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const UTILIZATION_THRESHOLD = 20; // percent
const WEEKS_TO_ANALYZE = 8;

function MiniBar({ vals, spaceLabel }) {
  const { colors } = useTheme();
  const max = Math.max(...vals, 1);
  return (
    <div role="img" aria-label={`Weekly usage pattern for ${spaceLabel}`}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 36 }}>
        {vals.map((v, i) => (
          <div key={i} title={`${DAYS[i]}: ${v}%`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: colors.muted }}>{v}%</div>
        ))}
      </div>
    </div>
  );
}

export default function Underutilized() {
  const { colors } = useTheme();
  const [animIn, setAnimIn] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const allLocations = await fetchLocations();
        const root = allLocations.find(l => l.parentId == null) || allLocations[0];
        const children = allLocations.filter(l => l.parentId === root?.id);
        const locationsToQuery = children.length > 0 ? children : allLocations;

        const start = daysAgo(WEEKS_TO_ANALYZE * 7);
        const end = today();

        // Fetch daily occupancy for each location over the analysis period
        const dailyPromises = locationsToQuery.map(loc =>
          fetchDailyOccupancy(loc.id, start, end)
        );
        const dailyResults = await Promise.allSettled(dailyPromises);

        const analyzed = locationsToQuery.map((loc, i) => {
          const result = dailyResults[i];
          if (result.status !== 'fulfilled' || !result.value?.length) return null;

          const days = result.value;
          // Use avgPercentageOccupied from API if available, otherwise compute from count
          // avgPercentageOccupied is a decimal fraction (0.13 = 13%), so multiply by 100
          const hasApiPct = days[0]?.avgPercentageOccupied != null;
          const pct = hasApiPct
            ? Math.round(days.reduce((s, d) => s + (d.avgPercentageOccupied || 0), 0) / days.length * 100)
            : loc.capacity > 0
              ? Math.round(days.reduce((s, d) => s + (d.avgOccupancy || 0), 0) / days.length / loc.capacity * 100)
              : 0;

          if (pct >= UTILIZATION_THRESHOLD) return null; // not underutilized

          // Compute weekly pattern (average by day-of-week)
          const byDow = [0, 0, 0, 0, 0, 0, 0];
          const countDow = [0, 0, 0, 0, 0, 0, 0];
          days.forEach(d => {
            const localDate = d.normalizedDate
              ? parseLocalDate(d.normalizedDate)
              : new Date(d.timestamp);
            if (!localDate) return;
            const dow = (localDate.getDay() + 6) % 7; // Mon=0 ... Sun=6
            byDow[dow] += d.avgOccupancy;
            countDow[dow]++;
          });
          const weekly = byDow.map((total, i) =>
            countDow[i] > 0 && loc.capacity > 0
              ? Math.round((total / countDow[i] / loc.capacity) * 100)
              : 0
          );

          // Simple trend: compare first half to second half
          const mid = Math.floor(days.length / 2);
          const firstHalf = days.slice(0, mid);
          const secondHalf = days.slice(mid);
          const avgFirst = firstHalf.reduce((s, d) => s + d.avgOccupancy, 0) / (firstHalf.length || 1);
          const avgSecond = secondHalf.reduce((s, d) => s + d.avgOccupancy, 0) / (secondHalf.length || 1);
          const trend = avgSecond < avgFirst * 0.95 ? 'declining' : 'stable';

          const wasted = 100 - pct;

          return {
            name: cleanName(loc.name),
            capacity: loc.capacity,
            pct,
            avgOcc: pct,
            wasted,
            trend,
            weekly,
          };
        }).filter(Boolean);

        // Sort by lowest utilization
        analyzed.sort((a, b) => a.pct - b.pct);

        if (!cancelled) {
          setSpaces(analyzed);
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

  // Derived stats
  const flaggedCount = spaces.length;
  const totalWasted = spaces.reduce((s, sp) => s + Math.round(sp.capacity * (sp.wasted / 100)), 0);

  const statDefs = [
    { label: 'Flagged Spaces',         value: String(flaggedCount), sub: 'Below threshold',           Icon: Flag,      accentKey: 'statusAmber' },
    { label: 'Total Wasted Capacity',  value: String(totalWasted),  sub: 'seats/spots available',     Icon: BarChart2, accentKey: 'accent' },
    { label: 'Analysis Period',        value: String(WEEKS_TO_ANALYZE), sub: 'weeks analyzed',        Icon: Search,    accentKey: 'statusGreen' },
    { label: 'Avg Utilization',        value: spaces.length > 0 ? `${Math.round(spaces.reduce((s, sp) => s + sp.pct, 0) / spaces.length)}%` : '—', sub: 'across flagged spaces', Icon: DollarSign, accentKey: 'statusGreen', subKey: 'positiveText' },
  ];

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
            Spaces below {UTILIZATION_THRESHOLD}% utilization threshold – opportunities for optimization
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '80px 0', color: colors.muted }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Analyzing space utilization...</span>
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
            {spaces.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.muted, background: colors.bgSubtle, borderRadius: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: 4 }}>No underutilized spaces found</div>
                <div style={{ fontSize: '13px' }}>All spaces are above the {UTILIZATION_THRESHOLD}% utilization threshold</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} role="region" aria-label="Underutilized spaces">
                {spaces.map(sp => (
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
                        Weekly Usage Pattern (avg % of capacity)
                      </div>
                      <MiniBar vals={sp.weekly} spaceLabel={sp.name} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
