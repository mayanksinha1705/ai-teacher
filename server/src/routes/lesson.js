import { Router } from "express";
import { requireSession } from "../store.js";
import { chatForJSON } from "../ollama.js";
import { retrieveTopChunks } from "../rag.js";
import { planVisualBeats } from "../visualPlanner.js";
import { fallbackBeats } from "../visualFallback.js";

const router = Router();

function materialContext(session, query) {
  if (!session.material.chunks.length) return "";
  const top = retrieveTopChunks(session.material.chunks, query, 4);
  if (!top.length) return "";
  return `Relevant excerpts from the student's uploaded material ("${session.material.fileName}"):\n---\n${top.join(
    "\n---\n"
  )}\n---`;
}

// POST /api/lesson/plan
// Generates a structured lesson plan from a topic and/or uploaded material.
router.post("/plan", async (req, res, next) => {
  try {
    const { sessionId, topic, level, timeAvailable, language } = req.body;
    const session = requireSession(sessionId);

    if (!topic && !session.material.chunks.length) {
      return res
        .status(400)
        .json({ error: "Provide a topic or upload material before planning a lesson." });
    }

    session.lesson.topic = topic || session.material.fileName || "Uploaded material";
    session.lesson.level = level || "Beginner";
    session.lesson.timeAvailable = timeAvailable || "20 minutes";
    session.lesson.language = language || "English";
    session.lesson.currentIndex = 0;

    const context = materialContext(session, topic || session.lesson.topic);

    const conceptCountHint =
      {
        "5 minutes": "2-3",
        "20 minutes": "4-6",
        "60 minutes": "6-9",
        "7 days": "8-12 (organized as a revision/study plan)",
      }[session.lesson.timeAvailable] || "4-6";

    const plan = await chatForJSON([
      {
        role: "system",
        content:
          "You are an expert curriculum designer creating a personalized lesson plan for a real teaching session, not a generic outline. Ground the plan in any provided material excerpts and avoid inventing facts not supported by them or by well-established knowledge.",
      },
      {
        role: "user",
        content: `Create a structured lesson plan.
Topic: ${session.lesson.topic}
Learner level: ${session.lesson.level}
Available time: ${session.lesson.timeAvailable}
Teaching language: ${session.lesson.language}
${context}

Return JSON with this exact shape:
{
  "topic": string,
  "concepts": [
    { "id": "c1", "title": string, "summary": string }
  ]
}
Generate about ${conceptCountHint} concepts, ordered from foundational to advanced, appropriate for the learner's level and time available.`,
      },
    ]);

    const concepts = (plan.concepts || []).map((c, i) => ({
      id: c.id || `c${i + 1}`,
      title: c.title,
      summary: c.summary,
      status: "pending",
    }));

    session.lesson.concepts = concepts;

    res.json({ topic: plan.topic || session.lesson.topic, concepts });
  } catch (err) {
    next(err);
  }
});

