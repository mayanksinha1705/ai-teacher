# 🎓 AI Teacher

> **A human-like, personalized AI educator that teaches from uploaded learning materials and adapts to the student.**

AI Teacher is a full-stack AI learning platform built for the **AI Innovation Hackathon 2026**.

Instead of functioning as a basic Q&A chatbot, AI Teacher follows a structured teaching loop:

**Understand → Plan → Explain → Demonstrate → Question → Evaluate → Adapt → Continue**

Students can upload study materials or enter a topic, choose their learning level, available time, and language, and receive a structured learning experience with AI-generated explanations, visual learning, interactive questions, misconception detection, adaptive re-explanation, and final assessment.

---

## ✨ Key Features

### 📚 Learn From Your Materials

Upload learning materials in:

- PDF
- DOCX
- TXT

The system extracts and indexes the content, then retrieves relevant sections to ground AI-generated lessons.

### 🧠 AI-Powered Lesson Planning

AI Teacher dynamically generates a structured learning roadmap based on:

- Topic
- Uploaded material
- Learning level
- Available time
- Teaching language

### 👩‍🏫 Human-Like AI Teacher

A real **TruGen AI avatar** provides voice-based interaction and acts as the AI Teacher during the learning session.

### 🎨 Visual Learning

Concepts can be presented through visual learning elements such as:

- Flowcharts
- Diagrams
- Graphs
- Mathematical representations
- Concept structures

### ❓ Interactive Questions

The AI asks comprehension questions throughout the lesson instead of simply providing information.

### 🔍 Misconception Detection

The system evaluates student answers and can identify incorrect reasoning rather than only checking whether an answer is correct.

### 🔄 Adaptive Teaching

When a misconception is detected, AI Teacher can:

1. Identify the problem
2. Re-explain the concept
3. Use a different explanation or analogy
4. Provide another example
5. Ask a new question
6. Re-evaluate understanding

### 📝 Final Assessment

At the end of the lesson, the system generates an assessment and provides:

- Score
- Strong concepts
- Weak concepts
- Revision recommendations
- Suggested next topic

---

# 🧠 How It Works

```text
Student
   │
   ├── Upload Material
   │       OR
   └── Enter Topic
          │
          ▼
   Personalization
   ├── Learning Level
   ├── Time Available
   └── Language
          │
          ▼
   AI Lesson Planner
          │
          ▼
   RAG / Material Retrieval
          │
          ▼
   Structured Lesson
          │
          ▼
   ┌─────────────────────────┐
   │ Explain → Demonstrate   │
   │          ↓              │
   │ Ask Question            │
   │          ↓              │
   │ Evaluate Answer         │
   │          ↓              │
   │ Adapt / Re-explain      │
   └─────────────────────────┘
          │
          ▼
   Final Assessment
          │
          ▼
   Learning Feedback
   ├── Score
   ├── Weak Areas
   ├── Revision
   └── Next Topic
```

---

# 🛠️ Technology Stack

## Frontend

- React
- Vite
- JavaScript
- CSS
- TruGen AI Agent Widget
- localStorage for learner profile

## Backend

- Node.js
- Express
- Multer
- PDF parsing
- DOCX extraction
- TF-IDF based retrieval
- In-memory session management

## AI

- Ollama
- `gpt-oss:120b-cloud`

## AI Avatar & Voice

- TruGen AI

---

# 📖 RAG Pipeline

AI Teacher uses a lightweight retrieval pipeline for uploaded learning materials.

```text
PDF / DOCX / TXT
       │
       ▼
Text Extraction
       │
       ▼
Text Chunking
       │
       ▼
TF-IDF Indexing
       │
       ▼
Relevant Chunk Retrieval
       │
       ▼
LLM Prompt
       │
       ▼
Grounded Lesson
```

The current prototype uses **TF-IDF retrieval instead of a vector database** to keep the system lightweight and easy to run.

---

# 🚀 Getting Started

