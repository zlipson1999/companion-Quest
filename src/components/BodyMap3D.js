// A real 3D body map: a low-poly humanoid built procedurally from the muscle
// data, rendered through expo-gl, with each trained group lit on a cool-to-hot
// ramp by how hard the plan works it. Drag to spin it.
//
// Deliberately flat-shaded blocks on a limited palette — the DS did 3D, and it
// looked like this. No model files: the geometry comes from src/data/muscles.js
// the same way the sprites come from a grid, so there are still no external
// assets anywhere in this app.
//
// If a device cannot give us a GL context, <BodyMapFlat> renders the same data
// as a front-on 2D diagram rather than failing.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import PixelText from './PixelText';
import { palette } from '../theme';
import { BODY_FRAME, MUSCLES, MUSCLE_IDS } from '../data/muscles';

const FRAME_COLOR = 0x3c3558;
const RAMP = [0x4aa6d6, 0x5ed46a, 0xffcf4d, 0xff8a3d, 0xff5e5e];

// Relative intensity (0..1) -> palette step. Untrained groups stay frame-dim.
function heatColor(t) {
  if (t <= 0) return null;
  const i = Math.min(RAMP.length - 1, Math.floor(t * RAMP.length));
  return RAMP[i];
}

function heatHex(t) {
  const c = heatColor(t);
  return c == null ? '#3c3558' : '#' + c.toString(16).padStart(6, '0');
}

// Normalize a raw muscle tally into 0..1 against its own peak, so a light plan
// still reads as a map rather than a uniformly cold body.
function normalizeHeat(muscle) {
  const out = {};
  const peak = MUSCLE_IDS.reduce((n, id) => Math.max(n, (muscle && muscle[id]) || 0), 0);
  MUSCLE_IDS.forEach((id) => {
    const v = (muscle && muscle[id]) || 0;
    out[id] = peak > 0 && v > 0 ? Math.max(0.18, v / peak) : 0;
  });
  return out;
}

// Each mesh owns its geometry and material so disposal is 1:1 — a mirrored pair
// sharing them would be disposed twice when the plan changes.
function addBox(group, pos, size, color, mirror, collect) {
  const make = (x) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size[0], size[1], size[2]),
      new THREE.MeshLambertMaterial({ color, flatShading: true })
    );
    mesh.position.set(x, pos[1], pos[2]);
    group.add(mesh);
    if (collect) collect.push(mesh);
  };
  make(pos[0]);
  if (mirror) make(-pos[0]);
}

