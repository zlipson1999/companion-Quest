// Phase 2 — chat with your companion coach. Domain-locked: a pre-send guardrail
// refuses off-domain/jailbreak messages locally; allowed messages go to the
// proxy (server/) which holds the API key and enforces the system prompt.

import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { Screen, Window, PixelText, PixelButton, PixelSprite } from '../components';
import { palette, space, FONT_FAMILY } from '../theme';
import { useGame, useCompanion } from '../state';
import { useNav } from './navContext';
import { playSfx } from '../audio';
import { getGoal } from '../data/goals';
import { classifyMessage } from '../coach/guardrail';
import { greeting, refusal, JAILBREAK_LINE } from '../coach/persona';
import { sendCoachMessage, isCoachConfigured } from '../coach/api';

function Bubble({ role, text, companion }) {
  const mine = role === 'user';
  if (mine) {
    return (
      <View style={{ alignSelf: 'flex-end', maxWidth: '82%', marginBottom: space.sm }}>
        <View style={{ backgroundColor: palette.primary, borderWidth: 3, borderColor: palette.ink, padding: 10 }}>
          <PixelText size="small" color={palette.white} style={{ lineHeight: 16 }}>
            {text}
          </PixelText>
        </View>
      </View>
    );
  }
  return (
    <View style={{ alignSelf: 'flex-start', maxWidth: '86%', marginBottom: space.sm, flexDirection: 'row', alignItems: 'flex-end' }}>
      <PixelSprite spriteKey={companion.creature.sprite} palette={companion.creature.palette} size={28} style={{ marginRight: 6, marginBottom: 4 }} />
      <Window tone="cream" pad={10} style={{ flexShrink: 1 }}>
        <PixelText size="small" color={palette.windowText} style={{ lineHeight: 16 }}>
          {text}
        </PixelText>
      </Window>
    </View>
  );
}

export default function CoachChatScreen() {
  const { state } = useGame();
  const companion = useCompanion();
  const { navigate } = useNav();
  const goal = getGoal(state.goalId);
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState(() => [
    { role: 'assistant', text: greeting(companion.creature.name) },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollDown = () => setTimeout(() => scrollRef.current && scrollRef.current.scrollToEnd({ animated: true }), 50);

  const push = (msg) => {
    setMessages((prev) => [...prev, msg]);
    scrollDown();
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    playSfx('confirm');
    push({ role: 'user', text });

    const verdict = classifyMessage(text);
    if (!verdict.allowed) {
      playSfx('cancel');
      const line = verdict.reason === 'jailbreak' ? JAILBREAK_LINE : refusal();
      setTimeout(() => push({ role: 'assistant', text: line }), 250);
      return;
    }

    setLoading(true);
    scrollDown();
    const history = [...messages, { role: 'user', text }]
      .map((m) => ({ role: m.role, content: m.text }));
    // Ensure the payload starts with a user turn.
    while (history.length && history[0].role !== 'user') history.shift();

    const result = await sendCoachMessage({
      messages: history,
      companionName: companion.creature.name,
      goalName: goal ? goal.name : '',
    });
    setLoading(false);
    playSfx(result.refused ? 'cancel' : 'blip');
    push({ role: 'assistant', text: result.reply });
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={{ flex: 1, padding: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.sm }}>
            <PixelText size="heading" color={palette.secondary} style={{ flex: 1 }}>
              Coach {companion.creature.name}
            </PixelText>
            <PixelButton label="Back" tone="plain" size="small" sound="cancel" onPress={() => navigate('hub')} />
          </View>
          <PixelText size="tiny" color={palette.windowTextDim} style={{ marginBottom: space.sm, lineHeight: 12 }}>
            {isCoachConfigured() ? 'Fitness, food, hydration & recovery only. Not medical advice.' : 'Offline demo — set EXPO_PUBLIC_COACH_API_URL for live chat.'}
          </PixelText>

          <ScrollView ref={scrollRef} style={{ flex: 1 }} showsVerticalScrollIndicator={false} onContentSizeChange={scrollDown}>
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.text} companion={companion} />
            ))}
            {loading ? (
              <View style={{ alignSelf: 'flex-start', marginBottom: space.sm }}>
                <Window tone="cream" pad={10}>
                  <PixelText size="small" color={palette.windowTextDim}>
                    {companion.creature.name} is thinking...
                  </PixelText>
                </Window>
              </View>
            ) : null}
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.sm }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about training..."
              placeholderTextColor={palette.windowTextDim}
              style={{
                flex: 1,
                fontFamily: FONT_FAMILY,
                fontSize: 9,
                color: palette.windowText,
                backgroundColor: palette.windowFill,
                borderWidth: 3,
                borderColor: palette.ink,
                paddingHorizontal: 10,
                paddingVertical: 10,
                marginRight: 8,
                minHeight: 44,
              }}
              onSubmitEditing={send}
              returnKeyType="send"
              editable={!loading}
            />
            <PixelButton label="Send" tone="gold" size="small" sound={null} disabled={loading} onPress={send} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
