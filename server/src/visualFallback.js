// Deterministic, non-LLM fallback used only when the Ollama call for
// visual planning fails outright (server unreachable, times out, or never
// returns usable JSON even after chatForJSON's retry). Ollama is the
// primary path for choosing *which* of the seven visualization tools fits
// a given moment — this fallback exists purely so a lesson never has a
// completely broken/missing visual panel. It always uses Mermaid, since
// Mermaid is the one renderer that degrades safely on its own (invalid
// syntax just shows a plain message, never a crash).

function sanitize(text = "", max = 48) {
  const clean = String(text).replace(/[[\]{}|"`]/g, "").trim();
  if (!clean) return "This concept";
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function splitToBullets(text = "", max = 3) {
  const sentences = String(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const bullets = sentences.slice(0, max);
  return bullets.length ? bullets : ["Key idea", "Why it matters"];
}

export function fallbackBeats({ conceptTitle, explanation = "", example = "" }) {
  const title = sanitize(conceptTitle);

  return [
    {
      phase: "explanation",
      heading: title,
      bullets: splitToBullets(explanation),
      narration: explanation,
      visual: {
        visualType: "process",
        renderer: "mermaid",
        title: `${title}: Overview`,
        description: "A simplified step-by-step view of this concept.",
        data: {
          mermaidCode: `flowchart TD\n  A[${sanitize(conceptTitle, 28)}] --> B[Key idea]\n  B --> C[Why it matters]\n  C --> D[Leads to...]`,
        },
      },
    },
    {
      phase: "example",
      heading: `Example: ${title}`,
      bullets: splitToBullets(example),
      narration: example,
      visual: {
        visualType: "process",
        renderer: "mermaid",
        title: `${title}: Worked Example`,
        description: "Applying the concept to a concrete example.",
        data: {
          mermaidCode: `flowchart LR\n  A[Given] --> B[Apply ${sanitize(conceptTitle, 20)}]\n  B --> C[Result]`,
        },
      },
    },
  ];
}
