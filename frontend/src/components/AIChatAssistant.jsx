import { useEffect, useRef, useState } from "react";
import { API } from "../services/api";

export const AIChatAssistant = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hello! I am your AI Business Assistant. Ask me anything about your inventory, sales, or restocking needs.",
    },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    try {
      const { data } = await API.post("/ai/chat", { message: userMessage });
      setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      const msg = error.response?.data?.error || "Sorry, I could not process that right now. Please try again.";
      setMessages((prev) => [...prev, { role: "ai", content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      width: 360,
      height: 500,
      background: "var(--surface-1)",
      border: "1px solid var(--surface-3)",
      borderRadius: 20,
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 16px 48px rgba(10,22,40,0.16)",
      zIndex: 1000,
      overflow: "hidden",
    }}>

      {/* HEADER */}
      <div style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--surface-3)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "var(--blue-500)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff",
          }}>
            AI
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none", borderRadius: 8,
            width: 28, height: 28,
            color: "#fff", cursor: "pointer",
            fontSize: 16, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontWeight: 700, lineHeight: 1,
          }}
        >
          &times;
        </button>
      </div>

      {/* MESSAGES */}
      <div style={{
        flex: 1, overflowY: "auto", padding: 16,
        display: "flex", flexDirection: "column", gap: 10,
        background: "var(--surface-2)",
      }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? "var(--blue-500)" : "var(--surface-1)",
              color: m.role === "user" ? "#fff" : "var(--text-primary)",
              padding: "10px 14px",
              borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              border: m.role === "user" ? "none" : "1px solid var(--surface-3)",
              maxWidth: "84%",
              fontSize: 13,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              boxShadow: "0 1px 4px rgba(10,22,40,0.06)",
            }}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: "flex-start",
            background: "var(--surface-1)",
            border: "1px solid var(--surface-3)",
            padding: "10px 14px",
            borderRadius: "14px 14px 14px 4px",
            fontSize: 12,
            color: "var(--text-muted)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div className="pp-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            Thinking...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <form
        onSubmit={handleSend}
        style={{
          padding: "12px 14px",
          borderTop: "1px solid var(--surface-3)",
          display: "flex",
          gap: 8,
          background: "var(--surface-1)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          style={{
            flex: 1,
            background: "var(--surface-2)",
            border: "1.5px solid var(--surface-3)",
            borderRadius: 10,
            padding: "9px 14px",
            color: "var(--text-primary)",
            fontSize: 13,
            outline: "none",
            transition: "border-color 0.18s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--blue-400)")}
          onBlur={(e)  => (e.target.style.borderColor = "var(--surface-3)")}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "var(--blue-500)",
            border: "none",
            borderRadius: 10,
            padding: "0 16px",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
            fontSize: 13,
            opacity: loading ? 0.6 : 1,
            transition: "opacity 0.15s, background 0.15s",
            whiteSpace: "nowrap",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};