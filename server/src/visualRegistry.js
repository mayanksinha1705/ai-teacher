// Server-side mirror of the client's visual-engine/visualTypes.js +
// visualRegistry.js. Kept as a small standalone copy (rather than a shared
// package) since client and server are separate npm projects here — this
// is just the vocabulary needed to prompt Ollama and validate its output.

export const VISUAL_TYPES = [
  "flowchart",
  "process",
  "concept-map",
  "sequence",
  "timeline",
  "architecture",
  "algorithm",
  "data-structure",
  "math-graph",
  "geometry",
  "simulation",
  "simulation-3d",
  "network",
  "knowledge-graph",
  "data-visualization",
];

export const RENDERERS = ["mermaid", "reactflow", "jsxgraph", "three", "d3", "p5", "cytoscape"];

const VISUAL_TYPE_TO_RENDERER = {
  flowchart: "mermaid",
  process: "mermaid",
  "concept-map": "mermaid",
  sequence: "mermaid",
  architecture: "reactflow",
  algorithm: "reactflow",
  "data-structure": "reactflow",
  "math-graph": "jsxgraph",
  geometry: "jsxgraph",
  simulation: "p5",
  "simulation-3d": "three",
  network: "cytoscape",
  "knowledge-graph": "cytoscape",
  timeline: "d3",
  "data-visualization": "d3",
};

export function getRendererForType(visualType) {
  return VISUAL_TYPE_TO_RENDERER[visualType] || "mermaid";
}

export function isValidVisualType(visualType) {
  return VISUAL_TYPES.includes(visualType);
}

export function isValidRenderer(renderer) {
  return RENDERERS.includes(renderer);
}
