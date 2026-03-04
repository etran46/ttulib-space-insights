const NAV_ITEMS = ["Dashboard", "Underutilized", "CompareSpaces", "Historical", "PatronGuidance"];
const RED = "#c0392b";

export default function Header({ active, onNavigate }) {
  return (
    <div
      style={{
        background: "#fff",
        borderBottom: "1.5px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        height: 60,
        gap: 32,
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "8px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/Texas_Tech_Athletics_logo.svg"
            alt="Texas Tech logo"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: "14px",
              color: "#1e293b",
              lineHeight: 1.2,
            }}
          >
            Texas Tech Libraries
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: 500,
            }}
          >
            Occupancy Analytics
          </div>
        </div>
      </div>
      <nav style={{ display: "flex", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const labelMap = {
            CompareSpaces: "Compare Spaces",
            PatronGuidance: "Patron Guidance",
          };
          const label = labelMap[item] || item;
          return (
          <button
            key={item}
            type="button"
            onClick={() => onNavigate && onNavigate(item)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 600,
              color: active === item ? RED : "#64748b",
              borderBottom:
                active === item ? `2.5px solid ${RED}` : "2.5px solid transparent",
              borderRadius: 0,
              marginBottom: "-1.5px",
            }}
          >
            {label}
          </button>
        )})}
      </nav>
    </div>
  );
}

