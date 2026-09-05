// Simple in-memory session store. No database — resets when the server restarts.
// Each session tracks: uploaded material chunks, the generated lesson plan,
// progress through concepts, and a running learner profile.

const sessions = new Map();

export function createSession(id) {
  const session = {
    id,
    createdAt: Date.now(),
    material: {
      fileName: null,
      chunks: [], // [{ id, text, vector }]
    },
    lesson: {
      topic: null,
      level: "Beginner",
      language: "English",
      timeAvailable: "20 minutes",
      concepts: [], // [{ id, title, summary, status: 'pending'|'understood'|'weak' }]
      currentIndex: 0,
    },
    profile: {
      topicsStudied: [],
      scores: [], // [{ topic, score, date }]
      strongConcepts: [],
      weakConcepts: [],
    },
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id) {
  return sessions.get(id);
}

export function requireSession(id) {
  const session = sessions.get(id);
  if (!session) {
    const err = new Error("Session not found. Create a session first.");
    err.status = 404;
    throw err;
  }
  return session;
}
