const Loader = ({ label = "Loading..." }) => {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "24px 0",
      color: "var(--text-muted)",
      fontSize: 13,
    }}>
      <div className="pp-spinner" />
      {label}
    </div>
  );
};

export default Loader;