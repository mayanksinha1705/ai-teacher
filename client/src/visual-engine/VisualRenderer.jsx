import { Suspense, lazy, useMemo } from "react";
import VisualErrorBoundary from "./VisualErrorBoundary.jsx";
import { getRendererForType } from "./visualRegistry.js";

// Mermaid and React Flow cover the two most common lesson subjects
// (programming/CS explanations lean heavily on flowcharts and diagrams),
// so they're bundled eagerly. The remaining renderers are real, separate
// libraries (Three.js, D3, p5, Cytoscape, JSXGraph) that a given lesson may
// never touch — those are dynamically imported on first use so students
// aren't paying to download WebGL/graphing code for a lesson that never
// needs it.
import MermaidVisual from "../components/visuals/MermaidVisual.jsx";
import ReactFlowVisual from "../components/visuals/ReactFlowVisual.jsx";

const JSXGraphVisual = lazy(() => import("../components/visuals/JSXGraphVisual.jsx"));
const ThreeVisual = lazy(() => import("../components/visuals/ThreeVisual.jsx"));
const D3Visual = lazy(() => import("../components/visuals/D3Visual.jsx"));
const P5Visual = lazy(() => import("../components/visuals/P5Visual.jsx"));
const CytoscapeVisual = lazy(() => import("../components/visuals/CytoscapeVisual.jsx"));

const RENDERER_COMPONENTS = {
  mermaid: MermaidVisual,
  reactflow: ReactFlowVisual,
  jsxgraph: JSXGraphVisual,
  three: ThreeVisual,
  d3: D3Visual,
  p5: P5Visual,
  cytoscape: CytoscapeVisual,
};

// Never expose the underlying library's own error message to the student —
// only a calm, plain-language sentence for the relevant renderer family.
const ERROR_MESSAGES = {
  mermaid: "Unable to display this visual.",
  reactflow: "Unable to display this diagram.",
  jsxgraph: "Unable to display this graph.",
  three: "Unable to load 3D visualization.",
  d3: "Unable to display this visualization.",
  p5: "Unable to load this simulation.",
  cytoscape: "Unable to display this graph.",
};

/**
 * Renders a planned visual using whichever library the registry maps its
 * type to. This is the only place in the app that needs to know all seven
 * visualization libraries exist — everything upstream just deals with a
 * plain { visualType, renderer, data } object, whether that object came
 * from visualPlanner.js (demo rules) or, later, from a real backend/LLM.
 */
function VisualRenderer({ visual }) {
  const rendererKey = useMemo(
    () => visual?.renderer || getRendererForType(visual?.visualType),
    [visual]
  );
  const Component = RENDERER_COMPONENTS[rendererKey];

  if (!visual || !Component) {
    return (
      <div className="visual-render-state visual-render-empty">
        <p>Visual explanation will appear here.</p>
      </div>
    );
  }

  return (
    <VisualErrorBoundary
      resetKey={`${rendererKey}-${visual.title}`}
      fallbackMessage={ERROR_MESSAGES[rendererKey]}
    >
      <Suspense
        fallback={
          <div className="visual-render-state visual-render-loading">
            <span className="visual-spinner" aria-hidden="true" />
            <p>Preparing visual explanation…</p>
          </div>
        }
      >
        <Component data={visual.data} title={visual.title} />
      </Suspense>
    </VisualErrorBoundary>
  );
}

export default VisualRenderer;
