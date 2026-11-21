import { Stack } from 'expo-router';

/** Stos ekranów zakładki Więcej: hub → podekrany (kontakt, wsparcie, o aplikacji…). */
export default function MoreLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
