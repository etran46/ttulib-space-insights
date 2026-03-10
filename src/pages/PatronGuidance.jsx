import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import './PatronGuidance.css';

const topSpaces = [
  {
    rank: 1,
    name: 'Public Spaces',
    location: 'Main Library • DMS',
    spots: 77,
    capacity: 109,
    statusType: 'plenty',
    status: 'Plenty of Space',
    direction: 'Main Library, 2nd Floor, DMS area',
  },
  {
    rank: 2,
    name: 'Main Floor',
    location: 'Main Library',
    spots: 307,
    capacity: 449,
    statusType: 'plenty',
    status: 'Plenty of Space',
    direction: '1st Floor of Main Library',
  },
  {
    rank: 3,
    name: 'Mezzanine',
    location: 'Main Library • West Wing',
    spots: 41,
    capacity: 116,
    statusType: 'filling',
    status: 'Filling Up',
    direction: 'Main Library, West wing, mezzanine',
  },
];

export default function PatronGuidance() {
  const { colors } = useTheme();
  const [animIn, setAnimIn] = useState(false);
  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

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
            Updated 05:14 PM
          </div>
        </div>

        {/* Space Cards */}
        <div className="location-grid" style={{ marginBottom: 40 }}>
          {topSpaces.map(sp => {
            const pct = Math.round((sp.spots / sp.capacity) * 100);
            const statusBg    = sp.statusType === 'plenty' ? colors.statusGreenBg    : colors.statusAmberBg;
            const statusColor = sp.statusType === 'plenty' ? colors.statusGreenText  : colors.statusAmberText;
            const statusBorder= sp.statusType === 'plenty' ? colors.statusGreen      : colors.statusAmber;
            const barColor    = sp.statusType === 'plenty' ? colors.statusGreen      : colors.statusAmber;

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
                  <MapPin size={12} aria-hidden="true" color={colors.muted} /> {sp.location}
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

                {/* Progress Bar — derived from real data */}
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
                  {sp.statusType === 'plenty' ? '✓' : '○'} {sp.status}
                </div>

                {/* Directions */}
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
                  <Navigation size={12} aria-hidden="true" /> {sp.direction}
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
      </div>
    </div>
  );
}
