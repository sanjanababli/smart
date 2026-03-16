import { useEffect, useState } from "react";
import { API } from "../../services/api";

export const AIInsightsCard = () => {
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(true);

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
    <div className="db-glass-panel" style={{ gridColumn: "1 / -1", marginBottom: "1.5rem", border: "1px solid rgba(167,139,250,0.4)" }}>
      <div className="db-panel-header" style={{ marginBottom: "0.5rem" }}>
        <div className="db-panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>✨</span> AI Business Insights
        </div>
      </div>
      <div className="db-panel-body" style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.95rem", lineHeight: "1.6" }}>
        {loading ? (
          <div style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>Analyzing your inventory and sales data...</div>
        ) : (
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{insights}</p>
        )}
      </div>
    </div>
  );
};
