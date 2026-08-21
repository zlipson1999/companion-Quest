// DS-style battle. Your ACTIVE companion fights; your real exercises are its
// attacks. Wild companions can be befriended with a Bond Token once weakened;
// bad-habit obstacles are cleared. Swap brings in another team member.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { Screen, DualPane, Window, HPBar, Menu, DialogueBox, PixelText, PixelSprite, PixelButton } from '../components';
import { palette, space } from '../theme';
import { useGame, useCompanion, useParty } from '../state';
import { levelFromXp } from '../state/leveling';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { ENCOUNTERS } from '../data/obstacles';
import { getCreature } from '../data/creatures';
import { getExercise, BATTLE_MOVES } from '../data/exercises';
import {
  wildIntro, movePrompt, moveLanded, victoryLines, defeatLines, levelUpLine, evolveLines,
  catchSuccessLines, catchFailLine, catchFullLine, noTokenLine, companionFledLines, swapLine,
} from '../coach';

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// Accept either a Phase-1.5 encounter {targetId,isCompanion,...} or a legacy
// {encounterId} pointing at an obstacle.
function resolveTarget(params) {
  const id = params.targetId || params.creatureId;
  if (id) {
    return {
      targetId: id,
      isCompanion: !!params.isCompanion,
      hp: params.hp || 40,
      xp: params.xp || 20,
      bond: params.bond || 6,
      catchRate: params.catchRate || 0,
    };
  }
  const e = ENCOUNTERS[params.encounterId] || ENCOUNTERS.sludgewad;
  return { targetId: e.creatureId, isCompanion: false, hp: e.hp, xp: e.xp, bond: e.bond, catchRate: 0 };
}

