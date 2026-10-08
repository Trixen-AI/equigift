import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { prefersReducedMotion } from '@/hooks/useInView';

// A dotted globe where gifts travel as arcs between pins. The camera frames the
// sphere so it rises from the bottom of the panel. Drag to spin; it drifts on its own.

type Props = {
  /** called every frame with the screen position (px, relative to the wrapper) of the tracked pin */
  onAnchor?: (p: { x: number; y: number; visible: boolean }) => void;
};

// seeded PRNG so the layout is the same on every load
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const R = 1;
const toVec = (lat: number, lon: number, r = R) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const th = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};

// pins: rough positions of cities where gifts are sent and opened
const PINS: [number, number][] = [
  [40.7, -74], [37.8, -122.4], [51.5, -0.1], [48.9, 2.35], [52.5, 13.4], [35.7, 139.7], [1.35, 103.8],
  [-6.2, 106.8], [-33.9, 151.2], [19.4, -99.1], [-23.5, -46.6], [25.2, 55.3], [28.6, 77.2], [37.6, 127],
  [43.7, -79.4], [6.5, 3.4], [-1.3, 36.8], [59.3, 18.1], [41.0, 29.0], [14.6, 121.0],
];

export function GiftGlobe({ onAnchor }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const reduce = prefersReducedMotion();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.dataset.engine = `three.js r${THREE.REVISION}`;
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    const globe = new THREE.Group();
    scene.add(globe);

    // ---- dots on latitude rings (denser toward the equator) ----
    const dotPos: number[] = [];
    const dotSize: number[] = [];
    const rings = 46;
    for (let i = 1; i < rings; i++) {
      const lat = -90 + (180 * i) / rings;
      const circ = Math.cos((lat * Math.PI) / 180);
      const count = Math.max(6, Math.round(circ * 120));
      for (let j = 0; j < count; j++) {
        const lon = (360 * j) / count + (i % 2) * (180 / count);
        const v = toVec(lat, lon);
        dotPos.push(v.x, v.y, v.z);
        dotSize.push(1);
      }
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPos, 3));
    const dotMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uPx: { value: renderer.getPixelRatio() } },
      vertexShader: `
        uniform float uPx;
        varying float vFace;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          vec3 n = normalize(normalMatrix * position);
          vFace = n.z;
          gl_PointSize = (2.6 + 1.6 * max(n.z,0.0)) * uPx;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vFace;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          if (dot(c,c) > 0.25) discard;
          float a = smoothstep(-0.15, 0.55, vFace);
          gl_FragColor = vec4(1.0, 1.0, 1.0, a * 0.95);
        }`,
    });
    globe.add(new THREE.Points(dotGeo, dotMat));

    // ---- pins ----
    const pinVecs = PINS.map(([la, lo]) => toVec(la, lo, R * 1.005));
    const pinGeo = new THREE.SphereGeometry(0.014, 12, 12);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    pinVecs.forEach((v, i) => {
      const m = new THREE.Mesh(pinGeo, pinMat);
      m.position.copy(v);
      m.scale.setScalar(i % 4 === 0 ? 1.7 : 1);
      globe.add(m);
    });

    // ---- arcs ----
    const rand = rng(7);
    type Arc = { curve: THREE.QuadraticBezierCurve3; line: THREE.Line; head: THREE.Mesh; start: number; dur: number };
    const arcs: Arc[] = [];
    const headGeo = new THREE.SphereGeometry(0.012, 10, 10);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xf98500 });
    const ARC_SEG = 64;
    for (let k = 0; k < 16; k++) {
      const a = pinVecs[Math.floor(rand() * pinVecs.length)];
      let b = pinVecs[Math.floor(rand() * pinVecs.length)];
      if (a === b) b = pinVecs[(pinVecs.indexOf(a) + 3) % pinVecs.length];
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const lift = 1 + a.distanceTo(b) * 0.55;
      mid.normalize().multiplyScalar(R * lift);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(ARC_SEG));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xf98500, transparent: true, opacity: 0.5 }));
      geo.setDrawRange(0, 0);
      globe.add(line);
      const head = new THREE.Mesh(headGeo, headMat);
      globe.add(head);
      arcs.push({ curve, line, head, start: rand() * 6, dur: 2.6 + rand() * 1.8 });
    }

    // ---- framing ----
    const frame = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // sphere should span ~0.82 of the width on wide panels, more on narrow ones
      const span = w > 760 ? 0.82 : 1.35;
      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const dist = R / Math.tan((hFov * span) / 2);
      camera.position.set(0, 0, dist);
      // push the sphere down so its top sits just over a third of the way down the panel
      const visibleH = 2 * Math.tan(vFov / 2) * dist;
      const topY = visibleH / 2 - visibleH * (w > 760 ? 0.36 : 0.42);
      globe.position.y = topY - R;
      camera.updateProjectionMatrix();
    };
    frame();
    const ro = new ResizeObserver(frame);
    ro.observe(wrap);

    // ---- drag to spin ----
    let rotY = -0.6;
    const rotX = 0.42;
    let vel = 0;
    let dragging = false;
    let lastX = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      wrap.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      vel = dx * 0.005;
      rotY += vel;
    };
    const up = () => {
      dragging = false;
    };
    wrap.addEventListener('pointerdown', down);
    wrap.addEventListener('pointermove', move);
    wrap.addEventListener('pointerup', up);
    wrap.addEventListener('pointercancel', up);

    // ---- loop (paused offscreen) ----
    let visible = true;
    const io = new IntersectionObserver((es) => (visible = es[0].isIntersecting));
    io.observe(wrap);
    let tracked = pinVecs[0];
    let pickedAt = -1e9;
    const cand = new THREE.Vector3();
    const pick = () => {
      let best = -Infinity;
      for (const v of pinVecs) {
        cand.copy(v).applyMatrix4(globe.matrixWorld);
        const facing = cand.clone().sub(globe.position).normalize().dot(camera.position.clone().sub(cand).normalize());
        cand.project(camera);
        // prefer pins facing us, left of centre and in the upper half of the sphere
        const score = facing - Math.abs(cand.x + 0.28) * 0.8 - Math.abs(cand.y - 0.05) * 0.6;
        if (facing > 0.3 && score > best) {
          best = score;
          tracked = v;
        }
      }
    };
    const tmp = new THREE.Vector3();
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible) return;
      if (!dragging) {
        vel *= 0.94;
        rotY += vel + (reduce ? 0 : dt * 0.06);
      }
      globe.rotation.set(rotX, rotY, 0);
      const t = now / 1000;
      for (const a of arcs) {
        const local = ((t - a.start) % (a.dur + 1.4) + (a.dur + 1.4)) % (a.dur + 1.4);
        const p = Math.min(1, local / a.dur);
        const fade = local > a.dur ? 1 - (local - a.dur) / 1.4 : 1;
        a.line.geometry.setDrawRange(0, Math.floor(p * ARC_SEG) + 1);
        (a.line.material as THREE.LineBasicMaterial).opacity = 0.75 * fade;
        a.head.position.copy(a.curve.getPoint(p));
        a.head.visible = local <= a.dur;
      }
      renderer.render(scene, camera);
      if (onAnchor) {
        if (now - pickedAt > 5000) {
          pick();
          pickedAt = now;
        }
        tmp.copy(tracked).applyMatrix4(globe.matrixWorld);
        const facing = tmp.clone().sub(globe.position).normalize().dot(camera.position.clone().sub(tmp).normalize()) > 0.15;
        tmp.project(camera);
        onAnchor({ x: ((tmp.x + 1) / 2) * wrap.clientWidth, y: ((1 - tmp.y) / 2) * wrap.clientHeight, visible: facing });
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener('pointerdown', down);
      wrap.removeEventListener('pointermove', move);
      wrap.removeEventListener('pointerup', up);
      wrap.removeEventListener('pointercancel', up);
      renderer.dispose();
      dotGeo.dispose();
      wrap.removeChild(renderer.domElement);
    };
  }, [onAnchor]);

  return <div ref={wrapRef} className="globe-canvas" />;
}
