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
 * Renders Mermaid diagram code as SVG. Handles flowcharts, processes,
 * sequence diagrams, and concept maps (mindmaps). Never throws — invalid
 * syntax is caught and shown as a plain-language message instead.
 *
 * data: { mermaidCode: string }
 */
function MermaidVisual({ data }) {
  const code = data?.mermaidCode || "";
  const idRef = useRef(`mermaid-visual-${++renderCount}`);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [svgMarkup, setSvgMarkup] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      if (!code.trim()) {
        setStatus("idle");
        setSvgMarkup("");
        return;
      }

      setStatus("loading");
      const renderId = `${idRef.current}-${Date.now()}`;

      try {
        const { svg } = await mermaid.render(renderId, code.trim());
        if (cancelled) return;
        setSvgMarkup(svg);
        setStatus("success");
      } catch (err) {
        // Mermaid can leave a detached error node in the DOM on failure.
        document.getElementById(renderId)?.remove();
        console.error("Mermaid diagram failed to render:", err);
        if (cancelled) return;
        setSvgMarkup("");
        setStatus("error");
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (status === "error") {
    return (
      <div className="visual-render-state visual-render-error">
        <p>Unable to display this visual.</p>
      </div>
    );
  }

  if (status !== "success") {
    return (
      <div className="visual-render-state visual-render-loading">
        <span className="visual-spinner" aria-hidden="true" />
        <p>Preparing visual explanation…</p>
      </div>
    );
  }

  return (
    <div
      className="mermaid-visual"
      // Mermaid returns sanitized, self-contained SVG markup (securityLevel:
      // "strict" strips script/click bindings), so this is safe to inject.
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}

export default MermaidVisual;