export default function BattleScreen({ params }) {
  useKeepAwake();
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const party = useParty();
  const { navigate } = useNav();

  const target = resolveTarget(params);
  const wild = getCreature(target.targetId);
  const returnTo = params.from === 'route' ? 'route' : 'hub';
  const tokens = state.bag.token || 0;
  const teamFull = party.members.length >= 6;

  const [wildHp, setWildHp] = useState(target.hp);
  const [companionHp, setCompanionHp] = useState(Math.max(1, Math.round(companion.hp)));

  const [phase, setPhase] = useState('message');
  const [lines, setLines] = useState(() => wildIntro(companion.creature.name, wild.name, target.isCompanion));
  const thenRef = useRef(() => setPhase('menu'));

  const [selectedMove, setSelectedMove] = useState(null);
  const [hold, setHold] = useState(0);

  const [wildHit, setWildHit] = useState(0);
  const [companionHit, setCompanionHit] = useState(0);
  const [wildFaint, setWildFaint] = useState(false);
  const [companionFaint, setCompanionFaint] = useState(false);

  const [evolving, setEvolving] = useState(false);
  const evoFlash = useRef(new Animated.Value(0)).current;

  const say = (ls, then) => {
    setLines(ls);
    thenRef.current = then || (() => setPhase('menu'));
    setPhase('message');
  };
  const handleSayComplete = () => {
    const t = thenRef.current;
    thenRef.current = () => setPhase('menu');
    if (t) t();
  };

  useEffect(() => {
    if (phase !== 'doing' || !selectedMove) return undefined;
    const move = getExercise(selectedMove);
    if (move.kind !== 'hold' || hold <= 0) return undefined;
    const id = setTimeout(() => setHold((h) => h - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, selectedMove, hold]);

  useEffect(() => {
    if (!evolving) {
      evoFlash.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(evoFlash, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(evoFlash, { toValue: 0, duration: 120, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [evolving, evoFlash]);

  const finish = () => navigate(returnTo);

  const maybeEvolve = (level, done) => {
    const creature = getCreature(companion.id);
    if (creature.evolvesTo && level >= (creature.evolveLevel || 999)) {
      const evolved = getCreature(creature.evolvesTo);
      const evo = evolveLines(creature.name, evolved.name);
      say([evo[0], evo[1]], () => {
        playSfx('evolve');
        setEvolving(true);
        setPhase('morph');
        setTimeout(() => {
          dispatch({ type: 'EVOLVE', payload: { newId: creature.evolvesTo } });
          setEvolving(false);
          say([evo[2], evo[3]], done);
        }, 1400);
      });
    } else {
      done();
    }
  };

  const runLevelEvolveThen = (beforeLevel, afterXp, done) => {
    const afterLevel = levelFromXp(afterXp);
    if (afterLevel > beforeLevel) {
      playSfx('levelup');
      say([{ speaker: 'Narration', text: levelUpLine(companion.creature.name, afterLevel) }], () => maybeEvolve(afterLevel, done));
    } else {
      done();
    }
  };

  const wildCounter = () => 4 + Math.floor(target.hp / 15) + Math.floor(Math.random() * 4);

  const startMove = (moveId) => {
    const move = getExercise(moveId);
    setSelectedMove(moveId);
    setHold(move.kind === 'hold' ? move.target : 0);
    setPhase('doing');
  };

  const confirmMove = () => {
    const move = getExercise(selectedMove);
    const dmg = move.power + Math.floor((companion.level - 1) * 2);
    const newWildHp = Math.max(0, wildHp - dmg);
    setWildHp(newWildHp);
    setWildHit((h) => h + 1);
    playSfx('hit');

    if (newWildHp <= 0) {
      setWildFaint(true);
      const beforeLevel = companion.level;
      if (target.isCompanion) {
        const half = Math.max(6, Math.floor(target.xp / 2));
        const afterXp = companion.xp + half;
        dispatch({ type: 'WIN_BATTLE', payload: { xp: half, bond: 0, targetId: target.targetId, companionHp } });
        say([{ speaker: companion.creature.name, text: moveLanded(companion.creature.name, move) }, ...companionFledLines(wild.name)], () =>
          runLevelEvolveThen(beforeLevel, afterXp, finish)
        );
      } else {
        const afterXp = companion.xp + target.xp;
        dispatch({ type: 'WIN_BATTLE', payload: { xp: target.xp, bond: target.bond, targetId: target.targetId, companionHp } });
        playSfx('victory');
        say(victoryLines(companion.creature.name, wild.name, target.xp), () => runLevelEvolveThen(beforeLevel, afterXp, finish));
      }
      return;
    }

    const counter = wildCounter();
    const newCompHp = Math.max(0, companionHp - counter);
    setCompanionHp(newCompHp);
    setCompanionHit((h) => h + 1);
    say(
      [
        { speaker: companion.creature.name, text: moveLanded(companion.creature.name, move) },
        { speaker: 'Narration', text: `${wild.name} pushes back! Your resolve dips. (-${counter})` },
      ],
      () => {
        if (newCompHp <= 0) {
          setCompanionFaint(true);
          setTimeout(doDefeat, 500);
        } else {
          setPhase('menu');
        }
      }
    );
  };

  const attemptCatch = () => {
    if (tokens <= 0) {
      say([{ speaker: 'Narration', text: noTokenLine() }], () => setPhase('menu'));
      return;
    }
    if (teamFull) {
      dispatch({ type: 'CONSUME_ITEM', payload: { itemId: 'token' } });
      dispatch({ type: 'CATCH', payload: { creatureId: target.targetId, xp: 60, bond: 5 } });
      say([{ speaker: 'Narration', text: catchFullLine(wild.name) }], finish);
      return;
    }
    dispatch({ type: 'CONSUME_ITEM', payload: { itemId: 'token' } });
    const hpRatio = wildHp / target.hp;
    const chance = clamp(target.catchRate * (0.4 + 0.6 * (1 - hpRatio)) + Math.min(0.15, companion.bond / 300), 0.05, 0.95);
    if (Math.random() < chance) {
      const beforeLevel = companion.level;
      const afterXp = companion.xp + target.xp;
      dispatch({ type: 'SET_HP', payload: { hp: companionHp } });
      dispatch({ type: 'GAIN_XP', payload: { amount: target.xp } });
      dispatch({ type: 'CATCH', payload: { creatureId: target.targetId, xp: 60, bond: 5 } });
      playSfx('catch');
      say(catchSuccessLines(wild.name), () => runLevelEvolveThen(beforeLevel, afterXp, finish));
    } else {
      const counter = wildCounter();
      const newCompHp = Math.max(0, companionHp - counter);
      setCompanionHp(newCompHp);
      setCompanionHit((h) => h + 1);
      say([{ speaker: 'Narration', text: catchFailLine(wild.name) + ` (-${counter})` }], () => {
        if (newCompHp <= 0) {
          setCompanionFaint(true);
          setTimeout(doDefeat, 500);
        } else {
          setPhase('menu');
        }
      });
    }
  };

  const doSwap = (index) => {
    dispatch({ type: 'SET_HP', payload: { hp: companionHp } });
    dispatch({ type: 'SWAP_ACTIVE', payload: { index } });
    const incoming = party.members[index];
    setCompanionHp(Math.round(incoming.hp));
    setCompanionHit((h) => h + 1);
    say([{ speaker: 'Narration', text: swapLine(incoming.creature.name) }], () => setPhase('menu'));
  };

  const doDefeat = () => {
    playSfx('lowhp');
    dispatch({ type: 'LOSE_BATTLE', payload: { targetId: target.targetId } });
    say(defeatLines(companion.creature.name), () => navigate('hub'));
  };

  const flee = () => {
    playSfx('cancel');
    navigate(returnTo);
  };

  const move = selectedMove ? getExercise(selectedMove) : null;
  const holdReady = move && move.kind === 'hold' ? hold <= 0 : true;
  const companionMax = companion.maxHp;

  const top = (
    <View style={{ flex: 1, backgroundColor: palette.bgAlt, padding: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Window tone="dark" pad={8} style={{ flex: 1, marginRight: space.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <PixelText size="small" color={palette.windowFill}>
              {wild.name}
            </PixelText>
            {target.isCompanion ? (
              <PixelText size="tiny" color={palette.hpHigh}>
                wild
              </PixelText>
            ) : (
              <PixelText size="tiny" color={palette.danger}>
                obstacle
              </PixelText>
            )}
          </View>
          <HPBar hp={wildHp} maxHp={target.hp} width={120} showNumbers={false} label="" />
          <PixelText size="tiny" color={palette.windowTextDim} style={{ marginTop: 2 }}>
            {wild.species}
          </PixelText>
        </Window>
        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <PixelSprite spriteKey={wild.sprite} palette={wild.palette} size={84} bob={!wildFaint} hitCount={wildHit} fainting={wildFaint} />
          <View style={{ width: 64, height: 8, backgroundColor: palette.inkSoft, marginTop: 2 }} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 'auto' }}>
        <View style={{ alignItems: 'center', marginRight: space.lg }}>
          <View>
            <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={96} bob={!companionFaint} hitCount={companionHit} fainting={companionFaint} flip />
            <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#fff', opacity: evoFlash }} />
          </View>
          <View style={{ width: 76, height: 9, backgroundColor: palette.inkSoft, marginTop: 2 }} />
        </View>
        <Window tone="dark" pad={8} style={{ flex: 1, marginLeft: space.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <PixelText size="small" color={palette.secondary}>
              {companion.creature.name}
            </PixelText>
            <PixelText size="tiny" color={palette.windowFill}>
              Lv.{companion.level}
            </PixelText>
          </View>
          <HPBar hp={companionHp} maxHp={companionMax} width={120} label="HP" />
        </Window>
      </View>
    </View>
  );

  let bottom;
  if (phase === 'menu') {
    const catchDisabled = tokens <= 0;
    bottom = (
      <View style={{ flex: 1, padding: space.md }}>
        <PixelText size="tiny" color={palette.windowTextDim} style={{ marginBottom: 6 }}>
          Choose a move — then do it for real!
        </PixelText>
        <Menu
          tone="cream"
          columns={2}
          options={BATTLE_MOVES.map((id) => {
            const m = getExercise(id);
            return { label: m.name, value: id, sublabel: m.kind === 'hold' ? `${m.target}s ${m.exercise}` : `${m.target} ${m.exercise}` };
          })}
          onSelect={(opt) => startMove(opt.value)}
        />
        <View style={{ flexDirection: 'row', marginTop: space.sm }}>
          <PixelButton label="Flee" tone="plain" sound="cancel" style={{ flex: 1, marginRight: 5 }} onPress={flee} />
          {party.members.length > 1 ? (
            <PixelButton label="Swap" tone="dark" sound="cursor" style={{ flex: 1, marginRight: 5 }} onPress={() => setPhase('swap')} />
          ) : null}
          {target.isCompanion ? (
            <PixelButton label={`Catch (${tokens})`} tone="gold" disabled={catchDisabled} style={{ flex: 1 }} onPress={attemptCatch} />
          ) : null}
        </View>
      </View>
    );
  } else if (phase === 'swap') {
    bottom = (
      <View style={{ flex: 1, padding: space.md }}>
        <PixelText size="tiny" color={palette.windowTextDim} style={{ marginBottom: 6 }}>
          Send in which companion?
        </PixelText>
        <Menu
          tone="cream"
          options={party.members.map((m, i) => ({
            label: `${m.creature.name}  Lv.${m.level}`,
            value: i,
            sublabel: i === party.activeIndex ? 'active' : `HP ${Math.round(m.hp)}/${m.maxHp}`,
            disabled: i === party.activeIndex || m.hp <= 0,
          }))}
          onSelect={(opt) => doSwap(opt.value)}
        />
        <PixelButton label="Back" tone="plain" sound="cancel" style={{ marginTop: space.sm }} onPress={() => setPhase('menu')} />
      </View>
    );
  } else if (phase === 'doing') {
    bottom = (
      <View style={{ flex: 1, padding: space.md, justifyContent: 'flex-end' }}>
        <Window tone="cream" pad={14} style={{ marginBottom: space.sm }}>
          <PixelText size="body" color={palette.windowText} style={{ lineHeight: 22 }}>
            {movePrompt(move)}
          </PixelText>
          {move.kind === 'hold' ? (
            <PixelText size="title" color={hold > 0 ? palette.accentDark : palette.success} align="center" style={{ marginTop: 10 }}>
              {hold > 0 ? `${hold}` : 'GO!'}
            </PixelText>
          ) : null}
        </Window>
        <View style={{ flexDirection: 'row' }}>
          <PixelButton label="Cancel" tone="plain" sound="cancel" style={{ flex: 1, marginRight: 6 }} onPress={() => setPhase('menu')} />
          <PixelButton label={holdReady ? 'Confirm' : 'Hold...'} tone="gold" disabled={!holdReady} style={{ flex: 1, marginLeft: 6 }} onPress={confirmMove} />
        </View>
      </View>
    );
  } else if (phase === 'morph') {
    bottom = (
      <View style={{ flex: 1, padding: space.md, justifyContent: 'center', alignItems: 'center' }}>
        <PixelText size="label" color={palette.secondary}>
          . . .
        </PixelText>
      </View>
    );
  } else {
    bottom = (
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: space.md }}>
        <DialogueBox lines={lines} onComplete={handleSayComplete} />
      </View>
    );
  }

  return (
    <Screen padTop={false}>
      <DualPane top={top} bottom={bottom} topFlex={1.1} bottomFlex={1} />
    </Screen>
  );
}
