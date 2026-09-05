import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const DEMO_EVENTS = [
  { year: 1945, label: "End of World War II" },
  { year: 1950, label: "Start of the Cold War era" },
  { year: 1969, label: "Moon landing" },
  { year: 1989, label: "Fall of the Berlin Wall" },
  { year: 1991, label: "Dissolution of the Soviet Union" },
];

function wrapLabel(selection, text) {
  const words = text.split(" ");
  let line = "";
  let lineNum = 0;
  words.forEach((word, i) => {
    const test = line ? `${line} ${word}` : word;
    if (test.length > 16 && line) {
      selection
        .append("tspan")
        .attr("x", 0)
        .attr("dy", lineNum === 0 ? 0 : 12)
        .text(line);
      line = word;
      lineNum += 1;
    } else {
      line = test;
    }
    if (i === words.length - 1) {
      selection
        .append("tspan")
        .attr("x", 0)
        .attr("dy", lineNum === 0 ? 0 : 12)
        .text(line);
    }
  });
}

/**
 * An interactive horizontal timeline: events plotted along a scale, with
 * hover feedback. Falls back to a small built-in demo timeline when no
 * events are supplied.
 *
 * data: { events?: [{year: number, label: string}] }
 */
function D3Visual({ data }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    try {
      const events = (data?.events?.length ? data.events : DEMO_EVENTS)
        .slice()
        .sort((a, b) => a.year - b.year);

      const width = container.clientWidth || 600;
      const height = 260;
      const margin = { top: 40, right: 30, bottom: 40, left: 30 };

      d3.select(container).selectAll("*").remove();

      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`);

      const x = d3
        .scaleLinear()
        .domain([events[0].year - 2, events[events.length - 1].year + 2])
        .range([margin.left, width - margin.right]);

      svg
        .append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", height / 2)
        .attr("y2", height / 2)
        .attr("stroke", "#263346")
        .attr("stroke-width", 2);

      const axis = d3.axisBottom(x).tickFormat(d3.format("d")).ticks(events.length);
      const axisGroup = svg
        .append("g")
        .attr("transform", `translate(0, ${height / 2 + 40})`)
        .call(axis);
      axisGroup.select(".domain").attr("stroke", "#263346");
      axisGroup.selectAll(".tick line").attr("stroke", "#263346");
      axisGroup.selectAll("text").attr("fill", "#64748b").attr("font-size", "10px");

      const nodes = svg
        .selectAll(".event-node")
        .data(events)
        .enter()
        .append("g")
        .attr("class", "event-node")
        .attr("transform", (d) => `translate(${x(d.year)}, ${height / 2})`)
        .style("cursor", "pointer");

      nodes
        .append("circle")
        .attr("r", 7)
        .attr("fill", "#11e59e")
        .attr("stroke", "#0a0d12")
        .attr("stroke-width", 2);

      nodes
        .append("text")
        .attr("y", -16)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .text((d) => d.year);

      nodes
        .append("text")
        .attr("y", 26)
        .attr("text-anchor", "middle")
        .attr("fill", "#cbd5e1")
        .attr("font-size", "10px")
        .each(function (d) {
          wrapLabel(d3.select(this), d.label);
        });

      nodes
        .on("mouseenter", function () {
          d3.select(this).select("circle").transition().duration(120).attr("r", 10);
        })
        .on("mouseleave", function () {
          d3.select(this).select("circle").transition().duration(120).attr("r", 7);
        });

      setStatus("success");
    } catch (err) {
      console.error("D3 timeline render failed:", err);
      setStatus("error");
    }

    return () => {
      d3.select(container).selectAll("*").remove();
    };
  }, [data]);

  if (status === "error") {
    return (
      <div className="visual-render-state visual-render-error">
        <p>Unable to display this visualization.</p>
      </div>
    );
  }

  return (
    <div className="d3-visual">
      <div ref={containerRef} className="d3-canvas-wrap" />
      {status === "loading" && (
        <div className="visual-render-state visual-render-loading visual-render-overlay">
          <span className="visual-spinner" aria-hidden="true" />
          <p>Preparing visual explanation…</p>
        </div>
      )}
    </div>
  );
}

export default D3Visual;
