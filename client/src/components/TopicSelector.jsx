import SectionTag from "./SectionTag.jsx";

const SUGGESTED_TOPICS = ["Mathematics", "Physics", "Data Structures", "Programming"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const TIME_OPTIONS = ["5 minutes", "20 minutes", "60 minutes", "7 days"];
const LANGUAGES = ["English", "Hindi", "Hinglish", "Spanish", "French"];

function PillGroup({ label, options, value, onChange }) {
  return (
    <div className="pill-group">
      <span className="pill-group-label">{label}</span>
      <div className="pill-options">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`pill ${value === opt ? "pill-active" : ""}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TopicSelector({
  topic,
  onTopicChange,
  level,
  onLevelChange,
  timeAvailable,
  onTimeChange,
  language,
  onLanguageChange,
  onStart,
  starting,
  hasMaterial,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onStart();
  };

  const canStart = (topic.trim() || hasMaterial) && !starting;

  return (
    <section className="topic-selector">
      <SectionTag index="02" label="TOPIC & PROFILE" />

      <form className="topic-form" onSubmit={handleSubmit}>
        <label htmlFor="topic-input" className="topic-label">
          What do you want to learn today?
        </label>
        <input
          id="topic-input"
          type="text"
          className="topic-input"
          placeholder="e.g. Teach me Ohm's Law"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
        />

        <div className="suggested-chips">
          {SUGGESTED_TOPICS.map((item) => (
            <button
              key={item}
              type="button"
              className="chip"
              onClick={() => onTopicChange(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <PillGroup label="Learning Level" options={LEVELS} value={level} onChange={onLevelChange} />
        <PillGroup
          label="Time Available"
          options={TIME_OPTIONS}
          value={timeAvailable}
          onChange={onTimeChange}
        />
        <PillGroup
          label="Teaching Language"
          options={LANGUAGES}
          value={language}
          onChange={onLanguageChange}
        />

        <button type="submit" className="start-button" disabled={!canStart}>
          {starting ? "Generating lesson plan…" : "Start Learning"}
        </button>
        {!topic.trim() && !hasMaterial && (
          <p className="upload-hint">Enter a topic or upload material above to begin.</p>
        )}
      </form>
    </section>
  );
}

export default TopicSelector;
