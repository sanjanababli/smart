import { useEffect, useState } from "react";
import { API } from "../../services/api";

export const AIInsightsCard = () => {
  const [insights, setInsights] = useState("");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const { data } = await API.get("/ai/insights");
        setInsights(data.insights);
      } catch (e) {
        console.error("Failed to load AI insights", e);
        setInsights("Unable to load insights at this time.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  return (
    <div
      className="db-glass-panel"
      style={{
        gridColumn: "1 / -1",
        borderLeft: "3px solid var(--blue-500)",
        background: "var(--blue-50)",
        border: "1px solid var(--blue-100)",
        borderLeftWidth: 3,
        borderLeftColor: "var(--blue-500)",
      }}
    >
      <div className="db-panel-header" style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "var(--blue-500)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "#fff",
          }}>
            AI
          </div>
          <div className="db-panel-title" style={{ color: "var(--blue-800)" }}>
            AI Business Insights
          </div>
        </div>
      </div>

      <div style={{ color: "var(--blue-700)", fontSize: 13, lineHeight: 1.65 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)" }}>
            <div className="pp-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            Analyzing your inventory and sales data...
          </div>
        ) : (
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{insights}</p>
        )}
      </div>
    </div>
  );
};