// POST /api/lesson/step
// Returns the explanation + a comprehension question for the current concept.
router.post("/step", async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const session = requireSession(sessionId);
    const { concepts, currentIndex, level, language, topic } = session.lesson;

    if (currentIndex >= concepts.length) {
      return res.json({ done: true });
    }

    const concept = concepts[currentIndex];
    const context = materialContext(session, `${topic} ${concept.title}`);

    const step = await chatForJSON([
      {
        role: "system",
        content:
          "You are a warm, human-like AI teacher delivering one step of a live lesson. Explain clearly, use a concrete example, then ask exactly one comprehension question to check understanding. Do not just answer questions — actively teach.",
      },
      {
        role: "user",
        content: `Topic: ${topic}
Concept to teach now: ${concept.title} — ${concept.summary}
Learner level: ${level}
Teaching language: ${language}
${context}

Return JSON with this exact shape:
{
  "explanation": string,          // the spoken/written explanation, 3-6 sentences, in the teaching language
  "example": string,              // one concrete example or analogy
  "visualSuggestion": string,     // short description of what diagram/chart/visual would help here (e.g. "graph of V vs I", "labeled diagram of a neuron")
  "question": {
    "type": "mcq" | "short_answer",
    "prompt": string,
    "options": [string]           // only for mcq, 3-4 options; omit or empty array for short_answer
  }
}`,
      },
    ]);

    res.json({
      done: false,
      conceptId: concept.id,
      conceptTitle: concept.title,
      progress: { index: currentIndex, total: concepts.length },
      ...step,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/lesson/visual-beats
// For the concept currently being taught, asks Ollama to plan the visuals
// for the two teaching "beats" — the explanation, then the example — so
// the classroom can show a different, purpose-fit visualization for each
// moment instead of one static diagram for the whole concept. Falls back
// to a deterministic Mermaid-only plan if Ollama is unreachable or times
// out, so a lesson never gets stuck waiting on it.
router.post("/visual-beats", async (req, res, next) => {
  try {
    const { sessionId, conceptTitle, explanation, example, visualSuggestion } = req.body;
    const session = requireSession(sessionId);
    const { topic, level, language } = session.lesson;

    if (!conceptTitle || (!explanation && !example)) {
      return res
        .status(400)
        .json({ error: "conceptTitle and at least one of explanation/example are required." });
    }

    const ctx = { topic, conceptTitle, explanation: explanation || "", example: example || "", visualSuggestion, level, language };

    let beats;
    try {
      beats = await withTimeout(planVisualBeats(ctx), 30000);
    } catch (err) {
      console.warn(`Visual planning fell back to deterministic beats (${err.message})`);
      beats = fallbackBeats(ctx);
    }

    res.json({ beats });
  } catch (err) {
    next(err);
  }
});

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)),
  ]);
}

// POST /api/lesson/answer
// Evaluates the student's answer, detects misconceptions, decides next action.
router.post("/answer", async (req, res, next) => {
  try {
    const { sessionId, question, studentAnswer } = req.body;
    const session = requireSession(sessionId);
    const { concepts, currentIndex, level, language, topic } = session.lesson;
    const concept = concepts[currentIndex];

    const evalResult = await chatForJSON([
      {
        role: "system",
        content:
          "You are an AI teacher evaluating a student's answer during a live lesson. Be encouraging but honest. If the answer reveals a misconception, name it plainly and re-explain using a different angle or analogy than before.",
      },
      {
        role: "user",
        content: `Topic: ${topic}
Concept: ${concept.title} — ${concept.summary}
Learner level: ${level}
Teaching language: ${language}
Question asked: ${JSON.stringify(question)}
Student's answer: "${studentAnswer}"

Return JSON with this exact shape:
{
  "verdict": "correct" | "partial" | "incorrect",
  "feedback": string,             // short feedback to show the student, in the teaching language
  "misconception": string | null, // name the misconception if any, else null
  "reexplanation": string | null, // a fresh explanation using a different analogy, only if verdict is "incorrect" or "partial"
  "action": "advance" | "reexplain"
}`,
      },
    ]);

    if (evalResult.verdict === "correct") {
      concept.status = "understood";
      if (!session.profile.strongConcepts.includes(concept.title)) {
        session.profile.strongConcepts.push(concept.title);
      }
    } else {
      concept.status = "weak";
      if (!session.profile.weakConcepts.includes(concept.title)) {
        session.profile.weakConcepts.push(concept.title);
      }
    }

    res.json(evalResult);
  } catch (err) {
    next(err);
  }
});

// POST /api/lesson/advance
// Move to the next concept (called after the student is done with the current one).
router.post("/advance", async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const session = requireSession(sessionId);
    session.lesson.currentIndex += 1;
    const done = session.lesson.currentIndex >= session.lesson.concepts.length;
    res.json({ done, currentIndex: session.lesson.currentIndex });
  } catch (err) {
    next(err);
  }
});

export default router;
