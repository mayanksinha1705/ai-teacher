import { useEffect, useRef, useState } from "react";
import p5 from "p5";

/**
 * An animated 2D simulation (currently: projectile motion under gravity).
 * Self-contained play/pause/reset controls, since this is the one visual
 * type where "reset" means something different (restart the animation
 * clock) than a generic remount would give you.
 *
 * data: { mode: "projectile", gravity?: number, velocity?: number, angle?: number }
 */
function P5Visual({ data }) {
  const containerRef = useRef(null);
  const sketchRef = useRef(null);
  const playingRef = useRef(true);
  const [status, setStatus] = useState("loading");
  const [isPlaying, setIsPlaying] = useState(true);
  const [resetTick, setResetTick] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const gravity = data?.gravity ?? 9.8;
    const velocity = data?.velocity ?? 20;
    const angleDeg = data?.angle ?? 45;

    try {
      const sketch = (p) => {
        const pxPerMeter = 7;
        const angleRad = (angleDeg * Math.PI) / 180;
        const vx = velocity * Math.cos(angleRad);
        const vy = velocity * Math.sin(angleRad);
        let t = 0;
        let trail = [];
        const groundY = () => p.height - 28;

        p.setup = () => {
          const w = container.clientWidth || 400;
          p.createCanvas(w, 280);
        };

        p.draw = () => {
          p.background(17, 22, 32);
          p.stroke(38, 51, 70);
          p.strokeWeight(1);
          p.line(0, groundY(), p.width, groundY());

          if (playingRef.current) {
            t += 0.016 * 1.6;
          }

          const x = vx * t * pxPerMeter;
          const y = vy * t * pxPerMeter - 0.5 * gravity * t * t * pxPerMeter;
          const drawX = 30 + x;
          const drawY = groundY() - y;

          if (drawY <= groundY() && drawX < p.width - 10) {
            if (playingRef.current) trail.push([drawX, drawY]);
          } else {
            t = 0;
            trail = [];
          }

          p.noFill();
          p.stroke(17, 229, 158, 130);
          p.strokeWeight(2);
          p.beginShape();
          trail.forEach(([px, py]) => p.vertex(px, py));
          p.endShape();

          p.noStroke();
          p.fill(17, 229, 158);
          p.circle(drawX, Math.min(drawY, groundY()), 12);

          p.fill(203, 213, 225);
          p.textSize(11);
          p.text(`v = ${velocity} m/s   angle = ${angleDeg}°   g = ${gravity} m/s²`, 12, 18);
        };
      };

      sketchRef.current = new p5(sketch, container);
      setStatus("success");
    } catch (err) {
      console.error("p5 sketch failed:", err);
      setStatus("error");
    }

    return () => {
      sketchRef.current?.remove();
      sketchRef.current = null;
    };
  }, [data, resetTick]);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  if (status === "error") {
    return (
      <div className="visual-render-state visual-render-error">
        <p>Unable to load this simulation.</p>
      </div>
    );
  }

  return (
    <div className="p5-visual">
      <div ref={containerRef} className="p5-canvas-wrap" />
      {status === "loading" && (
        <div className="visual-render-state visual-render-loading visual-render-overlay">
          <span className="visual-spinner" aria-hidden="true" />
          <p>Preparing visual explanation…</p>
        </div>
      )}
      {status === "success" && (
        <div className="p5-controls">
          <button
            type="button"
            className="visual-toolbar-button"
            onClick={() => setIsPlaying((v) => !v)}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            type="button"
            className="visual-toolbar-button"
            onClick={() => setResetTick((n) => n + 1)}
            title="Restart"
          >
            ↻
          </button>
        </div>
      )}
    </div>
  );
}

export default P5Visual;
