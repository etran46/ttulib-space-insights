import { useState, useEffect } from "react";
import "./Underutilized.css";

const RED = "#c0392b";

const underutilized = [
  {
    name: "Basement Southside", location: "Main University Library", pct: 5,
    capacity: 395, avgOcc: 5, wasted: 95, trend: "declining", trendColor: "#ef4444",
    savings: "$12,000/year in operational cost", weekly: [4, 3, 5, 4, 2, 3, 4]
  },
  {
    name: "Stacks 5", location: "Main University Library West Wing", pct: 7,
    capacity: 311, avgOcc: 7, wasted: 93, trend: "stable", trendColor: "#f59e0b",
    savings: "$18,500/year in operational costs", weekly: [10, 8, 11, 9, 7, 8, 9]
  },
  {
    name: "Room 132", location: "Main University – Library First Floor", pct: 12,
    capacity: 40, avgOcc: 12, wasted: 88, trend: "declining", trendColor: "#ef4444",
    savings: "$8,000/year in operational costs", weekly: [7, 5, 6, 5, 4, 5, 4]
  },
  {
    name: "Public Spaces", location: "4th Floor", pct: 12,
    capacity: 109, avgOcc: 12, wasted: 88, trend: "stable", trendColor: "#f59e0b",
    savings: "$15,000/year in operational cost", weekly: [13, 10, 14, 12, 11, 12, 10]
  },
];

function MiniBar({ vals }) {
  const max = Math.max(...vals);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 32 }}>
        {vals.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              width: "100%", height: `${(v / max) * 24}px`,
              background: "#fca5a5", borderRadius: "3px 3px 0 0"
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: "9px", color: "#94a3b8" }}>{d.slice(0, 3)}</div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {vals.map((v, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: "9px", color: "#94a3b8" }}>{v}</div>
        ))}
      </div>
    </div>
  );
}

export default function Underutilized() {
  const [animIn, setAnimIn] = useState(false);
  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  return (
    <div
      className="underutilized-page"
      style={{
        opacity: animIn ? 1 : 0,
        transform: animIn ? "none" : "translateY(12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Underutilized Space Identifier</h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0 0", fontWeight: 500 }}>Spaces below 20% utilization threshold – opportunities for optimization</p>
        </div>

        {/* Top Stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Flagged Spaces", value: "4", sub: "Below threshold", icon: "🚩", bg: "#fff7ed" },
            { label: "Total Wasted Capacity", value: "795", sub: "seats/spots available", icon: "📊", bg: "#eff6ff" },
            { label: "Analysis Period", value: "8", sub: "weeks analyzed", icon: "🔍", bg: "#f0fdf4" },
            { label: "Potential Savings", value: "$54K", sub: "per year", icon: "💰", bg: "#f0fdf4", valueColor: "#16a34a" },
          ].map(s => (
            <div
              key={s.label}
              className="card"
              style={{
                flex: 1,
                padding: "18px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: "26px", fontWeight: 900, color: s.valueColor || "#0f172a" }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: 2 }}>{s.sub}</div>
              </div>
              <div style={{ width: 36, height: 36, background: s.bg, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Space Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {underutilized.map(sp => (
            <div key={sp.name} className="card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "15px" }}>📍</span>
                    <span style={{ fontWeight: 800, fontSize: "16px", color: "#0f172a" }}>{sp.name}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginLeft: 23, marginTop: 2 }}>{sp.location}</div>
                </div>
                <span style={{
                  background: "#fff7ed", color: "#ea580c", fontSize: "11px",
                  fontWeight: 700, padding: "3px 10px", borderRadius: "20px"
                }}>⚠ {sp.pct}% Utilized</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Capacity", value: sp.capacity },
                  { label: "Avg Occupancy", value: `${sp.avgOcc}%`, color: "#ef4444" },
                  { label: "Wasted Capacity", value: `${sp.wasted}%`, color: "#ef4444" },
                  { label: "Trend", value: sp.trend === "declining" ? "↓ declining" : "→ stable", color: sp.trendColor },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: 3 }}>{m.label}</div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: m.color || "#0f172a" }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginBottom: 8 }}>Weekly Usage Pattern</div>
                <MiniBar vals={sp.weekly} />
              </div>

              <div style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a" }}>Potential Savings: {sp.savings}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

