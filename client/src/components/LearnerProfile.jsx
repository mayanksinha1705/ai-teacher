import SectionTag from "./SectionTag.jsx";

function LearnerProfile({ profile }) {
  if (!profile.topicsStudied.length) return null;

  const avgScore =
    profile.scores.reduce((sum, s) => sum + s.score, 0) / (profile.scores.length || 1);

  return (
    <section className="learner-profile">
      <SectionTag index="06" label="LEARNER PROFILE" />
      <div className="profile-grid">
        <div className="profile-item">
          <span className="status-label">Topics Studied</span>
          <span className="status-value">{profile.topicsStudied.length}</span>
        </div>
        <div className="profile-item">
          <span className="status-label">Average Score</span>
          <span className="status-value">{Math.round(avgScore)}%</span>
        </div>
        <div className="profile-item">
          <span className="status-label">Weak Concepts</span>
          <span className="status-value">
            {profile.weakConcepts.slice(-5).join(", ") || "—"}
          </span>
        </div>
      </div>
    </section>
  );
}

export default LearnerProfile;
