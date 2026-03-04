import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";
import "./CompareSpaces.css";

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

const monthlyData = [
  { m: "Jan", Quiet: 40, Collaborative: 25, Lab: 15, Social: 20 },
  { m: "Feb", Quiet: 60, Collaborative: 35, Lab: 20, Social: 28 },
  { m: "Mar", Quiet: 90, Collaborative: 55, Lab: 30, Social: 40 },
  { m: "Apr", Quiet: 130, Collaborative: 80, Lab: 45, Social: 58 },
  { m: "May", Quiet: 175, Collaborative: 105, Lab: 60, Social: 75 },
  { m: "Jun", Quiet: 210, Collaborative: 130, Lab: 75, Social: 90 },
  { m: "Jul", Quiet: 235, Collaborative: 145, Lab: 85, Social: 100 },
  { m: "Aug", Quiet: 200, Collaborative: 120, Lab: 70, Social: 85 },
  { m: "Sep", Quiet: 160, Collaborative: 95, Lab: 55, Social: 68 },
  { m: "Oct", Quiet: 110, Collaborative: 65, Lab: 38, Social: 48 },
  { m: "Nov", Quiet: 70, Collaborative: 42, Lab: 24, Social: 32 },
  { m: "Dec", Quiet: 45, Collaborative: 28, Lab: 16, Social: 22 },
];

const weeklyBar = [
  { day: "Mon", w1: 155, w2: 140, w3: 160, w4: 148 },
  { day: "Tue", w1: 175, w2: 165, w3: 180, w4: 170 },
  { day: "Wed", w1: 190, w2: 185, w3: 195, w4: 188 },
  { day: "Thu", w1: 170, w2: 160, w3: 175, w4: 165 },
  { day: "Fri", w1: 145, w2: 135, w3: 150, w4: 140 },
  { day: "Sat", w1: 90, w2: 85, w3: 95, w4: 88 },
];

const spacePerf = [
  { type: "Social", avgOcc: 72, cap: 110, util: 65, peak: "2–4 PM" },
  { type: "Quiet Zones", avgOcc: 145, cap: 180, util: 81, peak: "12–2 PM" },
  { type: "Computer Labs", avgOcc: 59, cap: 80, util: 73, peak: "11 AM–1 PM" },
  { type: "Collaborative Spaces", avgOcc: 32, cap: 40, util: 80, peak: "3–5 PM" },
];

function UtilBar({ val }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ background: "#fee2e2", borderRadius: "99px", height: "6px", width: 80, overflow: "hidden" }}>
        <div style={{ width: `${val}%`, height: "100%", background: RED, borderRadius: "99px" }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>{val}%</span>
    </div>
  );
}

export default function CompareSpaces() {
  const [animIn, setAnimIn] = useState(false);
  useEffect(() => { setTimeout(() => setAnimIn(true), 80); }, []);

  return (
    <div
      className="compare-spaces-page"
      style={{
        opacity: animIn ? 1 : 0,
        transform: animIn ? "none" : "translateY(12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Comparative Space Explorer</h1>
            <p style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0 0", fontWeight: 500 }}>Compare spaces across location, space type, and time periods for data-driven decisions</p>
          </div>
          <button style={{
            background: RED, color: "#fff", border: "none", borderRadius: "8px",
            padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer"
          }}>↓ Export Report</button>
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>▼ Comparison Filters</div>
          <div style={{ display: "flex", gap: 16 }}>
            {["Time Frame", "Location", "Space Type"].map(f => (
              <div key={f} style={{ flex: 1 }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>{f}</div>
                <select style={{
                  width: "100%", padding: "8px 12px", borderRadius: "8px",
                  border: "1.5px solid #e2e8f0", fontSize: "13px", color: "#64748b",
                  background: "#fff", cursor: "pointer"
                }}>
                  <option>Select {f.split(" ")[0]}</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Line Chart */}
        <div className="card" style={{ padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>Occupancy by Space Type – Monthly Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Quiet" stroke={RED} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Collaborative" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Lab" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Social" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 8 }}>
            {[["Quiet", RED], ["Collaborative", "#f59e0b"], ["Lab", "#22c55e"], ["Social", "#3b82f6"]].map(([l, c]) => (
              <span key={l} style={{ fontSize: "12px", color: c, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 16, height: 2.5, background: c, borderRadius: 2, display: "inline-block" }} />{l}
              </span>
            ))}
          </div>
        </div>

        {/* Performance Table */}
        <div className="card" style={{ padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b", marginBottom: 14 }}>Space Type Performance</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #f1f5f9" }}>
                {["Space Type", "Avg Occupancy", "Capacity", "Utilization Rate", "Peak Time"].map(h => (
                  <th key={h} style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700, padding: "8px 0", textAlign: "left", letterSpacing: "0.05em" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spacePerf.map(r => (
                <tr key={r.type} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "12px 0", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{r.type}</td>
                  <td style={{ padding: "12px 0", fontSize: "13px", color: "#64748b" }}>{r.avgOcc}</td>
                  <td style={{ padding: "12px 0", fontSize: "13px", color: "#64748b" }}>{r.cap}</td>
                  <td style={{ padding: "12px 0" }}><UtilBar val={r.util} /></td>
                  <td style={{ padding: "12px 0", fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>{r.peak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Weekly Bar Chart */}
        <div className="card" style={{ padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>Weekly Trend Comparison (Last 4 Weeks)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyBar} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="w1" name="Week 1" fill="#c0392b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="w2" name="Week 2" fill="#e57368" radius={[3, 3, 0, 0]} />
              <Bar dataKey="w3" name="Week 3" fill="#f09a94" radius={[3, 3, 0, 0]} />
              <Bar dataKey="w4" name="Week 4" fill="#fbc9c6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            {[["Week 1", "#c0392b"], ["Week 2", "#e57368"], ["Week 3", "#f09a94"], ["Week 4", "#fbc9c6"]].map(([l, c]) => (
              <span key={l} style={{ fontSize: "12px", color: c, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 12, height: 12, background: c, borderRadius: 3, display: "inline-block" }} />{l}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Highest Utilization", value: "Quiet Zones", sub: "80% average utilization", valueColor: RED },
            { label: "Peak Usage Time", value: "1–3 PM", sub: "Consistent across all floors", valueColor: "#0f172a" },
            { label: "Trend Direction", value: "↑ 8.2%", sub: "Compared to last month", valueColor: "#16a34a" },
          ].map(s => (
            <div key={s.label} className="card" style={{ flex: 1, padding: "18px 20px" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: s.valueColor, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

