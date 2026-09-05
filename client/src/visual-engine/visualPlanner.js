// Deterministic, rule-based visual planner for the AI Teacher classroom.
//
// Given the current lesson context (subject/topic/concept/explanation) this
// picks a visual type + renderer and returns demo data to render. There is
// NO LLM call here — every visual below is hardcoded sample/demo data, and
// that is intentional for this prototype (see project instructions:
// "Do NOT falsely claim that an LLM is dynamically selecting visuals").
//
// IMPORTANT — this is the contract a future backend/LLM (e.g. GPT-OSS 120B)
// should fulfil instead of this file:
//   {
//     subject, topic, concept,
//     visualType, renderer,
//     title, description,
//     data: { ...renderer-specific payload... }
//   }
// VisualRenderer.jsx / VisualExplanation.jsx only consume this shape — they
// don't know or care whether it came from planVisual() below or a network
// response, so swapping in a real backend later means changing where this
// object comes from, not how it's rendered.

import { VISUAL_TYPES, RENDERERS } from "./visualTypes.js";

// --------------------------------------------------------------------------
// Subject detection
// --------------------------------------------------------------------------

const SUBJECT_KEYWORDS = {
  mathematics: [
    "math",
    "algebra",
    "geometry",
    "calculus",
    "equation",
    "trigonometry",
    "statistics",
    "probability",
  ],
  physics: [
    "physics",
    "force",
    "motion",
    "energy",
    "electricity",
    "magnetism",
    "thermodynamics",
    "wave",
    "optics",
    "circuit",
    "projectile",
    "newton",
  ],
  programming: [
    "programming",
    "code",
    "coding",
    "javascript",
    "python",
    "algorithm",
    "loop",
    "function",
    "variable",
    "recursion",
    "sorting",
    "searching",
  ],
  "computer-science": [
    "computer science",
    "data structure",
    "database",
    "network",
    "operating system",
    "architecture",
    "compiler",
    "complexity",
  ],
  history: [
    "history",
    "war",
    "revolution",
    "empire",
    "century",
    "ancient",
    "civilization",
    "dynasty",
    "independence",
  ],
  biology: [
    "biology",
    "cell",
    "organism",
    "enzyme",
    "photosynthesis",
    "genetics",
    "dna",
    "ecosystem",
    "evolution",
    "protein",
  ],
};

/** Deterministically guesses a subject bucket from a topic string. */
export function detectSubject(topic = "") {
  const text = topic.toLowerCase();
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return subject;
  }
  return "general";
}

