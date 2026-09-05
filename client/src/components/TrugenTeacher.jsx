import "@aiteammate/agent-widget/styles.css";
import { TrugenAgentWidget } from "@aiteammate/agent-widget";

const TRUGEN_AGENT_ID = "2a1389b1-0b60-4e72-b745-e912a38731e5";

/**
 * The TruGen avatar - configured as a Widget (not Full View) in the TruGen
 * dashboard. It is mounted exactly once here, at the App root, and lives
 * for the entire session (setup -> plan -> classroom -> assessment): only
 * this wrapper's position/size is ever touched via CSS, so a live TruGen
 * conversation is never interrupted by screen navigation.
 *
 * No extra header, title bar, or card chrome is added around it - the
 * widget already renders its own "AI Teacher / Online" header, video,
 * call controls, and chat panel. This component only sizes and positions
 * the container it lives in (see ".teacher-panel" / ".trugen-float" in
 * index.css): a full-height docked column on desktop (~25-30% of the
 * viewport width, so the teacher reads as a permanent part of the
 * classroom rather than a small floating chatbot), collapsing to a
 * corner-pinned floating widget on narrow/mobile screens so the lesson
 * underneath stays usable.
 *
 * We previously tried to detect the widget's own internal fullscreen
 * toggle (by watching its DOM for an inline `position: fixed` style) and
 * mirror that onto <body>, so a real fullscreen call UI could take over
 * the whole page. That check was unreliable: the widget's own normal,
 * non-fullscreen floating UI (its idle avatar bubble, greeting balloon,
 * Talk/Chat buttons) also uses inline `position: fixed`, so it false-
 * triggered on every mount and blanked the classroom behind an opaque
 * full-screen panel. Removed - the docked panel is already large enough
 * by default that this extra "expand" behavior isn't needed.
 */
function TrugenTeacher() {
  return (
    <div className="trugen-float teacher-panel">
      <div className="avatar-widget-frame">
        <p className="avatar-placeholder-text" aria-hidden="true">
          AI Teacher will appear here
        </p>
        <TrugenAgentWidget agentId={TRUGEN_AGENT_ID} />
      </div>
    </div>
  );
}

export default TrugenTeacher;
