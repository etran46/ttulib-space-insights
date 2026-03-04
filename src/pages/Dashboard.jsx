import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./Dashboard.css";

const occupancyData = [
  { time: "1 PM", occupancy: 380 }, { time: "2 PM", occupancy: 370 },
  { time: "3 PM", occupancy: 340 }, { time: "4 PM", occupancy: 330 },
  { time: "5 PM", occupancy: 345 }, { time: "6 PM", occupancy: 360 },
  { time: "7 PM", occupancy: 355 }, { time: "8 PM", occupancy: 310 },
  { time: "9 PM", occupancy: 300 }, { time: "10 PM", occupancy: 330 },
  { time: "11 PM", occupancy: 335 },
];

const locations = [
  { name: "Main Floor", current: 142, capacity: 449, status: "Available", color: "#22c55e" },
  { name: "9th Floor Arch Lib", current: 63, capacity: 75, status: "Near Capacity", color: "#ef4444" },
  { name: "Stacks 5", current: 233, capacity: 311, status: "Moderate", color: "#f59e0b" },
  { name: "Croslin", current: 87, capacity: 125, status: "Moderate", color: "#f59e0b" },
  { name: "Mezzanine", current: 75, capacity: 116, status: "Moderate", color: "#f59e0b" },
  { name: "Public Spaces", current: 32, capacity: 109, status: "Available", color: "#22c55e" },
];

function StatusBadge({ status }) {
  const map = {
    Available: { bg: "#dcfce7", color: "#16a34a" },
    "Near Capacity": { bg: "#fee2e2", color: "#dc2626" },
    Moderate: { bg: "#fef9c3", color: "#ca8a04" },
  };
  const s = map[status] || map.Available;
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: "11px", fontWeight: 700,
      padding: "2px 10px", borderRadius: "20px"
    }}>{status}</span>
  );
}

function OccBar({ pct, color }) {
  return (
    <div style={{ background: "#f1f5f9", borderRadius: "99px", height: "7px", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "99px" }} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#1e293b", color: "#fff", padding: "8px 14px",
        borderRadius: "8px", fontSize: "12px", fontWeight: 600,
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)"
      }}>
        <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: 3 }}>{label}</div>
        <div>{payload[0].value} occupants</div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [animIn, setAnimIn] = useState(false);
  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  return (
    <div
      className="dashboard-page"
      style={{
        opacity: animIn ? 1 : 0,
        transform: animIn ? "none" : "translateY(12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Library Occupancy Dashboard</h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0 0", fontWeight: 500 }}>Real-time occupancy monitoring across all locations</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Occupancy", value: "211", sub: "of 1963 capacity", icon: "👥", bg: "#eff6ff" },
            { label: "Capacity Used", value: "69%", sub: "↗ Within limits", subC: "#16a34a", icon: "📈", bg: "#f0fdf4" },
            { label: "Available Spots", value: "1752", sub: "across all areas", icon: "✅", bg: "#faf5ff" },
            { label: "High Capacity Areas", value: "1", sub: "need attention", subC: "#ef4444", icon: "⚠️", bg: "#fff7ed" },
          ].map(s => (
            <div
              key={s.label}
              className="card"
              style={{
                flex: 1,
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: "30px", fontWeight: 800, color: "#1e293b", lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: "12px", color: s.subC || "#64748b", marginTop: 4, fontWeight: 500 }}>{s.sub}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: "10px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 28 }}>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b", marginBottom: 20 }}>Live Occupancy Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={occupancyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 530]} ticks={[0, 150, 300, 530]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="occupancy" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, gap: 6, alignItems: "center" }}>
            <span style={{ width: 20, height: 2.5, background: "#3b82f6", borderRadius: 2, display: "inline-block" }} />
            <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 600 }}>Total Occupancy</span>
          </div>
        </div>

        {/* Location Grid */}
        <div>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>Location Status</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {locations.map(loc => {
              const pct = Math.round((loc.current / loc.capacity) * 100);
              return (
                <div
                  key={loc.name}
                  className="card"
                  style={{
                    padding: "18px 20px",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>📍 {loc.name}</span>
                    <StatusBadge status={loc.status} />
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: 12 }}>{loc.current} / {loc.capacity} people</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Occupancy</span>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>{pct}%</span>
                  </div>
                  <OccBar pct={pct} color={loc.color} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

