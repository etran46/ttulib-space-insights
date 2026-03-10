import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEMES } from '../context/ThemeContext.jsx';

const NAV_ITEMS = [
  { key: 'Dashboard',      label: 'Dashboard' },
  { key: 'Underutilized',  label: 'Underutilized' },
  { key: 'CompareSpaces',  label: 'Compare Spaces' },
  { key: 'Historical',     label: 'Historical' },
  { key: 'PatronGuidance', label: 'Patron Guidance' },
];

export default function Header({ active, onNavigate }) {
  const { colors, themeKey, setThemeKey } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navHover, setNavHover] = useState(null);

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header
        role="banner"
        style={{
          background: colors.headerBg,
          borderBottom: `1.5px solid ${colors.headerBorder}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          height: 64,
          gap: 24,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200, flexShrink: 0 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.bgSubtle,
            flexShrink: 0,
          }}>
            <img
              src="/Texas_Tech_Athletics_logo.svg"
              alt="Texas Tech University"
              style={{ width: '80%', height: '80%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: colors.heading, lineHeight: 1.2 }}>
              Texas Tech Libraries
            </div>
            <div style={{ fontSize: '11px', color: colors.muted, fontWeight: 500 }}>
              Occupancy Analytics
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav role="navigation" aria-label="Main navigation" style={{ display: 'flex', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(({ key, label }) => {
            const isActive = active === key;
            const isHovered = navHover === key;
            return (
              <button
                key={key}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate && onNavigate(key)}
                onMouseEnter={() => setNavHover(key)}
                onMouseLeave={() => setNavHover(null)}
                style={{
                  background: isHovered && !isActive ? colors.navHover : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isActive ? colors.navActive : colors.navInactive,
                  borderBottom: isActive
                    ? `2.5px solid ${colors.navActive}`
                    : '2.5px solid transparent',
                  borderRadius: isActive ? '0' : '6px',
                  marginBottom: isActive ? '-1.5px' : '0',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Accessibility / Theme picker */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            aria-label="Change color theme"
            aria-expanded={paletteOpen}
            aria-haspopup="listbox"
            onClick={() => setPaletteOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: paletteOpen ? colors.bgSubtle : 'transparent',
              border: `1.5px solid ${paletteOpen ? colors.border : 'transparent'}`,
              borderRadius: '8px',
              padding: '7px 12px',
              cursor: 'pointer',
              color: colors.secondary,
              fontSize: '12px',
              fontWeight: 600,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <Palette size={15} />
            <span style={{ whiteSpace: 'nowrap' }}>Accessibility</span>
          </button>

          {paletteOpen && (
            <>
              <div
                aria-hidden="true"
                onClick={() => setPaletteOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              />
              <div
                role="listbox"
                aria-label="Color theme options"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: colors.surface,
                  border: `1.5px solid ${colors.border}`,
                  borderRadius: '12px',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
                  padding: '8px',
                  width: 248,
                  zIndex: 200,
                }}
              >
                <div style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: colors.muted,
                  letterSpacing: '0.07em',
                  padding: '4px 8px 8px',
                }}>
                  COLOR THEME
                </div>
                {Object.entries(THEMES).map(([key, t]) => {
                  const isSelected = themeKey === key;
                  return (
                    <button
                      key={key}
                      role="option"
                      aria-selected={isSelected}
                      type="button"
                      onClick={() => { setThemeKey(key); setPaletteOpen(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        background: isSelected ? colors.bgSubtle : 'transparent',
                        border: isSelected
                          ? `1.5px solid ${colors.border}`
                          : '1.5px solid transparent',
                        borderRadius: '8px',
                        padding: '9px 10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginBottom: 2,
                        transition: 'background 0.12s',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                        {t.swatches.map((c, i) => (
                          <div key={i} style={{
                            width: 12,
                            height: 12,
                            borderRadius: '3px',
                            background: c,
                            border: key === 'highContrast' ? '1px solid #999' : 'none',
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: colors.body, flex: 1 }}>
                        {t.label}
                      </span>
                      {isSelected && <Check size={14} color={colors.primary} />}
                    </button>
                  );
                })}

                <div style={{
                  marginTop: 6,
                  paddingTop: 8,
                  borderTop: `1px solid ${colors.border}`,
                  fontSize: '11px',
                  color: colors.muted,
                  padding: '8px 10px 4px',
                  lineHeight: 1.5,
                }}>
                  Colorblind (D/P) replaces red/green with blue/orange/purple for deuteranopia &amp; protanopia.
                </div>
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
}
