import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";

const DEMO_NETWORK = {
  nodes: [
    { id: "client", label: "Client Device" },
    { id: "router", label: "Router" },
    { id: "switch", label: "Switch" },
    { id: "server1", label: "Web Server" },
    { id: "server2", label: "Database Server" },
    { id: "internet", label: "Internet" },
  ],
  edges: [
    { source: "client", target: "router" },
    { source: "router", target: "switch" },
    { source: "switch", target: "server1" },
    { source: "switch", target: "server2" },
    { source: "router", target: "internet" },
  ],
};

/**
 * Interactive graphs: computer networks, knowledge graphs, entity
 * relationships. Draggable nodes, scroll-to-zoom (Cytoscape's own built-in
 * interaction model — no extra toolbar controls needed beyond fullscreen).
 *
 * data: { nodes?: [{id, label}], edges?: [{source, target, label?}], layout?: string }
 */
function CytoscapeVisual({ data }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    try {
      const nodes = data?.nodes?.length ? data.nodes : DEMO_NETWORK.nodes;
      const edges = data?.edges?.length ? data.edges : DEMO_NETWORK.edges;

      const cy = cytoscape({
        container,
        elements: [
          ...nodes.map((n) => ({ data: { id: n.id, label: n.label } })),
          ...edges.map((e, i) => ({
            data: { id: e.id || `e${i}`, source: e.source, target: e.target, label: e.label || "" },
          })),
        ],
        style: [
          {
            selector: "node",
            style: {
              "background-color": "#182030",
              "border-color": "#11e59e",
              "border-width": 2,
              label: "data(label)",
              color: "#ffffff",
              "font-size": 10,
              "text-valign": "bottom",
              "text-margin-y": 6,
              width: 34,
              height: 34,
            },
          },
          {
            selector: "edge",
            style: {
              width: 1.5,
              "line-color": "#11e59e",
              "target-arrow-color": "#11e59e",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              opacity: 0.75,
              label: "data(label)",
              color: "#94a3b8",
              "font-size": 9,
            },
          },
          {
            selector: "node:active",
            style: { "overlay-opacity": 0.15, "overlay-color": "#11e59e" },
          },
        ],
        layout: { name: data?.layout || "cose", animate: true, padding: 24 },
        minZoom: 0.4,
        maxZoom: 2.5,
      });

      cyRef.current = cy;
      setStatus("success");
    } catch (err) {
      console.error("Cytoscape render failed:", err);
      setStatus("error");
    }

    return () => {
      cyRef.current?.destroy();
      cyRef.current = null;
    };
  }, [data]);

  if (status === "error") {
    return (
      <div className="visual-render-state visual-render-error">
        <p>Unable to display this graph.</p>
      </div>
    );
  }

  return (
    <div className="cytoscape-visual">
      <div ref={containerRef} className="cytoscape-canvas-wrap" />
      {status === "loading" && (
        <div className="visual-render-state visual-render-loading visual-render-overlay">
          <span className="visual-spinner" aria-hidden="true" />
          <p>Preparing visual explanation…</p>
        </div>
      )}
    </div>
  );
}

export default CytoscapeVisual;
