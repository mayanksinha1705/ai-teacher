import { useEffect, useState } from "react";
import { checkHealth } from "../api.js";

function Header() {
  const [engine, setEngine] = useState({ state: "checking", model: null });

  useEffect(() => {
    let cancelled = false;
    checkHealth()
      .then((res) => {
        if (!cancelled) setEngine({ state: "online", model: res.ollamaModel });
      })
      .catch(() => {
        if (!cancelled) setEngine({ state: "offline", model: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const statusLabel =
    engine.state === "online"
      ? `Engine online · ${engine.model}`
      : engine.state === "offline"
      ? "Engine offline"
      : "Checking engine…";

  return (
    <header className="nav">
      <div className="nav-brand">
        <div className="nav-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16 4 5 10l11 6 11-6-11-6Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 14.5V21c0 1.4 3 3.3 6.5 3.3S22.5 22.4 22.5 21v-6.5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="nav-wordmark">AI Teacher</span>
        <span className="nav-badge">PROTOTYPE</span>
      </div>

      <div className={`engine-pill engine-${engine.state}`}>
        <span className="engine-dot" />
        {statusLabel}
      </div>
    </header>
  );
}

export default Header;
