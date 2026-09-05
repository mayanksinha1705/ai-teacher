import { useEffect, useRef, useState } from "react";
import VisualExplanation from "./visuals/VisualExplanation.jsx";
import { getVisualBeats } from "../api.js";

const PHASE_LABELS = {
  explanation: "Teaching",
  example: "Example",
};

// Roughly a natural speaking pace, used only to time how long each beat
// stays on screen. The TruGen widget doesn't expose real speech timing or
// any "I'm done talking" event, so this is a deliberate approximation, not
// a literal sync to the avatar's voice - see the auto-advance effect below.
function estimateNarrationMs(text = "") {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const ms = (words / 2.5) * 1000; // ~150 words per minute
  return Math.min(45000, Math.max(6000, ms));
}

/**
 * The main teaching surface. This is the classroom's dominant screen area:
 * heading, bullets, and the visual/diagram/simulation for the current beat,
 * at full width. The TruGen avatar is no longer docked inside this
 * component - it now lives as an always-mounted floating widget at the App
 * root (see TrugenTeacher.jsx) so it never competes with lesson content
 * for screen space.
 *
 * Each concept has two beats - "explanation" then "example" - planned in
 * one call by the backend's Ollama-driven visualPlanner (see
 * server/src/visualPlanner.js). This component just cycles through them.
 */
function TeachingStage({ sessionId, step }) {
  const [beats, setBeats] = useState(null);
  const [beatIndex, setBeatIndex] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const requestIdRef = useRef(0);
  const timerRef = useRef(null);

  const docked = Boolean(beats && beats.length);
  const currentBeat = beats?.[beatIndex] || null;

  // A new concept starts its own intro -> ready cycle: reset everything and
  // ask the backend to plan this concept's visuals.
  useEffect(() => {
    setBeats(null);
    setBeatIndex(0);
    setLoadFailed(false);

    if (!step || !sessionId) return undefined;

    const requestId = ++requestIdRef.current;
    getVisualBeats(sessionId, {
      conceptTitle: step.conceptTitle,
      explanation: step.explanation,
      example: step.example,
      visualSuggestion: step.visualSuggestion,
    })
      .then((res) => {
        if (requestIdRef.current !== requestId) return; // a newer step superseded this request
        setBeats(Array.isArray(res.beats) && res.beats.length ? res.beats : null);
        if (!res.beats?.length) setLoadFailed(true);
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setLoadFailed(true);
      });
  }, [step?.conceptId, sessionId]);

  // Auto-advance to the next beat after roughly how long its narration
  // would take to say out loud. The student can also step through manually.
  useEffect(() => {
    if (!beats || beatIndex >= beats.length - 1) return undefined;
    timerRef.current = setTimeout(() => {
      setBeatIndex((i) => Math.min(i + 1, beats.length - 1));
    }, estimateNarrationMs(beats[beatIndex]?.narration));
    return () => clearTimeout(timerRef.current);
  }, [beats, beatIndex]);

  const goPrev = () => setBeatIndex((i) => Math.max(0, i - 1));
  const goNext = () => setBeatIndex((i) => (beats ? Math.min(beats.length - 1, i + 1) : i));

  return (
    <div className="teaching-stage teaching-stage-full">
      <div className="stage-content-col">
        {!docked && (
          <p className="teaching-loading-caption">
            {loadFailed ? "Continuing without extra visuals for this step." : "Preparing your lesson visuals…"}
          </p>
        )}

        <div className={`teaching-content ${docked ? "is-visible" : ""}`}>
          {currentBeat && (
            <>
              <div className="teaching-heading-row">
                <span className="teaching-phase-tag">{PHASE_LABELS[currentBeat.phase] || currentBeat.phase}</span>
                <h2 className="teaching-heading">{currentBeat.heading}</h2>
              </div>

              <div className="teaching-body">
                <ul className="teaching-bullets">
                  {currentBeat.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
                <VisualExplanation visual={currentBeat.visual} loading={false} compact />
              </div>

              {beats.length > 1 && (
                <div className="beat-nav">
                  <button
                    type="button"
                    className="beat-nav-button"
                    onClick={goPrev}
                    disabled={beatIndex === 0}
                    aria-label="Previous"
                  >
                    ‹
                  </button>
                  <span className="beat-nav-label">
                    {beatIndex + 1} / {beats.length}
                  </span>
                  <button
                    type="button"
                    className="beat-nav-button"
                    onClick={goNext}
                    disabled={beatIndex === beats.length - 1}
                    aria-label="Next"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeachingStage;
