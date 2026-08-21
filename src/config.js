// App configuration. The AI Coach proxy URL is read from an Expo public env var
// (EXPO_PUBLIC_* values are inlined at build time). Set it when you start Expo:
//   EXPO_PUBLIC_COACH_API_URL=http://localhost:8787 npx expo start
// If unset, the Coach screen runs offline (guardrail + persona only).

export const COACH_API_URL = (process.env.EXPO_PUBLIC_COACH_API_URL || '').replace(/\/+$/, '');

export default { COACH_API_URL };
