const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request to ${path} failed (${res.status})`);
  }
  return data;
}

export function checkHealth() {
  return request("/health", { method: "GET" });
}

export function createSession() {
  return request("/session", { method: "POST" });
}

export function uploadMaterial(sessionId, file) {
  const form = new FormData();
  form.append("sessionId", sessionId);
  form.append("file", file);
  return request("/upload", { method: "POST", body: form });
}

export function generateLessonPlan(sessionId, { topic, level, timeAvailable, language }) {
  return request("/lesson/plan", {
    method: "POST",
    body: JSON.stringify({ sessionId, topic, level, timeAvailable, language }),
  });
}

export function getLessonStep(sessionId) {
  return request("/lesson/step", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
}

// Asks the backend to have Ollama plan the explanation/example visuals for
// the concept currently being taught. See server/src/visualPlanner.js.
export function getVisualBeats(sessionId, { conceptTitle, explanation, example, visualSuggestion }) {
  return request("/lesson/visual-beats", {
    method: "POST",
    body: JSON.stringify({ sessionId, conceptTitle, explanation, example, visualSuggestion }),
  });
}

export function submitAnswer(sessionId, question, studentAnswer) {
  return request("/lesson/answer", {
    method: "POST",
    body: JSON.stringify({ sessionId, question, studentAnswer }),
  });
}

export function advanceLesson(sessionId) {
  return request("/lesson/advance", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
}

export function generateAssessment(sessionId) {
  return request("/assessment/generate", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
}

export function submitAssessment(sessionId, answers) {
  return request("/assessment/submit", {
    method: "POST",
    body: JSON.stringify({ sessionId, answers }),
  });
}
