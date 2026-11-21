import { Stack } from 'expo-router';

/** Stos ekranów zakładki Wiedza: lista rozdziałów → rozdział → artykuł. Nagłówki rysują same ekrany. */
export default function KnowledgeLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
