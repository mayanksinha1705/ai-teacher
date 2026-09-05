import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

// Configured once per app load. Uses explicit hex values (not CSS vars —
// Mermaid bakes these into the SVG it generates) matched to the app's
// existing dark "Obsidian Intelligence" palette so diagrams feel native
// rather than bolted on.
mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "strict", // diagram code may eventually come from an LLM; never allow script/click injection
  fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
  themeVariables: {
    darkMode: true,
    background: "#111620",
    primaryColor: "#182030",
    primaryTextColor: "#ffffff",
    primaryBorderColor: "#11e59e",
    lineColor: "#11e59e",
    secondaryColor: "#1d2530",
    secondaryTextColor: "#cbd5e1",
    tertiaryColor: "#083e2d",
    tertiaryTextColor: "#cbd5e1",
    textColor: "#cbd5e1",
    mainBkg: "#182030",
    nodeBorder: "#11e59e",
    clusterBkg: "#1d2530",
    clusterBorder: "rgba(255,255,255,0.14)",
    edgeLabelBackground: "#111620",
    fontSize: "14px",
  },
});

let renderCount = 0;

/**
 * Renders Mermaid diagram code as SVG. Never throws — invalid syntax is
 * caught and surfaced through onError instead of crashing the app.
 *
 * Props:
 *  - code: Mermaid diagram source (string)
 *  - onStateChange: optional callback("loading" | "success" | "error")
 */
function MermaidDiagram({ code, onStateChange }) {
  const containerRef = useRef(null);
  const idRef = useRef(`mermaid-diagram-${++renderCount}`);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [svgMarkup, setSvgMarkup] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      if (!code || !code.trim()) {
        setStatus("idle");
        setSvgMarkup("");
        return;
      }

      setStatus("loading");
      onStateChange?.("loading");

      // Unique id per attempt so Mermaid never collides with a previous
      // (possibly still-mounted) render of the same component instance.
      const renderId = `${idRef.current}-${Date.now()}`;

      try {
        const { svg } = await mermaid.render(renderId, code.trim());
        if (cancelled) return;
        setSvgMarkup(svg);
        setStatus("success");
        onStateChange?.("success");
      } catch (err) {
        // Mermaid can leave a detached error node in the DOM on failure —
        // clean it up so it doesn't leak outside our component.
        document.getElementById(renderId)?.remove();
        console.error("Mermaid diagram failed to render:", err);
        if (cancelled) return;
        setSvgMarkup("");
        setStatus("error");
        onStateChange?.("error");
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (status === "error") {
    return (
      <div className="mermaid-diagram mermaid-state mermaid-state-error">
        <p>Couldn't generate this visual. Continuing with the lesson.</p>
      </div>
    );
  }

  if (status === "idle") {
    return (
      <div className="mermaid-diagram mermaid-state mermaid-state-empty">
        <p>Visual explanation will appear here.</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mermaid-diagram mermaid-state mermaid-state-loading">
        <span className="mermaid-spinner" aria-hidden="true" />
        <p>Preparing visual explanation…</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-diagram mermaid-diagram-success"
      // Mermaid returns sanitized, self-contained SVG markup (securityLevel:
      // "strict" strips script/click bindings), so this is safe to inject.
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}

export default MermaidDiagram;