function sanitizeLabel(text = "", maxLen = 40) {
  const clean = String(text)
    .replace(/[[\]{}|"`]/g, "")
    .trim();
  if (!clean) return "Concept";
  return clean.length > maxLen ? `${clean.slice(0, maxLen - 1)}…` : clean;
}

function titleCase(text = "") {
  return text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
}

// --------------------------------------------------------------------------
// React Flow demo data builders
// --------------------------------------------------------------------------

/** A simple top-to-bottom chain of labelled nodes (used for architecture/pipeline demos). */
function chainFlowData(labels) {
  const gapY = 92;
  return {
    nodes: labels.map((label, i) => ({
      id: `n${i}`,
      data: { label },
      position: { x: 0, y: i * gapY },
    })),
    edges: labels.slice(1).map((_, i) => ({
      id: `e${i}`,
      source: `n${i}`,
      target: `n${i + 1}`,
    })),
  };
}

function binarySearchFlowData() {
  return {
    nodes: [
      { id: "start", data: { label: "Start: sorted array" }, position: { x: 240, y: 0 } },
      { id: "mid", data: { label: "Find middle element" }, position: { x: 240, y: 90 } },
      { id: "found", data: { label: "Target found?" }, position: { x: 240, y: 180 } },
      { id: "return", data: { label: "Return element" }, position: { x: 480, y: 180 } },
      { id: "smaller", data: { label: "Target smaller than middle?" }, position: { x: 240, y: 280 } },
      { id: "left", data: { label: "Search left half" }, position: { x: 60, y: 380 } },
      { id: "right", data: { label: "Search right half" }, position: { x: 440, y: 380 } },
    ],
    edges: [
      { id: "e1", source: "start", target: "mid" },
      { id: "e2", source: "mid", target: "found" },
      { id: "e3", source: "found", target: "return", label: "yes" },
      { id: "e4", source: "found", target: "smaller", label: "no" },
      { id: "e5", source: "smaller", target: "left", label: "yes" },
      { id: "e6", source: "smaller", target: "right", label: "no" },
      { id: "e7", source: "left", target: "mid", label: "repeat", animated: true },
      { id: "e8", source: "right", target: "mid", label: "repeat", animated: true },
    ],
  };
}

function stackFlowData() {
  const items = ["Top → push(D)", "C", "B", "A (bottom)"];
  return {
    nodes: items.map((label, i) => ({
      id: `s${i}`,
      data: { label },
      position: { x: 0, y: i * 64 },
      style: { width: 170, textAlign: "center" },
    })),
    edges: items.slice(1).map((_, i) => ({
      id: `se${i}`,
      source: `s${i}`,
      target: `s${i + 1}`,
      label: i === 0 ? "pop ↓" : "",
    })),
  };
}

// --------------------------------------------------------------------------
// Demo visual builders — one per named concept from the project spec, plus
// subject-level fallbacks. Each returns { visualType, renderer, title,
// description, data }.
// --------------------------------------------------------------------------

function binarySearchVisual(concept) {
  return {
    visualType: VISUAL_TYPES.ALGORITHM,
    renderer: RENDERERS.REACT_FLOW,
    title: `${sanitizeLabel(concept)}: Execution`,
    description: "Binary search repeatedly halves the search space until the target is found.",
    data: binarySearchFlowData(),
  };
}

function programExecutionVisual(concept) {
  return {
    visualType: VISUAL_TYPES.FLOWCHART,
    renderer: RENDERERS.MERMAID,
    title: `${sanitizeLabel(concept)}: Execution Flow`,
    description: "How the program moves from input through processing to output.",
    data: {
      mermaidCode: `flowchart TD
  A[Program starts] --> B[Read input]
  B --> C[Execute instructions]
  C --> D{Condition met?}
  D -->|Yes| E[Take branch]
  D -->|No| F[Continue sequentially]
  E --> G[Produce output]
  F --> G
  G --> H[Program ends]`,
    },
  };
}

function compilerVisual(concept) {
  return {
    visualType: VISUAL_TYPES.ARCHITECTURE,
    renderer: RENDERERS.REACT_FLOW,
    title: `${sanitizeLabel(concept)}: Compiler Pipeline`,
    description: "Source code passes through several stages before becoming machine code.",
    data: chainFlowData(["Source Code", "Lexer", "Parser", "AST", "Optimizer", "Code Generator", "Machine Code"]),
  };
}

function stackVisual(concept) {
  return {
    visualType: VISUAL_TYPES.DATA_STRUCTURE,
    renderer: RENDERERS.REACT_FLOW,
    title: `${sanitizeLabel(concept)}: Stack (LIFO)`,
    description: "The most recently pushed item is always the first one popped.",
    data: stackFlowData(),
  };
}

function architectureVisual(concept) {
  return {
    visualType: VISUAL_TYPES.ARCHITECTURE,
    renderer: RENDERERS.REACT_FLOW,
    title: concept ? `${sanitizeLabel(concept)}: Architecture` : "System Architecture",
    description: "A layered view of how a request flows through the system, end to end.",
    data: chainFlowData([
      "Student",
      "React Frontend",
      "Node Backend",
      "RAG",
      "LLM",
      "Teaching Engine",
      "TruGen Avatar",
    ]),
  };
}

function quadraticVisual(concept) {
  return {
    visualType: VISUAL_TYPES.MATH_GRAPH,
    renderer: RENDERERS.JSXGRAPH,
    title: concept ? `${sanitizeLabel(concept)}: Interactive Graph` : "Quadratic Function",
    description: "Drag the a, b, and c sliders to see how each coefficient reshapes the parabola.",
    data: { mode: "quadratic" },
  };
}

function linearFunctionVisual(concept) {
  return {
    visualType: VISUAL_TYPES.MATH_GRAPH,
    renderer: RENDERERS.JSXGRAPH,
    title: concept ? `${sanitizeLabel(concept)}: Interactive Graph` : "Linear Function",
    description: "Drag the slope (m) and intercept (b) sliders to see how the line changes.",
    data: { mode: "linear" },
  };
}

function pythagoreanVisual(concept) {
  return {
    visualType: VISUAL_TYPES.GEOMETRY,
    renderer: RENDERERS.JSXGRAPH,
    title: concept ? `${sanitizeLabel(concept)}: Right Triangle` : "Pythagorean Theorem",
    description: "For a right triangle, a² + b² = c² — the two legs determine the hypotenuse.",
    data: { mode: "pythagorean", legA: 3, legB: 4 },
  };
}

function projectileVisual(concept) {
  return {
    visualType: VISUAL_TYPES.SIMULATION,
    renderer: RENDERERS.P5,
    title: concept ? `${sanitizeLabel(concept)}: Simulation` : "Projectile Motion",
    description: "A projectile launched at an angle follows a parabolic path under gravity.",
    data: { mode: "projectile", gravity: 9.8, velocity: 20, angle: 45 },
  };
}

function threeDVisual(concept) {
  return {
    visualType: VISUAL_TYPES.SIMULATION_3D,
    renderer: RENDERERS.THREE,
    title: concept ? `${sanitizeLabel(concept)}: 3D View` : "3D Visualization",
    description: "Drag to rotate, scroll to zoom — this is a real interactive 3D scene.",
    data: { mode: "orbit" },
  };
}

function networkVisual(concept) {
  return {
    visualType: VISUAL_TYPES.NETWORK,
    renderer: RENDERERS.CYTOSCAPE,
    title: concept ? `${sanitizeLabel(concept)}: Network` : "Computer Network",
    description: "Devices connect through routers and switches to reach servers and the internet.",
    data: {},
  };
}

function knowledgeGraphVisual(concept) {
  return {
    visualType: VISUAL_TYPES.KNOWLEDGE_GRAPH,
    renderer: RENDERERS.CYTOSCAPE,
    title: concept ? `${sanitizeLabel(concept)}: Relationships` : "Knowledge Graph",
    description: "Entities connected by the relationships that link them together.",
    data: {
      nodes: [
        { id: "a", label: sanitizeLabel(concept, 18) },
        { id: "b", label: "Related idea" },
        { id: "c", label: "Depends on" },
        { id: "d", label: "Example" },
      ],
      edges: [
        { source: "a", target: "b", label: "relates to" },
        { source: "a", target: "c", label: "depends on" },
        { source: "a", target: "d", label: "illustrated by" },
      ],
    },
  };
}

function timelineVisual(concept) {
  return {
    visualType: VISUAL_TYPES.TIMELINE,
    renderer: RENDERERS.D3,
    title: concept ? `Timeline: ${sanitizeLabel(concept)}` : "Historical Timeline",
    description: "Key moments plotted in chronological order — hover a point for detail.",
    data: {},
  };
}

function processVisual(concept) {
  return {
    visualType: VISUAL_TYPES.PROCESS,
    renderer: RENDERERS.MERMAID,
    title: concept ? `${sanitizeLabel(concept)}: Process` : "Process Overview",
    description: "A step-by-step view of how this process unfolds.",
    data: {
      mermaidCode: `flowchart TD
  A[Start] --> B[${sanitizeLabel(concept, 28)}]
  B --> C[Apply next step]
  C --> D{Check result}
  D -->|Correct| E[Complete]
  D -->|Needs revision| B`,
    },
  };
}

function physicsFormulaVisual(concept) {
  return {
    visualType: VISUAL_TYPES.PROCESS,
    renderer: RENDERERS.MERMAID,
    title: concept ? `${sanitizeLabel(concept)}: How It Works` : "Physics Concept",
    description: "A simplified process view connecting the formula to the physical outcome.",
    data: {
      mermaidCode: `flowchart LR
  A[Given conditions] --> B[Relevant formula]
  B --> C[Apply to the scenario]
  C --> D[Resulting behavior]`,
    },
  };
}

function generalVisual(concept) {
  return {
    visualType: VISUAL_TYPES.CONCEPT_MAP,
    renderer: RENDERERS.MERMAID,
    title: `Overview: ${sanitizeLabel(concept)}`,
    description: "A quick mental map of the concept and why it matters.",
    data: {
      mermaidCode: `mindmap
  root((${sanitizeLabel(concept, 24)}))
    Key idea
    Example
    Why it matters`,
    },
  };
}

// --------------------------------------------------------------------------
// Subject-level fallbacks — used when no specific concept keyword matched.
// --------------------------------------------------------------------------

const SUBJECT_FALLBACKS = {
  mathematics: quadraticVisual,
  physics: physicsFormulaVisual,
  programming: programExecutionVisual,
  "computer-science": architectureVisual,
  history: timelineVisual,
  biology: processVisual,
  general: generalVisual,
};

// --------------------------------------------------------------------------
// Planner entry point
// --------------------------------------------------------------------------

/**
 * Plans a visual for the current lesson moment.
 *
 * @param {Object} params
 * @param {string} [params.subject] - explicit subject; auto-detected from topic if omitted
 * @param {string} [params.topic]
 * @param {string} [params.concept]
 * @param {string} [params.explanation]
 * @param {string} [params.visualSuggestion] - free-text hint from the lesson step, if any
 * @returns {{subject: string, topic: string, concept: string, visualType: string, renderer: string, title: string, description: string, data: Object}}
 */
export function planVisual({
  subject,
  topic = "",
  concept = "",
  explanation = "",
  visualSuggestion = "",
} = {}) {
  const resolvedSubject = subject || detectSubject(topic);
  const haystack = `${topic} ${concept} ${explanation} ${visualSuggestion}`.toLowerCase();
  const conceptLabel = concept || titleCase(topic) || "This concept";

  let built;

  if (haystack.includes("binary search")) {
    built = binarySearchVisual(conceptLabel);
  } else if (
    haystack.includes("how a program executes") ||
    haystack.includes("program execution") ||
    haystack.includes("execution flow")
  ) {
    built = programExecutionVisual(conceptLabel);
  } else if (haystack.includes("compiler")) {
    built = compilerVisual(conceptLabel);
  } else if (haystack.includes("stack")) {
    built = stackVisual(conceptLabel);
  } else if (haystack.includes("architecture") || haystack.includes("system design")) {
    built = architectureVisual(conceptLabel);
  } else if (haystack.includes("quadratic")) {
    built = quadraticVisual(conceptLabel);
  } else if (haystack.includes("pythagorean") || haystack.includes("right triangle")) {
    built = pythagoreanVisual(conceptLabel);
  } else if (haystack.includes("geometry")) {
    built = pythagoreanVisual(conceptLabel);
  } else if (haystack.includes("linear function") || haystack.includes("linear equation")) {
    built = linearFunctionVisual(conceptLabel);
  } else if (haystack.includes("projectile")) {
    built = projectileVisual(conceptLabel);
  } else if (haystack.includes("3d") || haystack.includes("three-dimensional") || haystack.includes("3-dimensional")) {
    built = threeDVisual(conceptLabel);
  } else if (haystack.includes("network")) {
    built = networkVisual(conceptLabel);
  } else if (
    haystack.includes("database") ||
    (haystack.includes("relationship") && (resolvedSubject === "computer-science" || resolvedSubject === "biology"))
  ) {
    built = knowledgeGraphVisual(conceptLabel);
  } else if (haystack.includes("timeline") || haystack.includes("historical")) {
    built = timelineVisual(conceptLabel);
  } else if (haystack.includes("process")) {
    built = processVisual(conceptLabel);
  } else if (haystack.includes("newton") || haystack.includes("force")) {
    built = physicsFormulaVisual(conceptLabel);
  } else {
    const fallback = SUBJECT_FALLBACKS[resolvedSubject] || generalVisual;
    built = fallback(conceptLabel);
  }

  return {
    subject: resolvedSubject,
    topic,
    concept: conceptLabel,
    ...built,
  };
}