## Prerequisites

- Node.js 18+
- Ollama
- `gpt-oss:120b-cloud`

Start Ollama:

```bash
ollama serve
```

Make sure the model is available:

```bash
ollama pull gpt-oss:120b-cloud
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/mayanksinha1705/ai-teacher.git
cd ai-teacher
```

---

## 2. Start the Backend

```bash
cd server
npm install
npm run dev
```

The backend runs on:

```text
http://localhost:8787
```

If required, create your environment file:

```bash
cp .env.example .env
```

---

## 3. Start the Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend normally runs on:

```text
http://localhost:5173
```

---

# 📁 Project Structure

```text
ai-teacher/
│
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
│   │   │
│   │   ├── api.js
│   │   ├── profile.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── upload.js
│   │   │   ├── lesson.js
│   │   │   └── assessment.js
│   │   │
│   │   ├── index.js
│   │   ├── ollama.js
│   │   ├── rag.js
│   │   ├── store.js
│   │   └── textExtract.js
│   │
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

# 🔌 API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend and Ollama |
| POST | `/api/session` | Create learning session |
| POST | `/api/upload` | Upload and index material |
| POST | `/api/lesson/plan` | Generate lesson roadmap |
| POST | `/api/lesson/step` | Generate teaching step |
| POST | `/api/lesson/answer` | Evaluate student answer |
| POST | `/api/lesson/advance` | Advance lesson |
| POST | `/api/assessment/generate` | Generate final assessment |
| POST | `/api/assessment/submit` | Grade assessment |

---

# 🎯 Example Learning Flow

```text
Upload Physics Notes
        ↓
Select Beginner
        ↓
Select 10 Minutes
        ↓
Generate Lesson Roadmap
        ↓
Learn Concept
        ↓
Visual Explanation
        ↓
AI Teacher Interaction
        ↓
Comprehension Question
        ↓
Student Answer
        ↓
AI Evaluation
        ↓
Misconception Detected
        ↓
Adaptive Re-explanation
        ↓
New Question
        ↓
Final Assessment
        ↓
Learning Report
```

---

# 🏆 AI Innovation Hackathon 2026

**Project:** AI Teacher  
**Category:** AI / Education  
**Event:** Bharat Academix AI Innovation Hackathon 2026

AI Teacher was built to demonstrate how AI can move beyond simple question answering toward **structured, interactive, personalized, and adaptive teaching**.

---

# 🔐 Security

Environment variables and API keys should never be committed to the repository.

Create:

```text
server/.env
```

using:

```text
server/.env.example
```

Make sure `.env` is included in `.gitignore`.

---

# ⚠️ Current Prototype Limitations

### TruGen Integration

The TruGen avatar currently provides live voice interaction, but the generated lesson content is not automatically injected into TruGen's conversation.

The structured teaching engine and TruGen avatar therefore operate alongside each other.

### Retrieval

The current RAG implementation uses TF-IDF retrieval rather than embedding-based semantic search or a vector database.

### Session Storage

Learning sessions are currently stored in memory and are cleared when the backend restarts.

The learner profile is stored separately in the browser using `localStorage`.

---

# 📺 Demo

**Demo Video:**  
[Click here to watch demo video.](https://youtu.be/4luB5zCSsKw)
https://youtu.be/4luB5zCSsKw

---

# 👥 Team - Codewithmay 

**Team Leader:** Mayank Sinha

---

# 📌 Project Status

**Working Hackathon Prototype**

The current prototype includes:

- Document ingestion
- Material retrieval
- AI lesson planning
- Personalized learning
- Concept-by-concept teaching
- Visual explanations
- Interactive questions
- Answer evaluation
- Misconception detection
- Adaptive re-explanation
- Final assessment
- Learning feedback
- AI avatar and voice interaction

---

## ⭐ Built for AI Innovation Hackathon 2026

**AI Teacher — Making AI learn like a teacher, not just answer like a chatbot.**
