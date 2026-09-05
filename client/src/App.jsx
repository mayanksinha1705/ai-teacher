import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import MaterialUpload from "./components/MaterialUpload.jsx";
import TopicSelector from "./components/TopicSelector.jsx";
import LessonPlan from "./components/LessonPlan.jsx";
import LessonStep from "./components/LessonStep.jsx";
import Assessment from "./components/Assessment.jsx";
import TrugenTeacher from "./components/TrugenTeacher.jsx";
import TeachingStage from "./components/TeachingStage.jsx";
import LearnerProfile from "./components/LearnerProfile.jsx";
import ZoomControl from "./components/ZoomControl.jsx";
import {
  createSession,
  generateLessonPlan,
  getLessonStep,
  submitAnswer,
  advanceLesson,
  generateAssessment,
  submitAssessment,
} from "./api.js";
import { loadProfile, recordAssessment } from "./profile.js";

// Screens: setup -> planning -> plan -> teaching -> assessing -> report
function App() {
  const [sessionId, setSessionId] = useState(null);
  const [screen, setScreen] = useState("setup");
  const [error, setError] = useState(null);

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [timeAvailable, setTimeAvailable] = useState("20 minutes");
  const [language, setLanguage] = useState("English");
  const [hasMaterial, setHasMaterial] = useState(false);

  const [lessonPlan, setLessonPlan] = useState(null); // { topic, concepts }
  const [step, setStep] = useState(null);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [report, setReport] = useState(null);

  const [profile, setProfile] = useState(loadProfile());

  // Whole-page zoom (a stand-in for the browser's own Ctrl/Cmd +/- zoom,
  // but exposed as an always-visible on-screen control - see the
  // ZoomControl in the corner). Persisted so it survives a refresh.
  // Applied to <html> via the CSS `zoom` property, which - unlike
  // transform: scale() - reflows layout and viewport units (vh/vw)
  // correctly, the same way native browser zoom does. This scales the
  // *entire* app, including the AI Teacher avatar panel, since there's
  // no way to reach into that third-party widget's own internal sizing.
  const ZOOM_MIN = 0.75;
  const ZOOM_MAX = 1.5;
  const ZOOM_STEP = 0.1;
  const [zoom, setZoom] = useState(() => {
    const saved = Number(localStorage.getItem("aiTeacherZoom"));
    return saved >= ZOOM_MIN && saved <= ZOOM_MAX ? saved : 1;
  });

  useEffect(() => {
    document.documentElement.style.zoom = zoom;
    localStorage.setItem("aiTeacherZoom", String(zoom));
  }, [zoom]);

  const round2 = (n) => Math.round(n * 100) / 100;
  const handleZoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, round2(z + ZOOM_STEP)));
  const handleZoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, round2(z - ZOOM_STEP)));
  const handleZoomReset = () => setZoom(1);

  useEffect(() => {
    createSession()
      .then((res) => setSessionId(res.sessionId))
      .catch((err) => setError(err.message));
  }, []);

  const isSessionError = (err) =>
    typeof err?.message === "string" && err.message.toLowerCase().includes("session not found");

  // Creates a fresh session and updates state. Used both for manual recovery
  // (below) and by MaterialUpload, which retries its own upload once the
  // fresh session exists.
  const recoverSession = async () => {
    const res = await createSession();
    setSessionId(res.sessionId);
    setHasMaterial(false);
    return res.sessionId;
  };

  // Shared error handling for every backend call. If the backend lost the
  // in-memory session (e.g. it restarted mid-lesson — this happens with
  // `npm run dev`'s file-watch restarts), there is no way to safely resume
  // where we left off, so we start a new session and send the student back
  // to setup with a clear explanation instead of leaving them stuck.
  const handleApiError = async (err, resetToSetup = true) => {
    if (isSessionError(err)) {
      try {
        await recoverSession();
      } catch {
        // ignore — the error banner below still informs the student
      }
      setScreen("setup");
      setLessonPlan(null);
      setStep(null);
      setEvaluation(null);
      setQuizQuestions([]);
      setReport(null);
      setError(
        "Your session was reset because the backend restarted. A new session has started — please set up your lesson again."
      );
    } else {
      setError(err.message);
      if (resetToSetup) setScreen("setup");
    }
  };

  const handleStart = async () => {
    setError(null);
    setScreen("planning");
    try {
      const plan = await generateLessonPlan(sessionId, { topic, level, timeAvailable, language });
      setLessonPlan(plan);
      setScreen("plan");
    } catch (err) {
      await handleApiError(err);
    }
  };

  const loadNextStep = async () => {
    setError(null);
    try {
      const nextStep = await getLessonStep(sessionId);
      setStudentAnswer("");
      setEvaluation(null);
      if (nextStep.done) {
        setScreen("assessing");
        const quiz = await generateAssessment(sessionId);
        setQuizQuestions(quiz.questions);
      } else {
        setStep(nextStep);
        setScreen("teaching");
      }
    } catch (err) {
      await handleApiError(err, false);
    }
  };

  const handleBeginLesson = () => {
    loadNextStep();
  };

  const handleSubmitAnswer = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitAnswer(sessionId, step.question, studentAnswer);
      setEvaluation(result);
    } catch (err) {
      await handleApiError(err, false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setEvaluation(null);
    setStudentAnswer("");
  };

  const handleContinue = async () => {
    setError(null);
    try {
      await advanceLesson(sessionId);
      loadNextStep();
    } catch (err) {
      await handleApiError(err, false);
    }
  };

  const handleSubmitAssessment = async (answers) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitAssessment(sessionId, answers);
      setReport(result);
      const updated = recordAssessment(
        lessonPlan.topic,
        result.score,
        result.strongAreas,
        result.weakAreas
      );
      setProfile(updated);
      setScreen("report");
    } catch (err) {
      await handleApiError(err, false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setScreen("setup");
    setTopic("");
    setLessonPlan(null);
    setStep(null);
    setEvaluation(null);
    setQuizQuestions([]);
    setReport(null);
  };

  const learningStatus =
    {
      setup: "Setting Up",
      planning: "Planning Lesson",
      plan: "Plan Ready",
      teaching: "In Progress",
      assessing: "Assessment",
      report: "Completed",
    }[screen] || "Idle";

  return (
    <div className="shell">
      <div className="app">
        <Header />

        {error && <div className="error-banner">{error}</div>}

        <main className="main main-wide">
        {screen === "setup" && (
          <div className="hero">
            <h1 className="hero-title">
              Configure your personalized <span className="hero-accent">AI lesson</span>
            </h1>
            <p className="hero-subtitle">
              Tell your AI Teacher what to teach, at what level, and how much time you have.
            </p>
          </div>
        )}

        <div className="stat-strip">
          <div className="stat-chip">
            <span className="status-label">Current Topic</span>
            <span className="status-value">{lessonPlan?.topic || topic || "—"}</span>
          </div>
          <div className="stat-chip">
            <span className="status-label">Learning Level</span>
            <span className="status-value">{level}</span>
          </div>
          <div className="stat-chip">
            <span className="status-label">Learning Status</span>
            <span className="status-value status-active">{learningStatus}</span>
          </div>
          {screen === "teaching" && step && (
            <div className="stat-chip">
              <span className="status-label">Lesson Progress</span>
              <span className="status-value">
                {step.progress.index + 1} / {step.progress.total}
              </span>
            </div>
          )}
        </div>

        {screen !== "setup" && screen !== "report" && (
          <button type="button" className="end-button exit-button" onClick={handleRestart}>
            Exit to Setup
          </button>
        )}

        {screen === "setup" && (
          <>
            {sessionId && (
              <MaterialUpload
                sessionId={sessionId}
                onUploaded={() => setHasMaterial(true)}
                onSessionExpired={recoverSession}
              />
            )}
            <TopicSelector
              topic={topic}
              onTopicChange={setTopic}
              level={level}
              onLevelChange={setLevel}
              timeAvailable={timeAvailable}
              onTimeChange={setTimeAvailable}
              language={language}
              onLanguageChange={setLanguage}
              onStart={handleStart}
              starting={screen === "planning"}
              hasMaterial={hasMaterial}
            />
          </>
        )}

        {screen === "planning" && <p className="loading-text">Designing your lesson plan…</p>}

        {screen === "plan" && lessonPlan && (
          <LessonPlan topic={lessonPlan.topic} concepts={lessonPlan.concepts} onBegin={handleBeginLesson} />
        )}

        {screen === "teaching" && (
          <div className="classroom-layout-teaching">
            <TeachingStage sessionId={sessionId} step={step} />
            <LessonStep
              step={step}
              studentAnswer={studentAnswer}
              onAnswerChange={setStudentAnswer}
              onSubmitAnswer={handleSubmitAnswer}
              submitting={submitting}
              evaluation={evaluation}
              onContinue={handleContinue}
              onRetry={handleRetry}
            />
          </div>
        )}

        {screen === "assessing" && !report && (
          <div className="classroom-layout-teaching">
            {quizQuestions.length > 0 ? (
              <Assessment
                questions={quizQuestions}
                onSubmit={handleSubmitAssessment}
                submitting={submitting}
                report={null}
              />
            ) : (
              <p className="loading-text">Preparing your final assessment…</p>
            )}
          </div>
        )}

        {screen === "report" && report && (
          <>
            <Assessment questions={[]} onSubmit={() => {}} submitting={false} report={report} />
            <button type="button" className="start-button" onClick={handleRestart}>
              Learn Something Else
            </button>
          </>
        )}

        <LearnerProfile profile={profile} />
        </main>
      </div>

      {/* The TruGen avatar: a single, always-mounted teacher panel docked to
          the right of the classroom on desktop (see ".teacher-panel" in
          index.css), collapsing to a floating widget on small screens. It
          never unmounts as screens change, so a live conversation is never
          interrupted. */}
      <TrugenTeacher />

      <ZoomControl
        zoom={zoom}
        min={ZOOM_MIN}
        max={ZOOM_MAX}
        step={ZOOM_STEP}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleZoomReset}
      />
    </div>
  );
}

export default App;
