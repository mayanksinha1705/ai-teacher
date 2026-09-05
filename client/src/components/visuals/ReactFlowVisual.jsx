import { useMemo } from "react";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

/**
 * Interactive node-and-edge diagrams: architecture, algorithms, data
 * structures, concept maps. Pan/zoom/fit controls are React Flow's own
 * built-in UI — no need to duplicate them in the outer toolbar.
 *
 * data: { nodes: [{id, data:{label}, position:{x,y}, style?}],
 *         edges: [{id?, source, target, label?, animated?}] }
 */
function ReactFlowVisual({ data }) {
  const rawNodes = data?.nodes || [];
  const rawEdges = data?.edges || [];

  const nodes = useMemo(
    () =>
      rawNodes.map((n) => ({
        ...n,
        style: {
          background: "#182030",
          color: "#ffffff",
          border: "1px solid #11e59e",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: 12.5,
          fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          ...n.style,
        },
      })),
    [rawNodes]
  );

  const edges = useMemo(
    () =>
      rawEdges.map((e, i) => ({
        id: e.id || `edge-${i}`,
        ...e,
        animated: e.animated ?? false,
        style: { stroke: "#11e59e", strokeWidth: 1.5, ...e.style },
        labelStyle: { fill: "#cbd5e1", fontSize: 10.5 },
        labelBgStyle: { fill: "#111620" },
      })),
    [rawEdges]
  );

  if (!nodes.length) {
    return (
      <div className="visual-render-state visual-render-empty">
        <p>Visual explanation will appear here.</p>
      </div>
    );
  }

  return (
    <div className="reactflow-visual">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        zoomOnScroll
        minZoom={0.3}
        maxZoom={2}
      >
        <Background color="rgba(255,255,255,0.06)" gap={18} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export default ReactFlowVisual;
