import SectionTag from "./SectionTag.jsx";

function LessonPlan({ topic, concepts, onBegin }) {
  return (
    <section className="lesson-plan">
      <SectionTag index="03" label="STRUCTURED ROADMAP" trailing={`${concepts.length} concepts`} />
      <h2 className="lesson-plan-title">{topic}</h2>
      <ol className="concept-list">
        {concepts.map((c) => (
          <li key={c.id} className="concept-item">
            <span className="concept-title">{c.title}</span>
            <span className="concept-summary">{c.summary}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="start-button" onClick={onBegin}>
        Enter Classroom
      </button>
    </section>
  );
}

export default LessonPlan;
