import { useEffect, useState } from "react";
import MermaidDiagram from "./MermaidDiagram.jsx";
import { SUPPORTED_VISUAL_TYPES } from "../utils/visualPlanner.js";

const MERMAID_TYPES = new Set(SUPPORTED_VISUAL_TYPES);
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.2;

/**
 * The classroom's visual canvas — sits alongside the TruGen avatar and
 * renders whatever diagram the current lesson moment calls for.
 *
 * Props:
 *  - visual: { type, title, mermaidCode, explanation } | null
 *  - loading: boolean — true while the next lesson step (and its visual) is being prepared
 */
function VisualExplanation({ visual, loading = false }) {
  const [zoom, setZoom] = useState(1);

  // Reset zoom whenever the diagram itself changes, so switching concepts
  // doesn't leave the student staring at a stale zoom level.
  useEffect(() => {
    setZoom(1);
  }, [visual?.mermaidCode]);

  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
  const resetZoom = () => setZoom(1);

  const isMermaidType = visual && MERMAID_TYPES.has(visual.type);

  return (
    <div className="visual-explanation">
      <div className="visual-explanation-header">
        <div className="visual-explanation-heading">
          <span className="section-tag">VISUAL EXPLANATION</span>
          <h3 className="visual-title">{visual?.title || "Visual Explanation"}</h3>
        </div>
        <span className="visual-badge">AI-generated visual</span>
      </div>

      {loading && (
        <div className="mermaid-diagram mermaid-state mermaid-state-loading">
          <span className="mermaid-spinner" aria-hidden="true" />
          <p>Preparing visual explanation…</p>
        </div>
      )}

      {!loading && !visual && (
        <div className="mermaid-diagram mermaid-state mermaid-state-empty">
          <p>Visual explanation will appear here.</p>
        </div>
      )}

      {!loading && visual && (
        <>
          <div className="visual-canvas">
            {isMermaidType ? (
              <div className="visual-zoom-wrap" style={{ "--visual-zoom": zoom }}>
                <MermaidDiagram code={visual.mermaidCode} />
              </div>
            ) : (
              <div className="mermaid-diagram mermaid-state mermaid-state-empty">
                <p>This visual type isn't supported yet.</p>
              </div>
            )}
          </div>

          {isMermaidType && (
            <div className="visual-controls">
              <button type="button" className="zoom-button" onClick={zoomOut} aria-label="Zoom out">
                −
              </button>
              <span className="zoom-level">{Math.round(zoom * 100)}%</span>
              <button type="button" className="zoom-button" onClick={zoomIn} aria-label="Zoom in">
                +
              </button>
              <button type="button" className="zoom-reset" onClick={resetZoom}>
                Reset
              </button>
            </div>
          )}

          {visual.explanation && <p className="visual-explanation-text">{visual.explanation}</p>}
        </>
      )}
    </div>
  );
}

export default VisualExplanation;
