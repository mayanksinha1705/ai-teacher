import { useEffect, useRef, useState } from "react";
import JXG from "jsxgraph";
import "../../vendor/jsxgraph.css";

let boardCount = 0;

function buildBoard(containerId, data) {
  const board = JXG.JSXGraph.initBoard(containerId, {
    boundingbox: data.boundingBox || [-8, 8, 8, -8],
    axis: true,
    showCopyright: false,
    showNavigation: true,
    pan: { enabled: true, needShift: false },
    zoom: { enabled: true, wheel: true },
  });

  if (data.mode === "quadratic") {
    const a = board.create("slider", [[-6.5, 6.5], [-3, 6.5], [-3, 1, 3]], { name: "a" });
    const b = board.create("slider", [[-6.5, 5.5], [-3, 5.5], [-5, 0, 5]], { name: "b" });
    const c = board.create("slider", [[-6.5, 4.5], [-3, 4.5], [-5, 0, 5]], { name: "c" });
    board.create("functiongraph", [(x) => a.Value() * x * x + b.Value() * x + c.Value(), -8, 8], {
      strokeColor: "#0f9c74",
      strokeWidth: 3,
    });
  } else if (data.mode === "linear") {
    const m = board.create("slider", [[-6.5, 6.5], [-3, 6.5], [-3, 1, 3]], { name: "m" });
    const k = board.create("slider", [[-6.5, 5.5], [-3, 5.5], [-5, 0, 5]], { name: "b" });
    board.create("functiongraph", [(x) => m.Value() * x + k.Value(), -8, 8], {
      strokeColor: "#0f9c74",
      strokeWidth: 3,
    });
  } else if (data.mode === "pythagorean") {
    const a = data.legA ?? 3;
    const b = data.legB ?? 4;
    const p1 = board.create("point", [0, 0], { name: "A", fixed: true, color: "#0f9c74" });
    const p2 = board.create("point", [a, 0], { name: "B", fixed: true, color: "#0f9c74" });
    const p3 = board.create("point", [a, b], { name: "C", fixed: true, color: "#0f9c74" });
    board.create("polygon", [p1, p2, p3], {
      fillColor: "#0f9c74",
      fillOpacity: 0.18,
      borders: { strokeColor: "#0f9c74", strokeWidth: 2 },
    });
    board.create("text", [a / 2 - 0.3, -0.7, `a = ${a}`], { fontSize: 13 });
    board.create("text", [a + 0.3, b / 2, `b = ${b}`], { fontSize: 13 });
    const hyp = Math.sqrt(a * a + b * b).toFixed(2);
    board.create("text", [a / 2 - 1.1, b / 2 + 0.5, `c = ${hyp}`], { fontSize: 13 });
  } else {
    // generic fallback: a simple wave, so an unrecognized mode still shows something
    board.create("functiongraph", [(x) => Math.sin(x) * 2, -8, 8], { strokeColor: "#0f9c74", strokeWidth: 3 });
  }

  return board;
}

/**
 * Interactive mathematics and geometry: function graphs with draggable
 * sliders, or a labelled geometric construction.
 *
 * data: { mode: "quadratic" | "linear" | "pythagorean", legA?, legB?, boundingBox? }
 */
function JSXGraphVisual({ data }) {
  const boardRef = useRef(null);
  const idRef = useRef(`jsxgraph-visual-${++boardCount}`);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    try {
      boardRef.current = buildBoard(idRef.current, data || {});
      setStatus("success");
    } catch (err) {
      console.error("JSXGraph render failed:", err);
      setStatus("error");
    }

    return () => {
      if (boardRef.current) {
        JXG.JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }
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
    <div className="jsxgraph-visual">
      <div id={idRef.current} className="jsxgraph-board" />
      {status === "loading" && (
        <div className="visual-render-state visual-render-loading visual-render-overlay">
          <span className="visual-spinner" aria-hidden="true" />
          <p>Preparing visual explanation…</p>
        </div>
      )}
    </div>
  );
}

export default JSXGraphVisual;
