// Exercise challenge. Your active companion channels real exercises into
// Resolve. Trail companions may tie a Kinship Knot with you after trust is built;
// bad-habit obstacles are cleared. Rotate changes the Circle's lead.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { Screen, DualPane, Window, Menu, DialogueBox, BattleStage, Platform, StatusPlate, PixelText, PixelSprite, PixelButton, GrowthCeremony } from '../components';
import { palette, space } from '../theme';
import { useGame, useCompanion, useParty } from '../state';
import { levelFromXp } from '../state/leveling';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { ENCOUNTERS } from '../data/obstacles';
import { getCreature } from '../data/creatures';
import { wardenSprite } from '../data/characters';
import { isGrownForm } from '../data/wild';
import { canEvolve } from '../state/evolution';
import { evolveChecklist } from '../state/companionLife';
import { battleMovesFor, movesLearnedBetween } from '../data/exercises';
import { CHARM_BY_ID } from '../data/charms';
import {
  charmArrivalHeal, charmOutgoingMult, charmIncoming,
  charmAfterMoveHeal, charmVictoryHeal, charmSurvivesLethal, charmShrugsKnotBacklash,
} from '../state/charmBattle';
import {
  wildIntro,
  sparIntro, trainerSparLines, wardenTrainerLines, movePrompt, moveLanded, victoryLines, defeatLines, levelUpLine, evolveLines,
  catchSuccessLines, catchFailLine, catchFullLine, noKnotLine, companionFledLines, swapLine,
  pinLines,
} from '../coach';

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function resolveTarget(params) {
  const id = params.targetId || params.creatureId;
  if (id) {
    const trainer = !!(params.opponent || params.trainerBattle);
    return {
      targetId: id,
      isCompanion: !trainer && !!params.isCompanion,
      hp: params.hp || 40,
      xp: params.xp || 20,
      bond: params.bond || 6,
      catchRate: trainer ? 0 : params.catchRate || 0,
    };
  }
  const e = ENCOUNTERS[params.encounterId] || ENCOUNTERS.sludgewad;
  return { targetId: e.creatureId, isCompanion: false, hp: e.hp, xp: e.xp, bond: e.bond, catchRate: 0 };
}

function DamagePop({ pop, color }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!pop.id) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 750, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [pop.id, anim]);
  if (!pop.id) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -6,
        alignSelf: 'center',
        opacity: anim.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) }],
      }}
    >
      <PixelText size="small" color={color}>-{pop.amount}</PixelText>
    </Animated.View>
  );
}

