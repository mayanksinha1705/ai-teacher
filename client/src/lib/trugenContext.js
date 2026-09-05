// Builds the plain-text "context" string sent to TruGen via the officially
// documented embed URL parameter:
//   https://app.trugen.ai/embed/{agentId}?username=...&id=...&context=...
// (see https://docs.trugen.ai/docs/integrations/embed-via-iFrame)
//
// This is the ONLY verified, documented mechanism for feeding TruGen
// runtime content — there is no verified postMessage API, no verified
// extra props on the npm widget component, and this file does not invent
// either. Every value used below comes straight from the app's own lesson
// state (session/lesson.js on the backend, App.jsx on the frontend) — none
// of it is fabricated per-topic content.

export function buildInitialTeachingContext({ topic, level, language, conceptTitle, explanation, example, question }) {
  const lines = [
    `You are the AI Teacher for this lesson. Teach in ${language || "English"}.`,
    `Student level: ${level || "Beginner"}.`,
    `Topic: ${topic}.`,
    `Current concept: ${conceptTitle}.`,
    "",
    "Explain this concept clearly using the following lesson content, in your own words:",
    explanation || "(no explanation provided)",
  ];
  if (example) {
    lines.push("", "Example to use:", example);
  }
  if (question?.prompt) {
    lines.push(
      "",
      "After explaining, ask the student this comprehension question:",
      question.prompt,
      "Do not move on to anything else until the student has answered."
    );
  }
  lines.push("", "Do not teach unrelated topics.");
  return lines.join("\n");
}

export function buildEvaluationTeachingContext({ topic, conceptTitle, question, studentAnswer, evaluation }) {
  const correct = evaluation?.verdict === "correct";
  const lines = [
    `You are the AI Teacher for this lesson. Topic: ${topic}. Concept: ${conceptTitle}.`,
    "",
    `Question asked: ${question?.prompt || "(none)"}`,
    `Student's answer: "${studentAnswer}"`,
    `Evaluation: ${evaluation?.verdict || "unknown"}.`,
  ];
  if (correct) {
    lines.push(
      "",
      "The student answered correctly. Briefly and warmly acknowledge this, then wait for the next concept to be introduced."
    );
  } else {
    lines.push(
      "",
      `Feedback to give: ${evaluation?.feedback || ""}`,
      evaluation?.misconception ? `Misconception detected: ${evaluation.misconception}` : "",
      "Re-explain the concept using a DIFFERENT explanation or analogy than before. Do not simply repeat the previous explanation.",
      evaluation?.reexplanation ? `Use this fresh explanation:\n${evaluation.reexplanation}` : ""
    );
  }
  return lines.filter(Boolean).join("\n");
}
