// Exercise challenge. Your active companion channels real exercises into
// Resolve. Trail companions may tie a Kinship Knot with you after trust is built;
// bad-habit obstacles are cleared. Rotate changes the Circle's lead.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { Screen, DualPane, Window, Menu, DialogueBox, BattleStage, Platform, StatusPlate, PixelText, PixelSprite, PixelButton } from '../components';
import { palette, space } from '../theme';
import { useGame, useCompanion, useParty } from '../state';
import { levelFromXp } from '../state/leveling';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { ENCOUNTERS } from '../data/obstacles';
import { getCreature } from '../data/creatures';
import { canEvolve } from '../state/evolution';
import { battleMovesFor, movesLearnedBetween } from '../data/exercises';
import {
  wildIntro,
  sparIntro, movePrompt, moveLanded, victoryLines, defeatLines, levelUpLine, evolveLines,
  catchSuccessLines, catchFailLine, catchFullLine, noKnotLine, companionFledLines, swapLine,
} from '../coach';

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// Accept either a Phase-1.5 encounter {targetId,isCompanion,...} or a legacy
// {encounterId} pointing at an obstacle.
//
// A sparring partner is a third case: a PERSON, passed in whole as `opponent`
// rather than looked up in the creature table. Coach's push-up contest is the
// first battle a new player sees, and it teaches the loop by being the real
// loop — same moves, same Resolve, same victory path. Faking it with a
// creature would have taught the wrong thing, and adding a person to the
// creature table would have put them in the Index.
function resolveTarget(params) {
  const id = params.targetId || params.creatureId;
  if (id) {
    return {
      targetId: id,
      // You cannot befriend a person, and a spar is never a catch.
      isCompanion: !params.opponent && !!params.isCompanion,
      hp: params.hp || 40,
      xp: params.xp || 20,
      bond: params.bond || 6,
      catchRate: params.opponent ? 0 : params.catchRate || 0,
    };
  }
  const e = ENCOUNTERS[params.encounterId] || ENCOUNTERS.sludgewad;
  return { targetId: e.creatureId, isCompanion: false, hp: e.hp, xp: e.xp, bond: e.bond, catchRate: 0 };
}