export default function BattleScreen({ params }) {
  useKeepAwake();
  const { state, dispatch } = useGame();
  const companion = useCompanion();
  const party = useParty();
  const { navigate } = useNav();

  const target = resolveTarget(params);
  const wild = params.opponent || getCreature(target.targetId);
  const returnTo = params.from === 'route' ? 'route' : params.from === 'gym' ? 'gym' : 'hub';
  const knots = state.bag.knot || 0;
  const teamFull = party.members.length >= 6;

  // The active companion's worn Trail Charm (Backpack → Trail Gear). The
  // scripted push-up contest ignores charms entirely — losing IS the lesson.
  const charmId = !params.sparIntro && companion ? companion.charm : null;
  const charmName = charmId && CHARM_BY_ID[charmId] ? CHARM_BY_ID[charmId].name : null;
  // Battle-scoped charm memory: confirmed moves (Momentum Feather's streak,
  // Steady Cord / Trail Spark's "first"), hits taken (Morning Dew's "first"),
  // and the once-per-battle triggers.
  const charmRef = useRef({ moves: 0, hits: 0, secondWind: false, balanceRoot: false });

  // Fuelseed / Restleaf arrive already part-recovered; the intro says so.
  const arrival = companion
    ? charmArrivalHeal(charmId, Math.max(1, Math.round(companion.hp || 1)), companion.maxHp, charmName)
    : { hp: 1, note: null };

  const [wildHp, setWildHp] = useState(target.hp);
  const [companionHp, setCompanionHp] = useState(() => arrival.hp);
  const [phase, setPhase] = useState('message');
  const [lines, setLines] = useState(() => {
    if (!companion) {
      return [{ speaker: 'Narration', text: 'Meet Coach Maple in the gym — then the trail has someone to stand with you.' }];
    }
    const arrivalNote = arrival.note ? [{ speaker: 'Narration', text: arrival.note }] : [];
    const intro = params.regionalWarden && params.trainerBattle
      ? wardenTrainerLines(companion.creature.name, params.trainer || 'Warden', wild.name, params.trainerLine)
      : params.trainerBattle || params.trainer
      ? trainerSparLines(companion.creature.name, params.trainer || 'Keeper', wild.name)
      : params.opponent
        ? sparIntro(companion.creature.name, wild.name)
        : wildIntro(companion.creature.name, wild.name, target.isCompanion, isGrownForm(wild.id));
    return [...intro, ...arrivalNote];
  });
  const thenRef = useRef(() => setPhase('menu'));
  const [selectedMove, setSelectedMove] = useState(null);
  const [hold, setHold] = useState(0);
  const battleMoves = companion ? battleMovesFor(companion.level, companion.creature.stage || 1) : [];
  const getMove = (id) => battleMoves.find((m) => m.id === id) || null;
  const [wildHit, setWildHit] = useState(0);
  const [companionHit, setCompanionHit] = useState(0);
  const [wildLunge, setWildLunge] = useState(0);
  const [companionLunge, setCompanionLunge] = useState(0);
  const [wildPop, setWildPop] = useState({ id: 0, amount: 0 });
  const [compPop, setCompPop] = useState({ id: 0, amount: 0 });
  const timersRef = useRef([]);
  const later = (ms, fn) => timersRef.current.push(setTimeout(fn, ms));
  // How many rounds of Rowan's contest you have survived (spar only).
  const sparTurns = useRef(0);
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const wildEnter = useRef(new Animated.Value(90)).current;
  const compEnter = useRef(new Animated.Value(-110)).current;
  useEffect(() => {
    Animated.stagger(160, [
      Animated.timing(wildEnter, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(compEnter, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [wildEnter, compEnter]);
  const [wildFaint, setWildFaint] = useState(false);
  const [companionFaint, setCompanionFaint] = useState(false);
  const [ceremony, setCeremony] = useState(null);

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
    const move = getMove(selectedMove);
    if (!move || move.kind !== 'hold' || hold <= 0) return undefined;
    const id = setTimeout(() => setHold((h) => h - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, selectedMove, hold]);

  if (!companion) {
    return (
      <Screen style={{ padding: space.md, justifyContent: 'flex-end' }}>
        <DialogueBox lines={lines} onComplete={() => navigate(returnTo)} />
      </Screen>
    );
  }

  const finish = () => navigate(returnTo);

  const maybeEvolve = (level, done) => {
    const creature = getCreature(companion.id);
    if (canEvolve(companion, creature, level)) {
      const evolved = getCreature(creature.evolvesTo);
      const evo = evolveLines(creature.name, evolved.name);
      say([evo[0], evo[1]], () => {
        playSfx('evolve');
        setCeremony({ from: creature, to: evolved, lines: evo, after: done, checks: evolveChecklist(companion, creature, level) });
        setPhase('morph');
      });
    } else {
      done();
    }
  };

  const runLevelEvolveThen = (beforeLevel, afterXp, done) => {
    const afterLevel = levelFromXp(afterXp);
    if (afterLevel > beforeLevel) {
      playSfx('levelup');
      const learned = movesLearnedBetween(beforeLevel, afterLevel).map(
        (m) => ({ speaker: 'Narration', text: `${companion.creature.name} learned ${m.name}!` })
      );
      say([{ speaker: 'Narration', text: levelUpLine(companion.creature.name, afterLevel) }, ...learned], () => maybeEvolve(afterLevel, done));
    } else {
      done();
    }
  };

  const wildCounter = () => 4 + Math.floor(target.hp / 15) + Math.floor(Math.random() * 4);

  const startMove = (moveId) => {
    const move = getMove(moveId);
    setSelectedMove(moveId);
    setHold(move.kind === 'hold' ? move.target : 0);
    setPhase('doing');
  };

  const confirmMove = () => {
    const move = getMove(selectedMove);
    dispatch({ type: 'LOG_EXERCISE', payload: { id: move.id, kind: move.kind, target: move.target, routeId: params.routeId } });
    // The worn charm shapes the confirmed move: Trail Spark / Steady Cord on
    // the first, Momentum Feather per streak, Breath Bell on holds, Focus
    // Stone / Form Ribbon / Kinship Thread on all of them. One charm worn,
    // so nothing stacks.
    const base = move.power + Math.floor((companion.level - 1) * 2);
    const outMult = charmOutgoingMult(charmId, {
      hold: move.kind === 'hold',
      moveIndex: charmRef.current.moves,
      bond: companion.bond,
    });
    const dmg = Math.max(1, Math.round(base * outMult));
    charmRef.current.moves += 1;
    // Rowan's push-up contest is a LESSON, not a fight you can win: Pebblepup
    // has months on a first-morning companion, so it never quite goes down,
    // and after a few honest turns it puts you down instead. Losing is the
    // point - it is what sends you home to learn the other half of the game.
    const scripted = !!params.sparIntro;
    const newWildHp = scripted ? Math.max(1, wildHp - dmg) : Math.max(0, wildHp - dmg);
    // Hydration Bead pays its sip the moment the movement is done — before
    // any counter lands, and before a victory is banked.
    const sipped = clamp(companionHp + charmAfterMoveHeal(charmId), 0, companion.maxHp);
    if (sipped !== companionHp) later(300, () => setCompanionHp(sipped));
    setCompanionLunge((n) => n + 1);
    later(140, () => {
      setWildHp(newWildHp);
      setWildHit((h) => h + 1);
      setWildPop((p) => ({ id: p.id + 1, amount: dmg }));
      playSfx('hit');
    });

    if (newWildHp <= 0) {
      later(430, () => setWildFaint(true));
      const beforeLevel = companion.level;
      // Recovery Shell breathes some Resolve back the moment the opponent
      // goes down; the healed value is what the save keeps.
      const shellHeal = charmVictoryHeal(charmId, companion.maxHp);
      const standingHp = clamp(sipped + shellHeal, 1, companion.maxHp);
      if (standingHp !== sipped) later(600, () => setCompanionHp(standingHp));
      const shellNote = shellHeal && standingHp > sipped
        ? [{ speaker: 'Narration', text: `${charmName} hums — ${companion.creature.name} recovers ${standingHp - sipped} Resolve.` }]
        : [];
      if (target.isCompanion) {
        const half = Math.max(6, Math.floor(target.xp / 2));
        const afterXp = companion.xp + half;
        dispatch({ type: 'WIN_BATTLE', payload: { xp: half, bond: 0, targetId: target.targetId, companionHp: standingHp } });
        say([{ speaker: companion.creature.name, text: moveLanded(companion.creature.name, move) }, ...companionFledLines(wild.name), ...shellNote], () =>
          runLevelEvolveThen(beforeLevel, afterXp, finish)
        );
      } else {
        const afterXp = companion.xp + target.xp;
        const alreadyPinned = !!(
          params.routeId
          && state.trails
          && state.trails.progress
          && state.trails.progress[params.routeId]
          && state.trails.progress[params.routeId].pin
        );
        const firstPin = !!params.regionalWarden && !alreadyPinned;
        dispatch({
          type: 'WIN_BATTLE',
          payload: {
            xp: target.xp,
            bond: target.bond,
            targetId: target.targetId,
            companionHp: standingHp,
            spar: !!(params.opponent || params.sparIntro || (params.trainerBattle && !params.warden)),
            warden: !!params.warden,
            regionalWarden: !!params.regionalWarden,
            routeId: params.routeId,
          },
        });
        playSfx('victory');
        if (firstPin) {
          say(
            [...pinLines(params.trainer || wild.name, params.pinName || 'Quest Pin', params.nextTrail), ...shellNote],
            () => runLevelEvolveThen(beforeLevel, afterXp, finish)
          );
        } else {
          say([...victoryLines(companion.creature.name, wild.name, target.xp), ...shellNote], () => runLevelEvolveThen(beforeLevel, afterXp, finish));
        }
      }
      return;
    }

    // In the contest his counters GROW - round one stings, round two hurts,
    // round three ends it whatever your Resolve was.
    const sparRound = sparTurns.current + 1;
    if (scripted) sparTurns.current = sparRound;
    // Pace Token thins every counter, Morning Dew halves the first; the
    // scripted contest takes neither excuse.
    let counter = scripted
      ? (sparRound >= 3 ? companionHp : Math.max(10, Math.ceil(companion.maxHp * 0.35)))
      : wildCounter();
    let charmNotes = [];
    if (!scripted) {
      const inc = charmIncoming(charmId, counter, charmRef.current.hits, charmName);
      counter = inc.dmg;
      charmRef.current.hits += 1;
      if (inc.note) charmNotes.push({ speaker: 'Narration', text: inc.note });
    }
    let newCompHp = Math.max(0, sipped - counter);
    // Second Wind Band: once per battle, a hit that would drop you leaves
    // exactly 1 Resolve instead.
    if (!scripted && newCompHp <= 0 && charmSurvivesLethal(charmId) && !charmRef.current.secondWind) {
      charmRef.current.secondWind = true;
      newCompHp = 1;
      charmNotes.push({ speaker: 'Narration', text: `${charmName} holds! ${companion.creature.name} stands at 1 Resolve.` });
    }
    later(650, () => setWildLunge((n) => n + 1));
    later(790, () => {
      setCompanionHp(newCompHp);
      setCompanionHit((h) => h + 1);
      setCompPop((p) => ({ id: p.id + 1, amount: counter }));
      playSfx('hit');
    });
    say(
      [
        { speaker: companion.creature.name, text: moveLanded(companion.creature.name, move) },
        scripted
          ? { speaker: 'Rowan', text: sparRound >= 3
              ? 'And... down! Pebblepup barely broke a sweat.'
              : `Not bad! But Pebblepup has months on you two. (-${counter})` }
          : { speaker: 'Narration', text: `${wild.name} pushes back! Your resolve dips. (-${counter})` },
        ...charmNotes,
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
    if (knots <= 0) {
      say([{ speaker: 'Narration', text: noKnotLine() }], () => setPhase('menu'));
      return;
    }
    if (teamFull) {
      say([{ speaker: 'Narration', text: catchFullLine(wild.name) }], () => setPhase('menu'));
      return;
    }
    dispatch({ type: 'CONSUME_ITEM', payload: { itemId: 'knot' } });
    const shared = 1 - wildHp / target.hp;
    const standing = companionHp / companion.maxHp;
    const chance = clamp(
      target.catchRate * (0.25 + 0.45 * shared + 0.3 * standing) + Math.min(0.15, companion.bond / 300),
      0.05,
      0.95
    );
    if (Math.random() < chance) {
      const beforeLevel = companion.level;
      const afterXp = companion.xp + target.xp;
      dispatch({ type: 'SET_HP', payload: { hp: companionHp } });
      dispatch({ type: 'GAIN_XP', payload: { amount: target.xp } });
      dispatch({ type: 'CATCH', payload: { creatureId: target.targetId, xp: 60, bond: 5 } });
      playSfx('catch');
      say(catchSuccessLines(wild.name), () => runLevelEvolveThen(beforeLevel, afterXp, finish));
    } else {
      // Balance Root's promise: once per battle, a refused Knot draws no
      // backlash at all — the moment stays calm.
      if (charmShrugsKnotBacklash(charmId) && !charmRef.current.balanceRoot) {
        charmRef.current.balanceRoot = true;
        say([
          { speaker: 'Narration', text: catchFailLine(wild.name) },
          { speaker: 'Narration', text: `${charmName} steadies the moment — no backlash comes.` },
        ], () => setPhase('menu'));
        return;
      }
      let counter = wildCounter();
      const inc = charmIncoming(charmId, counter, charmRef.current.hits, charmName);
      counter = inc.dmg;
      charmRef.current.hits += 1;
      let newCompHp = Math.max(0, companionHp - counter);
      const notes = inc.note ? [{ speaker: 'Narration', text: inc.note }] : [];
      if (newCompHp <= 0 && charmSurvivesLethal(charmId) && !charmRef.current.secondWind) {
        charmRef.current.secondWind = true;
        newCompHp = 1;
        notes.push({ speaker: 'Narration', text: `${charmName} holds! ${companion.creature.name} stands at 1 Resolve.` });
      }
      setWildLunge((n) => n + 1);
      later(140, () => {
        setCompanionHp(newCompHp);
        setCompanionHit((h) => h + 1);
        setCompPop((p) => ({ id: p.id + 1, amount: counter }));
        playSfx('hit');
      });
      say([{ speaker: 'Narration', text: catchFailLine(wild.name) + ` (-${counter})` }, ...notes], () => {
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
    // Losing the push-up contest IS the intro's ending: Rowan sends you home,
    // the contest is marked done (he got what he wanted), and the house tour
    // picks up the story - rest and food are the half of training the gym
    // cannot teach.
    if (params.sparIntro) {
      dispatch({ type: 'MARK_META', payload: { sparDone: true } });
      say(
        [
          { speaker: 'Rowan', text: 'Good contest! Nobody beats Pebblepup on day one - that is months of showing up, not talent.' },
          { speaker: 'Coach Maple', text: 'And that is the last lesson of your first morning: losing to yesterday’s work is how you find tomorrow’s. Go home - eat something real, and sleep. I will show you how.' },
        ],
        () => navigate('rest')
      );
      return;
    }
    say(defeatLines(companion.creature.name), () => navigate(returnTo));
  };

  const flee = () => {
    if (params.sparIntro || params.warden) return;
    playSfx('cancel');
    navigate(returnTo);
  };

  const move = selectedMove ? getMove(selectedMove) : null;
  const holdReady = move && move.kind === 'hold' ? hold <= 0 : true;
  const companionMax = companion.maxHp;
  const stageTone = params.stageTone
    || ((params.opponent || params.trainerBattle) ? 'hall' : (params.from === 'route' ? 'grass' : 'trail'));
  const stageHorizon = params.horizon != null ? params.horizon : 0.16;

  const top = (
    <BattleStage tone={stageTone} horizon={stageHorizon}>
      <View style={{ flex: 1, padding: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <StatusPlate
            name={wild.name}
            hp={wildHp}
            maxHp={target.hp}
            tag={params.trainer ? `${params.trainer}'s` : params.opponent ? 'sparring' : target.isCompanion ? 'wild' : isGrownForm(wild.id) ? 'grown' : 'obstacle'}
            tagColor={target.isCompanion ? palette.hpHigh : palette.danger}
            style={{ flex: 1, marginRight: space.lg }}
          />
          <Animated.View style={{ alignItems: 'center', marginTop: 2, transform: [{ translateX: wildEnter }] }}>
            {params.warden && params.trainer ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <PixelSprite
                  spriteKey={wardenSprite(params.trainerKit || 'hero_man', 'down', 0)}
                  palette={
                    params.trainerKit === 'hero_woman' ? 'pc_woman'
                      : params.trainerKit === 'hero_nonbinary' ? 'pc_nonbinary'
                        : params.trainerKit === 'coach_maple' ? 'coach'
                          : 'pc_man'
                  }
                  size={40}
                />
                <PixelSprite
                  spriteKey={wild.sprite}
                  palette={wild.palette}
                  size={84}
                  bob={!wildFaint}
                  hitCount={wildHit}
                  lungeCount={wildLunge}
                  lungeDir={{ x: -0.9, y: 0.45 }}
                  fainting={wildFaint}
                />
              </View>
            ) : (
              <PixelSprite
                spriteKey={wild.sprite}
                palette={wild.palette}
                size={84}
                bob={!wildFaint}
                hitCount={wildHit}
                lungeCount={wildLunge}
                lungeDir={{ x: -0.9, y: 0.45 }}
                fainting={wildFaint}
              />
            )}
            <DamagePop pop={wildPop} color={palette.secondary} />
            <Platform width={params.warden && params.trainer ? 120 : 92} tone={stageTone} />
          </Animated.View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 'auto' }}>
          <Animated.View style={{ alignItems: 'center', marginRight: space.md, transform: [{ translateX: compEnter }] }}>
            <View>
              <PixelSprite
                spriteKey={companion.creature.sprite}
                palette={companion.creature.palette}
                size={96}
                bob={!companionFaint}
                hitCount={companionHit}
                lungeCount={companionLunge}
                lungeDir={{ x: 0.9, y: -0.45 }}
                fainting={companionFaint}
                flip
              />
            </View>
            <DamagePop pop={compPop} color={palette.danger} />
            <Platform width={108} tone={stageTone} />
          </Animated.View>
          <StatusPlate
            name={companion.creature.name}
            level={companion.level}
            hp={companionHp}
            maxHp={companionMax}
            xpInto={companion.xpInto}
            xpNeeded={companion.xpNeeded}
            showNumbers
            style={{ flex: 1, marginLeft: space.sm }}
          />
        </View>
      </View>
    </BattleStage>
  );

  let bottom;
  if (phase === 'menu') {
    const bondDisabled = knots <= 0;
    bottom = (
      <View style={{ flex: 1, padding: space.md }}>
        <PixelText size="tiny" color={palette.windowTextDim} style={{ marginBottom: 6 }}>
          Choose a move — then do it for real!
        </PixelText>
        <Menu
          tone="cream"
          columns={2}
          options={battleMoves.map((m) => ({
            label: m.name,
            value: m.id,
            sublabel: m.kind === 'hold' ? `${m.target}s ${m.exercise}` : `${m.target} ${m.exercise}`,
          }))}
          onSelect={(opt) => startMove(opt.value)}
        />
        <View style={{ flexDirection: 'row', marginTop: space.sm }}>
          {params.sparIntro || params.warden ? null : (
            <PixelButton label="Flee" tone="plain" sound="cancel" style={{ flex: 1, marginRight: 5 }} onPress={flee} />
          )}
          {party.members.length > 1 ? (
            <PixelButton label="Rotate" tone="dark" sound="cursor" style={{ flex: 1, marginRight: 5 }} onPress={() => setPhase('swap')} />
          ) : null}
          {target.isCompanion ? (
            <PixelButton label={`Tie a Knot (${knots})`} tone="gold" disabled={bondDisabled} style={{ flex: 1 }} onPress={attemptCatch} />
          ) : null}
        </View>
      </View>
    );
  } else if (phase === 'swap') {
    bottom = (
      <View style={{ flex: 1, padding: space.md }}>
        <PixelText size="tiny" color={palette.windowTextDim} style={{ marginBottom: 6 }}>
          Who takes the lead?
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
        {ceremony ? (
          <GrowthCeremony
            fromCreature={ceremony.from}
            toCreature={ceremony.to}
            checks={ceremony.checks}
            onDone={() => {
              dispatch({ type: 'EVOLVE', payload: { newId: ceremony.from.evolvesTo } });
              const after = ceremony.after;
              const evo = ceremony.lines;
              setCeremony(null);
              say([evo[2], evo[3]], after);
            }}
          />
        ) : (
          <PixelText size="label" color={palette.secondary}>. . .</PixelText>
        )}
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
