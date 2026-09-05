import { Router } from "express";
import { requireSession } from "../store.js";
import { chatForJSON } from "../ollama.js";

const router = Router();

// POST /api/assessment/generate
router.post("/generate", async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const session = requireSession(sessionId);
    const { concepts, topic, level, language } = session.lesson;

    if (!concepts.length) {
      return res.status(400).json({ error: "No lesson has been taught yet." });
    }

    const quiz = await chatForJSON([
      {
        role: "system",
        content:
          "You are an AI teacher creating a short final assessment covering the concepts just taught.",
      },
      {
        role: "user",
        content: `Topic: ${topic}
Learner level: ${level}
Teaching language: ${language}
Concepts taught: ${concepts.map((c) => `${c.title} (${c.status})`).join(", ")}

Create 4-6 quiz questions (mix of MCQ and short-answer) covering these concepts, weighted more heavily toward concepts marked "weak".
Return JSON with this exact shape:
{
  "questions": [
    {
      "id": "q1",
      "concept": string,
      "type": "mcq" | "short_answer",
      "prompt": string,
      "options": [string],       // only for mcq
      "correctAnswer": string    // the expected correct answer, used for grading, not shown to the student
    }
  ]
}`,
      },
    ]);

    const questions = (quiz.questions || []).map((q, i) => ({
      id: q.id || `q${i + 1}`,
      concept: q.concept,
      type: q.type,
      prompt: q.prompt,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
    }));

    session.lesson.quiz = questions;

    // Do not send correctAnswer to the client.
    res.json({
      questions: questions.map(({ correctAnswer, ...q }) => q),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/assessment/submit  { sessionId, answers: { [questionId]: studentAnswer } }
router.post("/submit", async (req, res, next) => {
  try {
    const { sessionId, answers } = req.body;
    const session = requireSession(sessionId);
    const quiz = session.lesson.quiz || [];
    const { topic } = session.lesson;

    if (!quiz.length) {
      return res.status(400).json({ error: "No quiz was generated for this session." });
    }

    const gradingInput = quiz.map((q) => ({
      id: q.id,
      concept: q.concept,
      prompt: q.prompt,
      correctAnswer: q.correctAnswer,
      studentAnswer: answers?.[q.id] ?? "",
    }));

    const report = await chatForJSON([
      {
        role: "system",
        content:
          "You are an AI teacher grading a student's final assessment and producing a learning report.",
      },
      {
        role: "user",
        content: `Topic: ${topic}
Grade each answer against the expected correct answer (allow reasonable paraphrasing as correct).
Questions and answers: ${JSON.stringify(gradingInput)}

Return JSON with this exact shape:
{
  "score": number,               // percentage 0-100
  "perQuestion": [
    { "id": string, "correct": boolean, "feedback": string }
  ],
  "strongAreas": [string],
  "weakAreas": [string],
  "recommendation": string,
  "suggestedNextTopic": string
}`,
      },
    ]);

    session.profile.topicsStudied.push(topic);
    session.profile.scores.push({ topic, score: report.score, date: Date.now() });
    report.strongAreas?.forEach((a) => {
      if (!session.profile.strongConcepts.includes(a)) session.profile.strongConcepts.push(a);
    });
    report.weakAreas?.forEach((a) => {
      if (!session.profile.weakConcepts.includes(a)) session.profile.weakConcepts.push(a);
    });

    res.json({ ...report, profile: session.profile });
  } catch (err) {
    next(err);
  }
});

export default router;
