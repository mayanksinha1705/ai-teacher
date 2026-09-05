import { useRef, useState } from "react";
import { uploadMaterial } from "../api.js";
import SectionTag from "./SectionTag.jsx";

function MaterialUpload({ sessionId, onUploaded, onSessionExpired }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | uploading | done | error
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setStatus("uploading");
    setError(null);
    try {
      const result = await uploadMaterial(sessionId, file);
      setFileName(result.fileName);
      setStatus("done");
      onUploaded(result);
    } catch (err) {
      const isSessionError =
        typeof err.message === "string" && err.message.toLowerCase().includes("session not found");

      if (isSessionError && onSessionExpired) {
        // The backend restarted and lost our session. We still have the
        // file in hand, so get a fresh session and retry once silently.
        try {
          const freshSessionId = await onSessionExpired();
          const result = await uploadMaterial(freshSessionId, file);
          setFileName(result.fileName);
          setStatus("done");
          onUploaded(result);
          return;
        } catch (retryErr) {
          setStatus("error");
          setError(retryErr.message);
          return;
        }
      }

      setStatus("error");
      setError(err.message);
    }
  };

  return (
    <section className="material-upload">
      <SectionTag index="01" label="TEACH FROM MATERIAL" trailing="Optional" />

      <div className="format-chips">
        <span className="format-chip">.PDF</span>
        <span className="format-chip">.DOCX</span>
        <span className="format-chip">.TXT / .MD</span>
      </div>

      <label
        className={`dropzone ${dragOver ? "dropzone-active" : ""} ${status === "done" ? "dropzone-done" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="dropzone-input"
        />
        <div className="dropzone-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 16V4m0 0-4 4m4-4 4 4M5 16.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {status === "idle" && (
          <>
            <span className="dropzone-title">Drag and drop your material here</span>
            <span className="dropzone-hint">or click to browse files</span>
          </>
        )}
        {status === "uploading" && <span className="dropzone-title">Reading and indexing…</span>}
        {status === "done" && (
          <span className="dropzone-title dropzone-success">Loaded: {fileName}</span>
        )}
        {status === "error" && <span className="dropzone-title dropzone-error">{error}</span>}
      </label>
    </section>
  );
}

export default MaterialUpload;
