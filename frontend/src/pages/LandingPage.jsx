import { useEffect, useState } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const NAV_LINKS = ["Features", "Pricing", "About"];

const STATS = [
  { icon: "star", label: "4.9/5 by 500+ stores" },
  { icon: "sync", label: "Live sync in seconds" },
  { icon: "trial", label: "14-day free trial" },
];

const ICONS = {
  star: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--blue-500)" stroke="var(--blue-500)">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  sync: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--blue-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  trial: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--blue-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

const LandingPage = ({ setCurrentPage }) => {
  useDocumentTitle("StockSense — Track Smarter. Sell Faster.");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <div className="lp-root">
      <div className="lp-dot-grid" />

      {/* NAV — floating pill */}
      <div className="lp-nav-wrap">
        <nav className="lp-nav">
          <div className="lp-logo">
            <div className="lp-logo-icon">S</div>
            <span>StockSense</span>
          </div>

          <div className="lp-nav-links">
            {NAV_LINKS.map((link) => (
              <a key={link} href={`#${link.toLowerCase()}`} className="lp-nav-link">
                {link}
              </a>
            ))}
          </div>

          <div className="lp-nav-actions">
            <button className="lp-btn-ghost lp-hide-mobile" onClick={() => setCurrentPage("login")}>
              Log in
            </button>
            <button className="btn-primary lp-hide-mobile" onClick={() => setCurrentPage("register")}>
              Get Started
            </button>

            <button className="lp-menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ display: menuOpen ? "none" : "block" }}>
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ display: menuOpen ? "block" : "none" }}>
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* MOBILE MENU */}
      <div className={`lp-mobile-menu ${menuOpen ? "open" : ""}`}>
        {NAV_LINKS.map((link) => (
          <a key={link} href={`#${link.toLowerCase()}`} className="lp-mobile-link" onClick={() => setMenuOpen(false)}>
            {link}
          </a>
        ))}
        <div className="lp-mobile-actions">
          <button className="lp-btn-ghost" onClick={() => setCurrentPage("login")}>Log in</button>
          <button className="btn-primary" onClick={() => setCurrentPage("register")}>Get Started</button>
        </div>
      </div>

      {/* HERO */}
      <div className="lp-hero">
        <div className="lp-hero-left">
          <div className="lp-eyebrow">
            <span className="lp-eyebrow-dot" />
            Inventory · Billing · Sales — one dashboard
          </div>

          <h1 className="lp-title">
            Track smarter.<br />Sell <em>faster.</em>
          </h1>

          <p className="lp-subtitle">
            StockSense keeps stock, billing, and sales in sync — so you always
            know what's selling, what's running low, and what's next.
          </p>

          <div className="lp-cta-row">
            <button className="btn-primary lp-cta-primary" onClick={() => setCurrentPage("register")}>
              Get Started Free
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button className="lp-cta-secondary" onClick={() => setCurrentPage("login")}>
              I already have an account
            </button>
          </div>

          <div className="lp-stats-row">
            {STATS.map((s) => (
              <span className="lp-stat" key={s.label}>
                {ICONS[s.icon]}
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* SIGNATURE ELEMENT — stacked preview card */}
        <div className="lp-preview-stack">
          <div className="lp-card-back" />
          <div className="lp-card">
            <div className="lp-card-header">
              <span className="lp-live">
                <span className="lp-live-dot" />
                Live
              </span>
              <span className="lp-card-title">Today's overview</span>
            </div>

            <div className="lp-metrics">
              <div className="lp-metric lp-metric--accent">
                <span className="lp-metric-label">Revenue</span>
                <span className="lp-metric-value">₹12,480</span>
              </div>
              <div className="lp-metric">
                <span className="lp-metric-label">Low stock</span>
                <span className="lp-metric-value">5 items</span>
              </div>
            </div>

            <div className="lp-chart-box">
              <svg viewBox="0 0 240 80" width="100%" height="80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lpChartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--blue-500)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--blue-500)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline
                  points="0,80 0,58 40,48 80,53 120,32 160,37 200,16 240,22 240,80"
                  fill="url(#lpChartFill)"
                  stroke="none"
                />
                <polyline
                  points="0,58 40,48 80,53 120,32 160,37 200,16 240,22"
                  fill="none"
                  stroke="var(--blue-500)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="240" cy="22" r="4" fill="var(--blue-500)" />
              </svg>
            </div>

            <div className="lp-card-footer">Synced across every device — no refresh needed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
