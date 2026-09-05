// Runtime visual planning, driven by the local Ollama model.
//
// Given what the teacher is about to say for a concept (the explanation
// narration, then the example narration — these are two distinct "beats"
// of the same concept), this asks Ollama to pick the best of the seven
// visualization tools for EACH beat independently and describe what it
// should show. The model never invents pixel coordinates or writes
// framework code — only structured data (see SYSTEM_PROMPT below) — which
// is then validated and normalized here before it ever reaches the
// frontend. Anything the model gets wrong or omits falls back to a safe
// default for that renderer; if the whole call fails, fallbackBeats()
// (deterministic, no LLM) is used instead.

import { chatForJSON } from "./ollama.js";
import { isValidVisualType, isValidRenderer, getRendererForType, RENDERERS, VISUAL_TYPES } from "./visualRegistry.js";
import { autoLayoutTree } from "./visualLayout.js";
import { fallbackBeats } from "./visualFallback.js";

const SYSTEM_PROMPT = `You are the visual-design engine for a live AI classroom. A separate AI teacher is about to speak two narrations to a student: first an EXPLANATION of a concept, then an EXAMPLE of it. Your job is to choose, for each narration independently, the single best visualization tool from this list and describe what it should render:

- mermaid: flowcharts, step-by-step processes, simple concept maps. Use visualType "flowchart", "process", or "concept-map".
- reactflow: interactive node diagrams — software architecture, algorithms, data structures. Use visualType "architecture", "algorithm", or "data-structure".
- jsxgraph: interactive math — function graphs, geometry. Use visualType "math-graph" or "geometry".
- three: a real interactive 3D scene. Use visualType "simulation-3d". Only for concepts that are genuinely spatial/3D.
- d3: a historical/interactive timeline. Use visualType "timeline".
- p5: an animated 2D simulation of projectile motion under gravity. Use visualType "simulation". Only use this for motion/trajectory concepts — it can ONLY render a projectile arc, nothing else.
- cytoscape: a network or relationship graph. Use visualType "network" or "knowledge-graph".

Pick whichever tool actually fits the specific narration — do not default to the same tool every time. A definition-heavy explanation often fits mermaid or reactflow; a numeric/graphable relationship fits jsxgraph; a spatial/3D idea fits three; a worked numeric example of motion fits p5; historical/sequenced content fits d3; relationships between entities fit cytoscape.

Respond with ONLY this JSON shape, no commentary:
{
  "beats": [
    {
      "heading": string,            // <8 words, shown as a large on-screen title
      "bullets": [string, string],  // 2-3 short phrases, <8 words each, no markdown
      "visualType": string,         // one of: ${VISUAL_TYPES.join(", ")}
      "renderer": string,           // one of: ${RENDERERS.join(", ")} — must match visualType's tool above
      "title": string,              // short title for the visual itself
      "description": string,        // one sentence caption shown under the visual
      "data": { ... }               // renderer-specific, see shapes below
    },
    { ... second beat, same shape ... }
  ]
}

"data" shape per renderer:
- mermaid: { "mermaidCode": string } — valid Mermaid v10+ syntax, flowchart TD/LR or a short mindmap. Keep it under 10 lines. No markdown fences.
- reactflow: { "nodes": [{"id": string, "label": string}], "edges": [{"source": string, "target": string, "label"?: string}] } — DO NOT include positions/coordinates, they are computed automatically. 4-8 nodes.
- jsxgraph: { "mode": "quadratic" | "linear" | "pythagorean", "legA"?: number, "legB"?: number } — only include legA/legB for "pythagorean".
- three: { "mode": "cube" | "orbit" }
- d3: { "events": [{"year": number, "label": string}] } — 4-6 real or illustrative events, chronological.
- p5: { "gravity": number, "velocity": number, "angle": number } — realistic values (gravity ~9.8, velocity 5-40, angle 10-80).
- cytoscape: { "nodes": [{"id": string, "label": string}], "edges": [{"source": string, "target": string, "label"?: string}] } — 4-8 nodes.

Return exactly 2 beats: the first for the EXPLANATION narration, the second for the EXAMPLE narration.`;

function sanitizeText(text, max = 80) {
  if (typeof text !== "string") return "";
  return text.replace(/[<>]/g, "").trim().slice(0, max);
}

