import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function buildScene(container, data) {
  const width = container.clientWidth || 400;
  const height = container.clientHeight || 320;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111620);

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.set(4, 3, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const dirLight = new THREE.DirectionalLight(0x11e59e, 1.1);
  dirLight.position.set(5, 8, 5);
  scene.add(dirLight);

  const grid = new THREE.GridHelper(8, 8, 0x263346, 0x1d2530);
  scene.add(grid);

  const group = new THREE.Group();
  scene.add(group);

  let animate;

  if (data?.mode === "orbit") {
    // A simple orbit demo: a central body with a smaller body circling it
    // — useful for gravity/orbital-motion style 3D concepts.
    const centerGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x3d2600, emissiveIntensity: 0.4 });
    group.add(new THREE.Mesh(centerGeo, centerMat));

    const orbiterGeo = new THREE.SphereGeometry(0.28, 24, 24);
    const orbiterMat = new THREE.MeshStandardMaterial({ color: 0x11e59e });
    const orbiter = new THREE.Mesh(orbiterGeo, orbiterMat);
    group.add(orbiter);

    const ringGeo = new THREE.RingGeometry(2.38, 2.42, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x263346, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    animate = (t) => {
      orbiter.position.set(Math.cos(t) * 2.4, 0, Math.sin(t) * 2.4);
    };
  } else {
    // Default: a rotating cube with an edge outline — a general-purpose 3D
    // object demo for concepts that don't need a bespoke scene.
    const geo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    const mat = new THREE.MeshStandardMaterial({ color: 0x11e59e, metalness: 0.15, roughness: 0.45 });
    const cube = new THREE.Mesh(geo, mat);
    group.add(cube);

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x70ffbe })
    );
    cube.add(wire);

    animate = () => {
      cube.rotation.x += 0.006;
      cube.rotation.y += 0.009;
    };
  }

  return { scene, camera, renderer, controls, animate };
}

/**
 * A real, interactive 3D scene (drag to orbit, scroll to zoom). Used for 3D
 * physics/science concepts that a flat diagram can't represent well.
 *
 * data: { mode: "cube" | "orbit" }
 */
function ThreeVisual({ data }) {
  const containerRef = useRef(null);
  const stateRef = useRef(null);
  const frameRef = useRef(null);
  const clockRef = useRef(0);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let disposed = false;

    try {
      const built = buildScene(container, data || {});
      stateRef.current = built;
      setStatus("success");

      const loop = () => {
        if (disposed) return;
        clockRef.current += 0.02;
        built.animate?.(clockRef.current);
        built.controls.update();
        built.renderer.render(built.scene, built.camera);
        frameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (err) {
      console.error("Three.js render failed:", err);
      setStatus("error");
    }

    const handleResize = () => {
      const built = stateRef.current;
      if (!built || !container) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 320;
      built.camera.aspect = w / h;
      built.camera.updateProjectionMatrix();
      built.renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      const built = stateRef.current;
      if (built) {
        built.controls.dispose();
        built.renderer.dispose();
        built.scene.traverse((obj) => {
          obj.geometry?.dispose?.();
          if (obj.material) {
            (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => m.dispose?.());
          }
        });
        built.renderer.domElement.remove();
      }
      stateRef.current = null;
    };
  }, [data]);

  const resetCamera = () => {
    const built = stateRef.current;
    if (!built) return;
    built.camera.position.set(4, 3, 6);
    built.controls.target.set(0, 0, 0);
    built.controls.update();
  };

  if (status === "error") {
    return (
      <div className="visual-render-state visual-render-error">
        <p>Unable to load 3D visualization.</p>
      </div>
    );
  }

  return (
    <div className="three-visual">
      <div ref={containerRef} className="three-canvas-wrap" />
      {status === "loading" && (
        <div className="visual-render-state visual-render-loading visual-render-overlay">
          <span className="visual-spinner" aria-hidden="true" />
          <p>Preparing visual explanation…</p>
        </div>
      )}
      {status === "success" && (
        <button type="button" className="three-reset-button" onClick={resetCamera}>
          Reset camera
        </button>
      )}
    </div>
  );
}

export default ThreeVisual;
