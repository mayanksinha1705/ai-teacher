# AI Teacher — Full-Stack Prototype

A working AI Teacher app: a real TruGen avatar for live voice interaction,
plus a lightweight backend that actually generates lesson plans, teaches
concept-by-concept, asks comprehension questions, detects misconceptions,
and runs a final graded assessment — all powered by a **locally running
Ollama model**, with no external API keys.

## Design

The UI follows an "Obsidian Intelligence" workstation aesthetic: a dark
obsidian canvas (`#0A0D12`), elevated slate surfaces, and a single electric
mint accent (`#11E59E`) reserved for primary actions and live-state
indicators. Plus Jakarta Sans carries all natural-language content;
JetBrains Mono is used sparingly for technical labels (section tags,
progress chips, format badges) to reinforce the "workstation" feel. The
nav bar includes a live engine-status pill that pings the backend's
`/api/health` endpoint — it reflects whether Ollama is actually reachable,
not a static decoration.

## Tech stack

**Client** (`/client`)
- React + Vite (JavaScript), plain CSS
- `@aiteammate/agent-widget` — the real TruGen avatar (voice conversation)
- `localStorage` for a lightweight learner profile (topics studied, scores, weak concepts)

**Server** (`/server`)
- Node.js + Express
- `multer` for file uploads, `pdf-parse` / `mammoth` for text extraction
- A dependency-free **TF-IDF retrieval layer** (`rag.js`) — chunks uploaded
  material and retrieves the most relevant chunks for grounding, without
  needing a vector database
- In-memory session store (no database — resets on server restart)
- Calls a **local Ollama server** for every generation/grading step

**LLM**
- [Ollama](https://ollama.com) running locally
- Model: `gpt-oss:120b-cloud` (Ollama's cloud-hosted large model, accessed
  through your local Ollama installation)

## How it works end-to-end

1. Student optionally uploads material (PDF/DOCX/TXT) — the server extracts
   and chunks the text and indexes it with TF-IDF (real retrieval, no
   hallucinated "RAG").
2. Student enters a topic (or relies on the uploaded material), picks a
   **Learning Level**, **Time Available**, and **Teaching Language**, and
   clicks **Start Learning**.
3. The backend asks the local LLM to generate a structured lesson plan
   (grounded in retrieved material excerpts when available).
4. The student steps through the plan one concept at a time: the LLM
   generates an explanation, an example, a suggested visual, and one
   comprehension question per concept.
5. The student answers; the LLM grades it, explains any misconception, and
   either advances or re-explains with a different analogy — this is real
   adaptive behavior, not scripted branching.
6. After all concepts, the backend generates a short final assessment,
   grades it, and returns a report (score, strong/weak areas, a
   recommendation, and a suggested next topic).
7. Throughout the lesson, the real TruGen avatar is mounted for live voice
   conversation, running independently of the generated lesson text.

## Known, honest limitations

- The TruGen avatar's own voice conversation is **not** automatically fed
  the generated lesson script — TruGen's public integration only exposes an
  `agentId`, with no documented API to inject dynamic lesson content into
  its speech. The avatar is available for live Q&A alongside the lesson;
  the structured teaching flow (explanations, questions, assessment) is
  rendered as UI content next to it. If TruGen later exposes an API for
  feeding it context, this is the natural place to wire it in.
- Retrieval is TF-IDF, not embeddings — good enough for grounding a single
  document per session without adding a vector database, but not
  state-of-the-art semantic search.
- Session state is in-memory only; restarting the server clears all active
  lessons (by design — no database, per project scope). The learner profile
  in the browser's `localStorage` persists independently of the server.
  If the backend restarts mid-session (e.g. `npm run dev`'s file-watch
  restarts, or `npm start` being stopped and re-run), the frontend detects
  the resulting "session not found" error, transparently starts a new
  session, and — for material uploads — retries automatically since the
  file is still in the browser. For any other in-progress step, the student
  is returned to setup with a clear message, since there is no safe way to
  resume a lesson plan that only existed in the old session's memory.

## Prerequisites

1. **Node.js 18+** (for both client and server)
2. **Ollama** installed and running locally:
   ```bash
   ollama serve
   ```
3. The model pulled and available:
   ```bash
   ollama pull gpt-oss:120b-cloud
   ```

## Setup & run

Open **two terminals**.

### Terminal 1 — backend
```bash
cd server
npm install
npm run dev
```
This starts the API on `http://localhost:8787` and prints which Ollama
URL/model it's configured for. Copy `.env.example` to `.env` first if you
want to override the defaults (different port, different model name, etc.):
```bash
cp .env.example .env
```

### Terminal 2 — frontend
```bash
cd client
npm install
npm run dev
```
Open the printed URL (typically `http://localhost:5173`). The Vite dev
server proxies all `/api/*` calls to the backend automatically.

## Project structure

```
ai-teacher/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── MaterialUpload.jsx
│   │   │   ├── TopicSelector.jsx
│   │   │   ├── LessonPlan.jsx
│   │   │   ├── LessonStep.jsx
│   │   │   ├── Assessment.jsx
│   │   │   ├── LearnerProfile.jsx
│   │   │   └── TrugenTeacher.jsx
│   │   ├── api.js          # backend API client
│   │   ├── profile.js       # localStorage learner profile
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── upload.js
│   │   │   ├── lesson.js
│   │   │   └── assessment.js
│   │   ├── index.js
│   │   ├── ollama.js        # Ollama chat client
│   │   ├── rag.js           # TF-IDF chunking + retrieval
│   │   ├── store.js         # in-memory sessions
│   │   └── textExtract.js   # pdf/docx/txt extraction
│   ├── .env.example
│   └── package.json
└── README.md
```

## API summary (backend)

| Method | Path                    | Purpose                                    |
|--------|-------------------------|---------------------------------------------|
| GET    | `/api/health`           | Check server + Ollama config                |
| POST   | `/api/session`          | Create a new in-memory session               |
| POST   | `/api/upload`           | Upload & index material (multipart/form)     |
| POST   | `/api/lesson/plan`      | Generate the lesson plan                     |
| POST   | `/api/lesson/step`      | Get the next concept's explanation+question  |
| POST   | `/api/lesson/answer`    | Grade an answer, detect misconceptions       |
| POST   | `/api/lesson/advance`   | Move to the next concept                     |
| POST   | `/api/assessment/generate` | Generate the final quiz                  |
| POST   | `/api/assessment/submit`   | Grade the quiz, return the report        |

## Troubleshooting

- **"Could not reach Ollama..."** — make sure `ollama serve` is running and
  the model is pulled (`ollama pull gpt-oss:120b-cloud`), and that
  `OLLAMA_URL`/`OLLAMA_MODEL` in `server/.env` (if you created one) match
  your local setup.
- **Model returns invalid JSON occasionally** — the backend already retries
  once automatically; if it still fails, try a lower-variance prompt (edit
  the `temperature` in `server/src/ollama.js`) or a different model.
#   a i - t e a c h e r  
 