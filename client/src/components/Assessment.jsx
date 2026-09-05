import { useState } from "react";

function MasteryRing({ score }) {
  const pct = Math.max(0, Math.min(100, Math.round(score || 0)));
  return (
    <div className="mastery-ring" style={{ "--pct": pct }}>
      <div className="mastery-ring-inner">
        <span className="mastery-ring-value">{pct}%</span>
        <span className="mastery-ring-label">Mastery</span>
      </div>
    </div>
  );
}

function Assessment({ questions, onSubmit, submitting, report }) {
  const [answers, setAnswers] = useState({});

  const setAnswer = (id, value) => setAnswers((prev) => ({ ...prev, [id]: value }));

  if (report) {
    return (
      <div className="report">
        <div className="section-tag-row">
          <span className="section-tag">05 // LESSON MASTERY SUMMARY</span>
        </div>

        <div className="report-headline">
          <MasteryRing score={report.score} />
          <div className="report-headline-text">
            <h2 className="lesson-plan-title">Assessment Complete</h2>
            <p className="report-sub">
              Here is the cognitive performance breakdown from this session.
            </p>
          </div>
        </div>

        {report.strongAreas?.length > 0 && (
          <div className="report-section">
            <span className="step-tag">Concepts Mastered</span>
            <p>{report.strongAreas.join(", ")}</p>
          </div>
        )}

        {report.weakAreas?.length > 0 && (
          <div className="report-section">
            <span className="step-tag step-tag-warn">Needs Reinforcement</span>
            <p>{report.weakAreas.join(", ")}</p>
          </div>
        )}

        <div className="report-section">
          <span className="step-tag">Recommendation</span>
          <p>{report.recommendation}</p>
        </div>

        {report.suggestedNextTopic && (
          <div className="report-section">
            <span className="step-tag">Suggested Next Topic</span>
            <p>{report.suggestedNextTopic}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      className="assessment"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(answers);
      }}
    >
      <div className="section-tag-row">
        <span className="section-tag">04 // FINAL ASSESSMENT</span>
        <span className="section-tag-trailing">{questions.length} questions</span>
      </div>
      {questions.map((q, i) => (
        <div key={q.id} className="quiz-question">
          <p className="question-prompt">
            {i + 1}. {q.prompt}
          </p>
          {q.type === "mcq" && q.options?.length > 0 ? (
            <div className="mcq-options">
              {q.options.map((opt) => (
                <label key={opt} className="mcq-option">
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              className="topic-input"
              placeholder="Your answer…"
              value={answers[q.id] || ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
            />
          )}
        </div>
      ))}
      <button type="submit" className="start-button" disabled={submitting}>
        {submitting ? "Grading…" : "Submit Assessment"}
      </button>
    </form>
  );
}

export default Assessment;
