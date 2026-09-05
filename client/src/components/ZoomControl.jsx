/**
 * Floating "whole page" zoom control - mimics the browser's own Ctrl/Cmd
 * +/- zoom, but as an always-visible in-app control so it's discoverable
 * without a keyboard shortcut. It scales literally everything (layout,
 * text, the docked/floating AI Teacher avatar, etc.) via the CSS `zoom`
 * property applied to <html> in App.jsx - not just the avatar - since
 * there's no reliable way to zoom only the third-party avatar widget's
 * cross-origin internals.
 *
 * Pinned to the bottom-left corner so it never collides with the AI
 * Teacher panel, which docks/floats on the right (see ".trugen-float"
 * in index.css).
 */
function ZoomControl({ zoom, min, max, step, onZoomIn, onZoomOut, onReset }) {
  const percent = Math.round(zoom * 100);

  return (
    <div className="zoom-control" role="group" aria-label="Page zoom">
      <button
        type="button"
        className="zoom-btn"
        onClick={onZoomOut}
        disabled={zoom <= min}
        aria-label="Zoom out"
        title="Zoom out"
      >
        −
      </button>

      <button
        type="button"
        className="zoom-readout"
        onClick={onReset}
        title="Reset zoom to 100%"
        aria-label={`Zoom level ${percent}%. Click to reset.`}
      >
        {percent}%
      </button>

      <button
        type="button"
        className="zoom-btn"
        onClick={onZoomIn}
        disabled={zoom >= max}
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
    </div>
  );
}

export default ZoomControl;
