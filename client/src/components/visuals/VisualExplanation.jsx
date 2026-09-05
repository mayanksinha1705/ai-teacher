import { useEffect, useRef, useState } from "react";
import VisualRenderer from "../../visual-engine/VisualRenderer.jsx";
import VisualToolbar from "./VisualToolbar.jsx";

const SUBJECT_LABELS = {
  mathematics: "Mathematics",
  physics: "Physics",
  programming: "Programming",
  "computer-science": "Computer Science",
  history: "History",
  biology: "Biology",
  general: "General",
};

/**
 * The classroom's visual canvas — sits alongside the TruGen avatar and
 * renders whatever diagram/graph/simulation the current lesson moment
 * calls for. This is the active teaching surface, not a decorative card:
 * title + subject label + the visual itself + a short explanation +
 * contextual controls.
 *
 * Props:
 *  - visual: { subject, visualType, renderer, title, description, data } | null
 *  - loading: boolean — true while the next lesson step (and its visual) is being prepared
 *  - compact: boolean — hide the panel's own title/badge header. Used inside
 *    TeachingStage, where a larger external heading already covers the title.
 */
function VisualExplanation({ visual, loading = false, compact = false }) {
  const canvasRef = useRef(null);
  const [resetNonce, setResetNonce] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // A fresh visual gets a fresh "session" — no stale zoom/camera state
  // carried over from whatever the student was looking at before.
  useEffect(() => {
    setResetNonce((n) => n + 1);
  }, [visual?.title, visual?.renderer]);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const handleReset = () => setResetNonce((n) => n + 1);

  const handleFullscreen = () => {
    if (!canvasRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      canvasRef.current.requestFullscreen?.();
    }
  };

  return (
    <div className="visual-explanation">
      {!compact && (
        <div className="visual-explanation-header">
          <div className="visual-explanation-heading">
            <span className="section-tag">VISUAL EXPLANATION</span>
            <h3 className="visual-title">{visual?.title || "Visual Explanation"}</h3>
          </div>
          <div className="visual-header-right">
            {visual?.subject && (
              <span className="visual-subject-badge">{SUBJECT_LABELS[visual.subject] || visual.subject}</span>
            )}
            <span className="visual-badge">AI-generated visual</span>
          </div>
        </div>
      )}

      <div ref={canvasRef} className={`visual-canvas ${isFullscreen ? "visual-canvas-fullscreen" : ""}`}>
        {loading ? (
          <div className="visual-render-state visual-render-loading">
            <span className="visual-spinner" aria-hidden="true" />
            <p>Preparing visual explanation…</p>
          </div>
        ) : visual ? (
          <VisualRenderer key={resetNonce} visual={visual} />
        ) : (
          <div className="visual-render-state visual-render-empty">
            <p>Visual explanation will appear here.</p>
          </div>
        )}

        {!loading && visual && (
          <VisualToolbar
            renderer={visual.renderer}
            onReset={handleReset}
            onFullscreen={handleFullscreen}
            isFullscreen={isFullscreen}
          />
        )}
      </div>

      {visual?.description && <p className="visual-explanation-text">{visual.description}</p>}
    </div>
  );
}

export default VisualExplanation;
