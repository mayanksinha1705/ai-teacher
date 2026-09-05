function LessonStep({
  step,
  studentAnswer,
  onAnswerChange,
  onSubmitAnswer,
  submitting,
  evaluation,
  onContinue,
  onRetry,
}) {
  if (!step) return null;

  const { conceptTitle, progress, explanation, example, visualSuggestion, question } = step;

  return (
    <div className="lesson-step">
      <div className="section-tag-row">
        <span className="section-tag">LIVE SESSION</span>
        <span className="step-progress-chip">
          Concept {progress.index + 1} / {progress.total}
        </span>
      </div>

      <h3 className="step-concept-title">{conceptTitle}</h3>

      <p className="step-explanation">{explanation}</p>

      {example && (
        <div className="step-example">
          <span className="step-tag">Example</span>
          <p>{example}</p>
        </div>
      )}

      {visualSuggestion && (
        <div className="step-visual">
          <span className="step-tag">Suggested visual</span>
          <p>{visualSuggestion}</p>
        </div>
      )}

      {!evaluation && question && (
        <form
          className="question-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitAnswer();
          }}
        >
          <span className="step-tag">Question</span>
          <p className="question-prompt">{question.prompt}</p>

          {question.type === "mcq" && question.options?.length > 0 ? (
            <div className="mcq-options">
              {question.options.map((opt) => (
                <label key={opt} className="mcq-option">
                  <input
                    type="radio"
                    name="mcq"
                    value={opt}
                    checked={studentAnswer === opt}
                    onChange={(e) => onAnswerChange(e.target.value)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              className="topic-input"
              placeholder="Type your answer…"
              value={studentAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
            />
          )}

          <button type="submit" className="start-button" disabled={!studentAnswer.trim() || submitting}>
            {submitting ? "Checking…" : "Submit Answer"}
          </button>
        </form>
      )}

      {evaluation && (
        <div className={`evaluation evaluation-${evaluation.verdict}`}>
          <span className="step-tag">
            {evaluation.verdict === "correct" ? "Correct" : evaluation.verdict === "partial" ? "Partially correct" : "Not quite"}
          </span>
          <p>{evaluation.feedback}</p>

          {evaluation.misconception && (
            <p className="misconception">Misconception identified: {evaluation.misconception}</p>
          )}

          {evaluation.reexplanation && (
            <div className="reexplanation">
              <span className="step-tag">Let's look at it differently</span>
              <p>{evaluation.reexplanation}</p>
            </div>
          )}

          <div className="evaluation-actions">
            {evaluation.action === "reexplain" && (
              <button type="button" className="end-button" onClick={onRetry}>
                Try Again
              </button>
            )}
            <button type="button" className="start-button" onClick={onContinue}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LessonStep;