function GLBody({ heat, onFail, spinRef }) {
  const rafRef = useRef(null);
  const teardown = useRef(null);
  const bodyRef = useRef(null);
  const platesRef = useRef([]);
  const heatRef = useRef(heat);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (teardown.current) teardown.current();
  }, []);

  // The GL context is created once, but the plan behind it changes every time
  // the player edits it. Swap the muscle plates in place rather than leaving a
  // body that no longer describes the plan on screen.
  const paintPlates = () => {
    const body = bodyRef.current;
    if (!body) return;
    platesRef.current.forEach((mesh) => {
      body.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    platesRef.current = [];
    MUSCLE_IDS.forEach((id) => {
      const c = heatColor(heatRef.current[id] || 0);
      if (c == null) return;
      const m = MUSCLES[id].mesh;
      addBox(body, m.pos, m.size, c, m.mirror, platesRef.current);
    });
  };

  useEffect(() => {
    heatRef.current = heat;
    paintPlates();
    // paintPlates reads through refs; re-running it is the whole point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heat]);

  const onContextCreate = (gl) => {
    try {
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;

      // three wants a canvas; expo-gl gives us a context. This is the minimal
      // shim that keeps the renderer happy without pulling in expo-three.
      const renderer = new THREE.WebGLRenderer({
        canvas: {
          width,
          height,
          style: {},
          addEventListener: () => {},
          removeEventListener: () => {},
          clientHeight: height,
          clientWidth: width,
          getContext: () => gl,
        },
        context: gl,
        antialias: false,
      });
      renderer.setSize(width, height);
      renderer.setClearColor(0x191a2e, 1);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
      camera.position.set(0, 0.65, 5.2);
      camera.lookAt(0, 0.62, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.68));
      const key = new THREE.DirectionalLight(0xffffff, 0.9);
      key.position.set(2, 4, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x8fb8d6, 0.45);
      rim.position.set(-3, 1, -4);
      scene.add(rim);

      const body = new THREE.Group();
      BODY_FRAME.forEach((p) => addBox(body, p.pos, p.size, FRAME_COLOR, p.mirror));
      body.position.y = -0.62;
      scene.add(body);
      bodyRef.current = body;
      platesRef.current = [];
      paintPlates();

      teardown.current = () => {
        scene.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
        renderer.dispose();
      };

      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        body.rotation.y = spinRef.current;
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };
      loop();
    } catch (e) {
      onFail();
    }
  };

  return <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />;
}

// Front-on 2D projection of the exact same muscle boxes — the fallback, and a
// perfectly honest reading of the data.
export function BodyMapFlat({ heat, height = 210 }) {
  const scale = height / 2.4;
  const cx = 0.5;
  const box = (pos, size, color, key, mirrorSign) => {
    const w = size[0] * scale;
    const h = size[1] * scale;
    return (
      <View
        key={key}
        style={{
          position: 'absolute',
          left: `${cx * 100}%`,
          marginLeft: mirrorSign * pos[0] * scale - w / 2,
          bottom: (pos[1] + 0.55) * scale - h / 2,
          width: w,
          height: h,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: palette.ink,
        }}
      />
    );
  };
  const parts = [];
  BODY_FRAME.forEach((p, i) => {
    parts.push(box(p.pos, p.size, '#3c3558', `f${i}`, 1));
    if (p.mirror) parts.push(box(p.pos, p.size, '#3c3558', `f${i}m`, -1));
  });
  MUSCLE_IDS.forEach((id) => {
    const t = heat[id] || 0;
    if (t <= 0) return;
    const m = MUSCLES[id].mesh;
    parts.push(box(m.pos, m.size, heatHex(t), id, 1));
    if (m.mirror) parts.push(box(m.pos, m.size, heatHex(t), id + 'm', -1));
  });
  return <View style={{ height, backgroundColor: palette.bgAlt, overflow: 'hidden' }}>{parts}</View>;
}

export default function BodyMap3D({ muscle, height = 210 }) {
  const heat = useMemo(() => normalizeHeat(muscle), [muscle]);
  const [failed, setFailed] = useState(false);
  const spinRef = useRef(0.5);
  const dragStart = useRef(0);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 3,
        onPanResponderGrant: () => {
          dragStart.current = spinRef.current;
        },
        onPanResponderMove: (_e, g) => {
          spinRef.current = dragStart.current + g.dx * 0.012;
        },
      }),
    []
  );

  // Nothing trained yet — say so rather than showing a cold body with no reason.
  const anyHeat = MUSCLE_IDS.some((id) => heat[id] > 0);

  return (
    <View style={{ height, backgroundColor: palette.bgAlt }} {...(failed ? {} : pan.panHandlers)}>
      {failed ? (
        <BodyMapFlat heat={heat} height={height} />
      ) : (
        <GLBody heat={heat} spinRef={spinRef} onFail={() => setFailed(true)} />
      )}
      <View style={{ position: 'absolute', left: 6, bottom: 5, right: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <PixelText size="tiny" color={palette.windowBorderLight}>
          {anyHeat ? (failed ? 'front view' : 'drag to turn') : 'nothing trained yet'}
        </PixelText>
        {anyHeat ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PixelText size="tiny" color={palette.windowBorderLight}>light </PixelText>
            {RAMP.map((c) => (
              <View
                key={c}
                style={{ width: 8, height: 8, marginLeft: 2, backgroundColor: '#' + c.toString(16).padStart(6, '0'), borderWidth: 1, borderColor: palette.ink }}
              />
            ))}
            <PixelText size="tiny" color={palette.windowBorderLight}> hard</PixelText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export { heatHex, normalizeHeat };
