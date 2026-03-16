import { useState, useRef, useEffect } from "react";
import { API } from "../services/api";

export const AIChatAssistant = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I am your AI Business Assistant. Ask me anything about your inventory, sales, or restocking needs." }
  ]);
  const [input, setInput] = useState("");
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
      const errorMsg = error.response?.data?.error || "Sorry, I couldn't process that right now. Please try again later.";
      setMessages((prev) => [...prev, { role: "ai", content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", bottom: "20px", right: "20px", width: "360px", height: "500px",
      background: "rgba(20, 25, 35, 0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(167,139,250,0.5)",
      borderRadius: "16px", display: "flex", flexDirection: "column", boxShadow: "0 10px 40px rgba(0,0,0,0.6)", zIndex: 1000
    }}>
      <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(167,139,250,0.1)", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>✨ AI Assistant</h3>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.5rem", lineHeight: 1 }}>&times;</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            background: m.role === "user" ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.1)",
            padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)",
            maxWidth: "85%", color: "rgba(255,255,255,0.95)", fontSize: "0.9rem", lineHeight: "1.5", whiteSpace: "pre-wrap"
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", fontStyle: "italic" }}>AI is typing...</div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "8px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "10px 14px", color: "#fff", outline: "none" }}
        />
        <button type="submit" disabled={loading} style={{
          background: "rgba(167,139,250,0.8)", border: "none", borderRadius: "8px", padding: "0 16px", color: "#fff", cursor: "pointer", fontWeight: "bold",
          opacity: loading ? 0.7 : 1
        }}>
          Send
        </button>
      </form>
    </div>
  );
};