// A floating damage number over whoever was struck. Keyed by an incrementing
// id so a rapid second hit restarts the animation rather than being swallowed.
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
      <PixelText size="small" color={color}>
        -{pop.amount}
      </PixelText>
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
  // A sparring partner is supplied whole; everything else is a creature.
  const wild = params.opponent || getCreature(target.targetId);
  const returnTo = params.from === 'route' ? 'route' : params.from === 'gym' ? 'gym' : 'hub';
  const knots = state.bag.knot || 0;
  const teamFull = party.members.length >= 6;

  const [wildHp, setWildHp] = useState(target.hp);
  const [companionHp, setCompanionHp] = useState(Math.max(1, Math.round(companion.hp)));

  const [phase, setPhase] = useState('message');
  const [lines, setLines] = useState(() =>
    params.opponent
      ? sparIntro(companion.creature.name, wild.name)
      : wildIntro(companion.creature.name, wild.name, target.isCompanion)
  );
  const thenRef = useRef(() => setPhase('menu'));

  const [selectedMove, setSelectedMove] = useState(null);
  const [hold, setHold] = useState(0);

  // Moves come from the companion's level and evolution stage, already
  // decorated with tier scaling — never from the raw exercise table, or a
  // Tier III companion would fight with Tier I numbers.
  const battleMoves = battleMovesFor(companion.level, companion.creature.stage || 1);
  const getMove = (id) => battleMoves.find((m) => m.id === id) || null;

  const [wildHit, setWildHit] = useState(0);
  const [companionHit, setCompanionHit] = useState(0);
  const [wildLunge, setWildLunge] = useState(0);
  const [companionLunge, setCompanionLunge] = useState(0);
  const [wildPop, setWildPop] = useState({ id: 0, amount: 0 });
  const [compPop, setCompPop] = useState({ id: 0, amount: 0 });
  // Timers for the strike choreography; cleared on unmount so a fled battle
  // does not set state on a dead screen.
  const timersRef = useRef([]);
  const later = (ms, fn) => timersRef.current.push(setTimeout(fn, ms));
  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  // The two sides enter from opposite trail edges, establishing a meeting
  // rather than reproducing a franchise-signature battle reveal.
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
    const move = getMove(selectedMove);
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
    // Level is no longer the whole gate: evolve points have to be there too,
    // so a companion evolves because of what you did in the real world and not
    // only because you fought enough obstacles.
    if (canEvolve(companion, creature, level)) {
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
    // You just did the exercise. Record it before anything else happens to it.
    dispatch({ type: 'LOG_EXERCISE', payload: { id: move.id, kind: move.kind, target: move.target } });
    const dmg = move.power + Math.floor((companion.level - 1) * 2);
    const newWildHp = Math.max(0, wildHp - dmg);
    // Choreography: the companion steps INTO the strike, and only then does the
    // wild flinch — cause before effect, ~140ms apart. Damage numbers ride the
    // flinch, not the tap.
    setCompanionLunge((n) => n + 1);
    later(140, () => {
      setWildHp(newWildHp);
      setWildHit((h) => h + 1);
      setWildPop((p) => ({ id: p.id + 1, amount: dmg }));
      playSfx('hit');
    });

    if (newWildHp <= 0) {
      // Faint AFTER the flinch, not with it: lunge at 0ms, hit at 140, and the
      // drop starts once the flash has read.
      later(430, () => setWildFaint(true));
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
        dispatch({ type: 'WIN_BATTLE', payload: { xp: target.xp, bond: target.bond, targetId: target.targetId, companionHp, spar: !!params.opponent } });
        playSfx('victory');
        say(victoryLines(companion.creature.name, wild.name, target.xp), () => runLevelEvolveThen(beforeLevel, afterXp, finish));
      }
      return;
    }

    const counter = wildCounter();
    const newCompHp = Math.max(0, companionHp - counter);
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
    if (knots <= 0) {
      say([{ speaker: 'Narration', text: noKnotLine() }], () => setPhase('menu'));
      return;
    }
    if (teamFull) {
      dispatch({ type: 'CONSUME_ITEM', payload: { itemId: 'knot' } });
      dispatch({ type: 'CATCH', payload: { creatureId: target.targetId, xp: 60, bond: 5 } });
      say([{ speaker: 'Narration', text: catchFullLine(wild.name) }], finish);
      return;
    }
    dispatch({ type: 'CONSUME_ITEM', payload: { itemId: 'knot' } });
    // You do not wear a companion down and take it home. It ties the other
    // loop when it has watched you do the work AND you are still going — so
    // the chance rides on how far through the shared challenge you are and on
    // YOUR OWN remaining Resolve, not on how weak it has become. That inverts
    // the incentive on purpose: finishing strong is what earns the knot, where
    // grinding something into the ground at any cost earns nothing.
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
      const counter = wildCounter();
      const newCompHp = Math.max(0, companionHp - counter);
      setWildLunge((n) => n + 1);
      later(140, () => {
        setCompanionHp(newCompHp);
        setCompanionHit((h) => h + 1);
        setCompPop((p) => ({ id: p.id + 1, amount: counter }));
        playSfx('hit');
      });
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

  const move = selectedMove ? getMove(selectedMove) : null;
  const holdReady = move && move.kind === 'hold' ? hold <= 0 : true;
  const companionMax = companion.maxHp;

  // A balanced field-console composition: both participants receive matched
  // instruments and share one trail plane. Do not tune this against another
  // title's diagonal cards or platform layout.
  const stageTone = params.opponent ? 'hall' : params.from === 'route' ? 'grass' : 'trail';

  const top = (
    <BattleStage tone={stageTone} horizon={0.16}>
      <View style={{ flex: 1, padding: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <StatusPlate
            name={wild.name}
            hp={wildHp}
            maxHp={target.hp}
            tag={params.opponent ? 'sparring' : target.isCompanion ? 'wild' : 'obstacle'}
            tagColor={target.isCompanion ? palette.hpHigh : palette.danger}
            style={{ flex: 1, marginRight: space.lg }}
          />
          <Animated.View style={{ alignItems: 'center', marginTop: 2, transform: [{ translateX: wildEnter }] }}>
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
            <DamagePop pop={wildPop} color={palette.secondary} />
            <Platform width={92} tone={stageTone} />
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
              <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#fff', opacity: evoFlash }} />
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
          <PixelButton label="Flee" tone="plain" sound="cancel" style={{ flex: 1, marginRight: 5 }} onPress={flee} />
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