function sanitizeBullets(bullets, fallbackText) {
  const list = Array.isArray(bullets) ? bullets : [];
  const cleaned = list
    .filter((b) => typeof b === "string" && b.trim())
    .map((b) => sanitizeText(b, 70))
    .slice(0, 4);
  if (cleaned.length) return cleaned;

  // Model omitted bullets — derive short ones from the narration itself.
  return String(fallbackText || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

/** Validates + normalizes the `data` payload for one renderer, falling back to a safe default on any problem. */
function normalizeData(renderer, data, conceptTitle) {
  const safe = data && typeof data === "object" ? data : {};

  switch (renderer) {
    case "mermaid": {
      const code = typeof safe.mermaidCode === "string" ? safe.mermaidCode.trim() : "";
      if (code) return { mermaidCode: code.slice(0, 1200) };
      return {
        mermaidCode: `flowchart TD\n  A[${sanitizeText(conceptTitle, 28)}] --> B[Key idea]\n  B --> C[Why it matters]`,
      };
    }

    case "reactflow": {
      const rawNodes = Array.isArray(safe.nodes) ? safe.nodes : [];
      const nodes = rawNodes
        .filter((n) => n && n.id != null)
        .map((n) => ({ id: String(n.id), label: sanitizeText(n.label ?? n.id, 60) }))
        .slice(0, 12);
      if (!nodes.length) {
        return autoLayoutTree(
          [
            { id: "a", label: sanitizeText(conceptTitle, 30) },
            { id: "b", label: "Key idea" },
            { id: "c", label: "Outcome" },
          ],
          [
            { source: "a", target: "b" },
            { source: "b", target: "c" },
          ]
        );
      }
      const rawEdges = Array.isArray(safe.edges) ? safe.edges : [];
      const edges = rawEdges
        .filter((e) => e && e.source != null && e.target != null)
        .map((e) => ({ source: String(e.source), target: String(e.target), label: e.label }))
        .slice(0, 20);
      return autoLayoutTree(nodes, edges);
    }

    case "jsxgraph": {
      const mode = ["quadratic", "linear", "pythagorean"].includes(safe.mode) ? safe.mode : "quadratic";
      if (mode === "pythagorean") {
        const legA = isFiniteNumber(safe.legA) ? Math.max(1, Math.min(8, safe.legA)) : 3;
        const legB = isFiniteNumber(safe.legB) ? Math.max(1, Math.min(8, safe.legB)) : 4;
        return { mode, legA, legB };
      }
      return { mode };
    }

    case "three": {
      const mode = ["cube", "orbit"].includes(safe.mode) ? safe.mode : "cube";
      return { mode };
    }

    case "d3": {
      const events = Array.isArray(safe.events)
        ? safe.events
            .filter((e) => e && isFiniteNumber(Number(e.year)))
            .map((e) => ({ year: Number(e.year), label: sanitizeText(e.label, 40) }))
            .slice(0, 8)
        : [];
      return events.length >= 2 ? { events } : {}; // {} → component uses its own built-in demo timeline
    }

    case "p5": {
      const gravity = isFiniteNumber(safe.gravity) ? Math.min(30, Math.max(1, safe.gravity)) : 9.8;
      const velocity = isFiniteNumber(safe.velocity) ? Math.min(60, Math.max(2, safe.velocity)) : 20;
      const angle = isFiniteNumber(safe.angle) ? Math.min(85, Math.max(5, safe.angle)) : 45;
      return { mode: "projectile", gravity, velocity, angle };
    }

    case "cytoscape": {
      const rawNodes = Array.isArray(safe.nodes) ? safe.nodes : [];
      const nodes = rawNodes
        .filter((n) => n && n.id != null)
        .map((n) => ({ id: String(n.id), label: sanitizeText(n.label ?? n.id, 40) }))
        .slice(0, 12);
      if (!nodes.length) return {}; // {} → component uses its own built-in demo network
      const rawEdges = Array.isArray(safe.edges) ? safe.edges : [];
      const edges = rawEdges
        .filter((e) => e && e.source != null && e.target != null)
        .map((e) => ({ source: String(e.source), target: String(e.target), label: e.label }))
        .slice(0, 20);
      return { nodes, edges };
    }

    default:
      return {};
  }
}

/** Validates one raw beat object from the model; returns null if it's unusable. */
function normalizeBeat(raw, phase, narration, conceptTitle) {
  if (!raw || typeof raw !== "object") return null;

  const visualType = isValidVisualType(raw.visualType) ? raw.visualType : null;
  if (!visualType) return null;

  const renderer = isValidRenderer(raw.renderer) ? raw.renderer : getRendererForType(visualType);

  return {
    phase,
    heading: sanitizeText(raw.heading, 60) || sanitizeText(conceptTitle, 60),
    bullets: sanitizeBullets(raw.bullets, narration),
    narration,
    visual: {
      visualType,
      renderer,
      title: sanitizeText(raw.title, 60) || sanitizeText(conceptTitle, 60),
      description: sanitizeText(raw.description, 160),
      data: normalizeData(renderer, raw.data, conceptTitle),
    },
  };
}

/**
 * Plans the explanation + example beats for a concept using Ollama.
 * Always resolves to exactly 2 usable beats — never throws for
 * validation reasons (only a genuine Ollama connection failure propagates,
 * so the caller can fall back to fallbackBeats()).
 */
export async function planVisualBeats({ topic, conceptTitle, explanation, example, visualSuggestion, level, language }) {
  const raw = await chatForJSON(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Topic: ${topic}
Concept: ${conceptTitle}
Learner level: ${level}
Language: ${language}

EXPLANATION narration (teacher is about to say this while teaching the concept):
"${explanation}"

EXAMPLE narration (teacher is about to say this while walking through an example):
"${example}"

Lesson author's visual hint (optional, you may ignore if a better tool fits): ${visualSuggestion || "(none)"}`,
      },
    ],
    { temperature: 0.35 }
  );

  const rawBeats = Array.isArray(raw?.beats) ? raw.beats : [];
  const phases = ["explanation", "example"];
  const narrations = [explanation, example];

  const beats = phases.map((phase, i) => normalizeBeat(rawBeats[i], phase, narrations[i], conceptTitle));

  // Fill in anything the model skipped or that failed validation using the
  // deterministic fallback for just that slot, so a partial LLM response
  // still results in a fully usable pair of beats.
  if (beats.some((b) => !b)) {
    const backup = fallbackBeats({ conceptTitle, explanation, example });
    return beats.map((b, i) => b || backup[i]);
  }

  return beats;
}
