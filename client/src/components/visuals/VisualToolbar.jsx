// Generic controls that apply across every renderer live here: fullscreen
// (always available) and reset (remounts the visual — meaningless for a
// static Mermaid diagram, so hidden for that renderer). Renderer-specific
// interactions (React Flow's own pan/zoom controls, JSXGraph's built-in
// navigation buttons, p5's play/pause) live inside their own components,
// since duplicating them here would just be two sets of controls doing the
// same thing.
function VisualToolbar({ renderer, onReset, onFullscreen, isFullscreen }) {
  const showReset = renderer && renderer !== "mermaid";

  return (
    <div className="visual-toolbar">
      {showReset && (
        <button type="button" className="visual-toolbar-button" onClick={onReset} title="Reset">
          ↻
        </button>
      )}
      <button
        type="button"
        className="visual-toolbar-button"
        onClick={onFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? "⤢" : "⛶"}
      </button>
    </div>
  );
}

export default VisualToolbar;
