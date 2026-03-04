import { useState, useEffect } from "react";
import "./PatronGuidance.css";

const RED = "#c0392b";

const topSpaces = [
  {
    rank: 1, name: "Public Spaces", location: "Main Library • DMS",
    spots: 77, statusType: "plenty", status: "Plenty of Space",
    direction: "Main Library, 2nd Floor, DMS area"
  },
  {
    rank: 2, name: "Main Floor", location: "Main Library",
    spots: 307, statusType: "plenty", status: "Plenty of Space",
    direction: "1st Floor of Main Library"
  },
  {
    rank: 3, name: "Mezzanine", location: "Main Library • West Wing",
    spots: 41, statusType: "filling", status: "Filling Up",
    direction: "Main Library, West wing, mezzanine"
  },
];

export default function PatronGuidance() {
  const [animIn, setAnimIn] = useState(false);
  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  return (
    <div
      className="patron-guidance-page"
      style={{
        opacity: animIn ? 1 : 0,
        transform: animIn ? "none" : "translateY(12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Page Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Library Usage Analytics</h1>
          <div style={{ fontSize: "15px", color: "#64748b", fontWeight: 600, marginTop: 8 }}>Top 3 Available Spaces Right Now</div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: 4 }}>Updated 05:14 PM</div>
        </div>

        {/* Space Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 40 }}>
          {topSpaces.map(sp => (
            <div key={sp.rank} style={{
              background: "#fff", borderRadius: "16px", padding: "32px 22px 22px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)", textAlign: "center",
              position: "relative", marginTop: 22,
              transition: "box-shadow 0.2s, transform 0.2s"
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "none"; }}
            >
              {/* Rank Badge */}
              <div style={{
                position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
                width: 44, height: 44, borderRadius: "50%", background: "#fee2e2",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "15px", fontWeight: 900, color: RED,
                border: "3px solid #f8fafc", boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>#{sp.rank}</div>

              <div style={{ fontWeight: 900, fontSize: "20px", color: "#0f172a", marginBottom: 4 }}>{sp.name}</div>
              <div style={{
                fontSize: "12px", color: "#94a3b8", marginBottom: 18,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4
              }}>
                📍 {sp.location}
              </div>

              {/* Spots Available */}
              <div style={{
                background: "#f8fafc", borderRadius: "10px", padding: "12px 16px",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, marginBottom: 14
              }}>
                <span style={{ fontSize: "20px" }}>👥</span>
                <span style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a" }}>{sp.spots}</span>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>spots available</span>
              </div>

              {/* Progress Bar */}
              <div style={{ background: "#f1f5f9", borderRadius: "99px", height: "6px", marginBottom: 14 }}>
                <div style={{
                  width: sp.statusType === "plenty" ? "65%" : "40%",
                  height: "100%", background: "#22c55e", borderRadius: "99px"
                }} />
              </div>

              {/* Status Button */}
              <div style={{
                border: `1.5px solid ${sp.statusType === "plenty" ? "#86efac" : "#fde68a"}`,
                background: sp.statusType === "plenty" ? "#f0fdf4" : "#fefce8",
                color: sp.statusType === "plenty" ? "#16a34a" : "#d97706",
                borderRadius: "10px", padding: "10px", fontWeight: 700, fontSize: "14px",
                marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}>
                {sp.statusType === "plenty" ? "✓" : "○"} {sp.status}
              </div>

              {/* Directions */}
              <div style={{
                background: "#eff6ff", borderRadius: "8px", padding: "10px 14px",
                fontSize: "12px", color: "#3b82f6", fontWeight: 600,
                display: "flex", alignItems: "center", gap: 6
              }}>
                → {sp.direction}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="card" style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>Legend</div>
          <div style={{ display: "flex", gap: 40 }}>
            {[
              { icon: "✓", label: "Plenty of Space", sub: "50%+ capacity available", bg: "#f0fdf4", color: "#16a34a" },
              { icon: "○", label: "Filling Up", sub: "25–50% capacity available", bg: "#fefce8", color: "#d97706" },
              { icon: "⚠", label: "Busy", sub: "Less than 25% available", bg: "#fff7ed", color: "#ea580c" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "8px", background: l.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "16px", color: l.color, fontWeight: 900, flexShrink: 0
                }}>{l.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>{l.label}</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>{l.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

