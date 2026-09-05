// Shared vocabulary for the visual engine. Keeping these as named constants
// (rather than sprinkling string literals everywhere) makes the registry,
// planner, and renderer easy to keep in sync as new types/renderers are added.

export const VISUAL_TYPES = {
  FLOWCHART: "flowchart",
  PROCESS: "process",
  CONCEPT_MAP: "concept-map",
  SEQUENCE: "sequence",
  TIMELINE: "timeline",
  ARCHITECTURE: "architecture",
  ALGORITHM: "algorithm",
  DATA_STRUCTURE: "data-structure",
  MATH_GRAPH: "math-graph",
  GEOMETRY: "geometry",
  SIMULATION: "simulation",
  SIMULATION_3D: "simulation-3d",
  NETWORK: "network",
  KNOWLEDGE_GRAPH: "knowledge-graph",
  DATA_VISUALIZATION: "data-visualization",
};

export const RENDERERS = {
  MERMAID: "mermaid",
  REACT_FLOW: "reactflow",
  JSXGRAPH: "jsxgraph",
  THREE: "three",
  D3: "d3",
  P5: "p5",
  CYTOSCAPE: "cytoscape",
};

export const SUPPORTED_RENDERERS = Object.values(RENDERERS);
