// Deterministic, rule-based visual planner for the AI Teacher classroom.
//
// Given the current lesson context (subject/topic/concept/explanation) this
// picks a visual type and returns ready-to-render Mermaid code. It is
// intentionally simple, sample/demo logic for the prototype — there is no
// LLM call here.
//
// IMPORTANT: the shape returned by planVisual() —
//   { type, title, mermaidCode, explanation }
// — is exactly the shape a future backend/LLM integration should return
// (see spec: { subject, topic, concept, visualType, title, mermaidCode }).
// VisualExplanation/MermaidDiagram don't care whether this object came from
// this file or from a network response, so swapping in a real backend later
// is a drop-in change here, not a UI change.

export const SUPPORTED_VISUAL_TYPES = [
  "flowchart",
  "process",
  "architecture",
  "timeline",
  "sequence",
  "mindmap",
];

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

// --------------------------------------------------------------------------
// Demo visuals — used when the lesson content clearly names one of these
// (spec §6: Binary Search, Software Architecture, Historical Timeline,
// Process).
// --------------------------------------------------------------------------

function binarySearchVisual(title) {
  return {
    type: "flowchart",
    title: title || "Binary Search Execution Flow",
    mermaidCode: `flowchart TD
  A[Start: sorted array] --> B[Find middle element]
  B --> C{Target found?}
  C -->|Yes| D[Return element]
  C -->|No| E{Target smaller than middle?}
  E -->|Yes| F[Search left half]
  E -->|No| G[Search right half]
  F --> B
  G --> B`,
    explanation: "Binary search repeatedly halves the search space until the target is found.",
  };
}

function softwareArchitectureVisual(title) {
  return {
    type: "architecture",
    title: title || "Software Architecture Overview",
    mermaidCode: `flowchart LR
  Client[Client App] --> API[API Layer]
  API --> Service[Business Logic]
  Service --> DB[(Database)]
  Service --> Cache[(Cache)]
  API --> Auth[Auth Service]`,
    explanation: "A typical layered architecture: client, API, business logic, and data layer.",
  };
}

function historicalTimelineVisual(title, eventLabel) {
  return {
    type: "timeline",
    title: title || "Historical Timeline",
    mermaidCode: `timeline
    title ${sanitizeLabel(title || "Key Events", 60)}
    section Context
      Background : ${sanitizeLabel(eventLabel, 50)}
    section Development
      Turning point : Escalation
      Response : Reaction
    section Outcome
      Resolution : Aftermath`,
    explanation: "A simplified timeline of the key stages in this historical concept.",
  };
}

function processVisual(title, stepLabel) {
  return {
    type: "process",
    title: title || "Process Overview",
    mermaidCode: `flowchart TD
  A[Start] --> B[${sanitizeLabel(stepLabel, 30)}]
  B --> C[Apply rule / step]
  C --> D{Check result}
  D -->|Correct| E[Complete]
  D -->|Needs revision| B`,
    explanation: "A step-by-step process view of how this concept works.",
  };
}

// --------------------------------------------------------------------------
// Subject-level fallback visuals — used when nothing more specific matched.
// --------------------------------------------------------------------------

function mathVisual(concept) {
  return {
    type: "flowchart",
    title: `Solving: ${sanitizeLabel(concept)}`,
    mermaidCode: `flowchart TD
  A[Understand the problem] --> B[Identify known values]
  B --> C[Choose the right formula/method]
  C --> D[Solve step by step]
  D --> E[Verify the answer]`,
    explanation: "A general step-by-step approach for solving this type of problem.",
  };
}

function physicsVisual(concept) {
  return {
    type: "process",
    title: `${sanitizeLabel(concept)}: How It Works`,
    mermaidCode: `flowchart LR
  A[Given conditions] --> B[Relevant formula]
  B --> C[Apply to the scenario]
  C --> D[Resulting behavior]`,
    explanation: "A simplified process view connecting the formula to the physical outcome.",
  };
}

function programmingVisual(concept) {
  return {
    type: "flowchart",
    title: `${sanitizeLabel(concept)}: Execution Flow`,
    mermaidCode: `flowchart TD
  A[Start] --> B[${sanitizeLabel(concept, 28)}]
  B --> C{Condition met?}
  C -->|Yes| D[Take action]
  C -->|No| E[Continue / loop]
  D --> F[End]
  E --> B`,
    explanation: "A generic flow of how this programming concept executes step by step.",
  };
}

function computerScienceVisual(concept) {
  return {
    type: "architecture",
    title: `${sanitizeLabel(concept)}: Structure`,
    mermaidCode: `flowchart LR
  Input[Input] --> Process[${sanitizeLabel(concept, 24)}]
  Process --> Output[Output]
  Process --> Storage[(Storage)]`,
    explanation: "A structural view of how this computer science concept is organized.",
  };
}

function historyVisual(concept) {
  return historicalTimelineVisual(`Timeline: ${sanitizeLabel(concept)}`, concept);
}

function generalVisual(concept) {
  return {
    type: "mindmap",
    title: `Overview: ${sanitizeLabel(concept)}`,
    mermaidCode: `mindmap
  root((${sanitizeLabel(concept, 24)}))
    Key idea
    Example
    Why it matters`,
    explanation: "A quick mental map of the concept and why it matters.",
  };
}

const SUBJECT_FALLBACKS = {
  mathematics: mathVisual,
  physics: physicsVisual,
  programming: programmingVisual,
  "computer-science": computerScienceVisual,
  history: historyVisual,
  general: generalVisual,
};

/**
 * Plans a visual for the current lesson moment.
 *
 * @param {Object} params
 * @param {string} [params.subject] - explicit subject; auto-detected from topic if omitted
 * @param {string} [params.topic]
 * @param {string} [params.concept]
 * @param {string} [params.explanation]
 * @param {string} [params.visualSuggestion] - free-text hint from the lesson step, if any
 * @returns {{type: string, title: string, mermaidCode: string, explanation: string}}
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
  const conceptLabel = concept || topic || "This concept";

  if (haystack.includes("binary search")) {
    return binarySearchVisual(concept ? `${sanitizeLabel(concept)}: Execution Flow` : undefined);
  }
  if (haystack.includes("architecture")) {
    return softwareArchitectureVisual(concept ? sanitizeLabel(concept) : undefined);
  }
  if (haystack.includes("timeline") || (resolvedSubject === "history" && haystack.includes("history"))) {
    return historicalTimelineVisual(
      concept ? `Timeline: ${sanitizeLabel(concept)}` : undefined,
      conceptLabel
    );
  }
  if (haystack.includes("process")) {
    return processVisual(concept ? `${sanitizeLabel(concept)}: Process` : undefined, conceptLabel);
  }

  const fallback = SUBJECT_FALLBACKS[resolvedSubject] || generalVisual;
  return fallback(conceptLabel);
}
