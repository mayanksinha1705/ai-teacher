import { Component } from "react";

// Any of the seven visualization libraries could throw on bad/unexpected
// data (a hooks-only boundary can't catch render errors from imperative
// libs like Three.js/D3/Cytoscape/JSXGraph, so this has to be a class
// component). Catching here means one broken visual never crashes the
// lesson — the student just sees a plain-language message and the
// TruGen avatar keeps teaching.
class VisualErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Visual renderer crashed:", error, info);
  }

  componentDidUpdate(prevProps) {
    // A new visual (different resetKey) deserves a fresh chance to render,
    // even if the previous one crashed.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="visual-render-state visual-render-error">
          <p>{this.props.fallbackMessage || "Unable to display this visual."}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default VisualErrorBoundary;
