import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
import "./Historical.css";

const RED = "#c0392b";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#1e293b", color: "#fff", padding: "8px 14px",
        borderRadius: "8px", fontSize: "12px", fontWeight: 600,
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)"
      }}>
        <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: 3 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
        ))}
      </div>
    );
  }
  return null;
};

const semesterData = Array.from({ length: 30 }, (_, i) => ({
  date: `Jan ${i + 1}`,
  occ: Math.round(80 + i * 14 + Math.sin(i * 0.4) * 30),
}));

const multiYear = [
  { m: "Jan", y2024: 180, y2025: 200, y2026: 220 },
  { m: "Feb", y2024: 240, y2025: 260, y2026: 285 },
  { m: "Mar", y2024: 310, y2025: 335, y2026: 360 },
  { m: "Apr", y2024: 370, y2025: 390, y2026: 415 },
  { m: "May", y2024: 410, y2025: 435, y2026: 460 },
  { m: "Jun", y2024: 350, y2025: 375, y2026: 395 },
  { m: "Jul", y2024: 290, y2025: 315, y2026: null },
  { m: "Aug", y2024: 330, y2025: 355, y2026: null },
  { m: "Sep", y2024: 380, y2025: 400, y2026: null },
  { m: "Oct", y2024: 420, y2025: 445, y2026: null },
  { m: "Nov", y2024: 390, y2025: 410, y2026: null },
  { m: "Dec", y2024: 270, y2025: 290, y2026: null },
];

const seasonal = [
  { period: "Start of Semester", avg: 305, growth: "+15%", growthPos: true },
  { period: "Mid-Semester", avg: 425, growth: "+39%", growthPos: true },
  { period: "Finals Period", avg: 510, growth: "+20%", growthPos: true },
  { period: "Break Periods", avg: 195, growth: "-62%", growthPos: false },
];

export default function Historical() {
  const [animIn, setAnimIn] = useState(false);
  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  return (
    <div
      className="historical-page"
      style={{
        opacity: animIn ? 1 : 0,
        transform: animIn ? "none" : "translateY(12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Historical Usage Analytics</h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0 0", fontWeight: 500 }}>Long-term trends aligned with Texas Tech academic calendar for strategic planning</p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Current Semester", value: "Spring 2026", sub: "Jan 13 – May 3", icon: "📅", bg: "#eff6ff" },
            { label: "YoY Growth", value: "+12.4%", sub: "vs. Spring 2025", icon: "📈", bg: "#f0fdf4", valueColor: "#16a34a" },
            { label: "Finals Week Peak", value: "520", sub: "avg daily occupancy", icon: "🏆", bg: "#fff7ed" },
            { label: "Data Points", value: "2,856", sub: "hours analyzed", icon: "🗃", bg: "#faf5ff" },
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
                <div style={{ fontSize: "20px", fontWeight: 900, color: s.valueColor || "#0f172a" }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: 2 }}>{s.sub}</div>
              </div>
              <div style={{ width: 36, height: 36, background: s.bg, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Semester Area Chart */}
        <div className="card" style={{ padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b" }}>Semester Analysis</div>
            <select style={{ border: "1.5px solid #e2e8f0", borderRadius: "8px", padding: "5px 10px", fontSize: "12px" }}>
              <option>Spring 2026: Jan 14, 2026 – May 5, 2026</option>
            </select>
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: 14 }}>
            Grid includes regular mid-terms, break periods, and finals weeks aligned with TTU calendar
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={semesterData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={RED} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={RED} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="occ" stroke={RED} strokeWidth={2.5} fill="url(#redGrad)" dot={false} name="Avg Daily Occupancy" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 6 }}>
            {[["Avg Daily Occupancy", RED], ["Library Events", "#f59e0b"]].map(([l, c]) => (
              <span key={l} style={{ fontSize: "12px", color: c, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 16, height: 2.5, background: c, borderRadius: 2, display: "inline-block" }} />{l}
              </span>
            ))}
          </div>
        </div>

        {/* Multi-Year Line */}
        <div className="card" style={{ padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>Multi-Year Monthly Comparison (2024–2026)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={multiYear} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="y2024" name="2024" stroke="#fca5a5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="y2025" name="2025" stroke="#f87171" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="y2026" name="2026" stroke={RED} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            {[["2024", "#fca5a5"], ["2025", "#f87171"], ["2026", RED]].map(([l, c]) => (
              <span key={l} style={{ fontSize: "12px", color: c, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 16, height: 2.5, background: c, borderRadius: 2, display: "inline-block" }} />{l}
              </span>
            ))}
          </div>
        </div>

        {/* Seasonal Table */}
        <div className="card" style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>Seasonal Usage Patterns</div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: 14 }}>Average occupancy by semester phase</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #f1f5f9" }}>
                {["Semester Period", "Average Occupancy", "Growth vs Previous Period", "Visualization"].map(h => (
                  <th key={h} style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700, padding: "6px 0", textAlign: "left", letterSpacing: "0.04em" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {seasonal.map(r => (
                <tr key={r.period} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "13px 0", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{r.period}</td>
                  <td style={{ padding: "13px 0", fontSize: "13px", color: "#64748b" }}>{r.avg}</td>
                  <td style={{ padding: "13px 0", fontSize: "13px", fontWeight: 700, color: r.growthPos ? "#16a34a" : "#ef4444" }}>{r.growth}</td>
                  <td style={{ padding: "13px 0" }}>
                    <div style={{ background: "#f1f5f9", borderRadius: "99px", height: "6px", width: 120, overflow: "hidden" }}>
                      <div style={{ width: `${(r.avg / 510) * 100}%`, height: "100%", background: RED, borderRadius: "99px" }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

