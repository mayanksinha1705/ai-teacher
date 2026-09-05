import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { createSession } from "./store.js";
import uploadRoute from "./routes/upload.js";
import lessonRoute from "./routes/lesson.js";
import assessmentRoute from "./routes/assessment.js";
import { OLLAMA_MODEL, OLLAMA_URL } from "./ollama.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Health check — also confirms which Ollama model/URL this server is configured for.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", ollamaUrl: OLLAMA_URL, ollamaModel: OLLAMA_MODEL });
});

// Create a new learning session (in-memory, no database).
app.post("/api/session", (req, res) => {
  const id = uuidv4();
  createSession(id);
  res.json({ sessionId: id });
});

app.use("/api/upload", uploadRoute);
app.use("/api/lesson", lessonRoute);
app.use("/api/assessment", assessmentRoute);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`AI Teacher backend running on http://localhost:${PORT}`);
  console.log(`Using Ollama at ${OLLAMA_URL} with model "${OLLAMA_MODEL}"`);
});
