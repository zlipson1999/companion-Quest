// Form check: your front camera as a mirror, with the movement's own coaching
// cues on a timer over the top, plus a set clock.
//
// What this is NOT, and the screen says so out loud: automated pose analysis.
// There is no on-device pose model here, so the app will not tell you your knee
// caved — it shows you yourself and tells you what to look for, which is what a
// mirror in a gym does. Claiming otherwise would be lying to someone about
// their safety. Nothing is recorded, stored, or sent anywhere; the camera is
// live preview only, and the whole screen works without it if you decline.

import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Screen, Window, PixelText, PixelButton } from '../components';
import { palette, space } from '../theme';
import { getMovement } from '../data/movements';
import { MUSCLES } from '../data/muscles';
import { useNav } from './navContext';
import { playSfx } from '../audio';

const CUE_SECONDS = 5;

export default function FormCheckScreen({ params }) {
  const { navigate } = useNav();
  const movement = getMovement(params.movementId);
  // Return to the session we came from, carrying its progress back with us.
  const goBack = () =>
    // `actual` rides along with `checked`: leaving for the mirror mid-set must
    // not discard the weights you have already typed in.
    params.planId
      ? navigate('forge', { resume: { planId: params.planId, checked: params.checked || {}, actual: params.actual || {}, from: params.from } })
      // No plan means you walked into the mirror on the gym wall, so back is
      // the gym — not the Forge you were never in.
      : navigate('gym');
  const [permission, requestPermission] = useCameraPermissions();
  const [mirror, setMirror] = useState(false);
  const [cue, setCue] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const tick = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    tick.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(tick.current);
  }, [running]);

  useEffect(() => {
    if (!running || !movement) return;
    const next = Math.floor(elapsed / CUE_SECONDS) % movement.cues.length;
    if (next !== cue) {
      setCue(next);
      playSfx('blip');
    }
  }, [elapsed, running, movement, cue]);

  const granted = permission && permission.granted;

  const openMirror = async () => {
    playSfx('confirm');
    if (!granted) {
      const res = await requestPermission();
      if (!res || !res.granted) return;
    }
    setMirror(true);
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <Screen style={{ padding: space.md }}>
      <PixelText size="heading" color={palette.secondary} align="center" style={{ marginVertical: space.sm }}>
        {movement ? 'Form Check' : 'The Mirror'}
      </PixelText>

      {/* upper pane: the mirror, or the offer of one */}
      <Window tone="dark" pad={3}>
        <View style={{ height: 250, backgroundColor: palette.ink, overflow: 'hidden' }}>
          {mirror && granted ? (
            <CameraView style={{ flex: 1 }} facing="front" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.md }}>
              <PixelText size="tiny" color={palette.windowBorderLight} align="center" style={{ lineHeight: 15 }}>
                {permission && !permission.granted && !permission.canAskAgain
                  ? 'Camera is off in your system settings. The cues below still work.'
                  : movement
                    ? 'Turn on the mirror to watch yourself, or just follow the cues.'
                    : 'Turn on the mirror to watch yourself work.'}
              </PixelText>
              <PixelButton label="Use Mirror" tone="dark" size="small" onPress={openMirror} style={{ marginTop: space.md }} />
            </View>
          )}

          {/* framing guide — a centre line and a floor line to square up against */}
          {mirror && granted ? (
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
              <View style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: palette.secondary, opacity: 0.35 }} />
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: '18%', height: 2, backgroundColor: palette.secondary, opacity: 0.35 }} />
              <View style={{ position: 'absolute', left: 10, right: 10, top: 10, bottom: 10, borderWidth: 2, borderColor: palette.windowFill, opacity: 0.18 }} />
            </View>
          ) : null}
        </View>
      </Window>

      {/* the cue, big and one at a time — only when a movement asked for one.
          Arriving from the gym wall there is nothing to cue, so the mirror is
          just a mirror and a set clock, which is what a mirror is. */}
      <Window tone="cream" pad={14} style={{ marginTop: space.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <PixelText size="small" color={palette.accentDark}>
            {movement ? movement.name : 'Set clock'}
          </PixelText>
          <PixelText size="small" color={palette.windowText}>{mm}:{ss}</PixelText>
        </View>
        <PixelText size="body" color={palette.windowText} style={{ marginTop: space.md, lineHeight: 20, minHeight: 60 }}>
          {movement ? movement.cues[cue] : 'Start a set and watch yourself do it. Pick a movement in the Forge if you want its cues here too.'}
        </PixelText>
        {movement ? (
          <>
            <View style={{ flexDirection: 'row', marginTop: space.sm }}>
              {movement.cues.map((_c, i) => (
                <View
                  key={i}
                  style={{ width: 10, height: 6, marginRight: 4, backgroundColor: i === cue ? palette.accent : palette.windowBorderLight }}
                />
              ))}
            </View>
            <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: space.sm, lineHeight: 14 }}>
              Works: {movement.primary.map((id) => MUSCLES[id].name).join(', ')}
            </PixelText>
          </>
        ) : null}
      </Window>

      <PixelText size="tiny" color={palette.windowTextDim} align="center" style={{ marginTop: space.sm, lineHeight: 14 }}>
        Mirror and cues only — nothing is recorded, and the app is not judging your form. You are.
      </PixelText>

      <View style={{ flexDirection: 'row', marginTop: space.sm }}>
        <PixelButton
          label={params.planId ? 'Back to Set' : 'Back to the gym'}
          tone="plain"
          sound="cancel"
          style={{ flex: 1, marginRight: 6 }}
          onPress={goBack}
        />
        <PixelButton
          label={running ? 'Pause' : 'Start Set'}
          tone={running ? 'dark' : 'gold'}
          style={{ flex: 1, marginLeft: 6 }}
          onPress={() => setRunning((r) => !r)}
        />
      </View>
    </Screen>
  );
}
