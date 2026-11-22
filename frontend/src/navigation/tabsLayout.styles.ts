import { StyleSheet } from 'react-native';

export const tabsLayoutStyles = StyleSheet.create({
  /**
   * `TabSlot` z expo-router ma domyślnie `flexShrink: 0` — rośnie razem z treścią,
   * więc ScrollView w ekranie nie ma ograniczonej wysokości i nie przewija.
   * Pozwalamy mu się kurczyć do miejsca nad paskiem nawigacji.
   */
  slot: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minHeight: 0,
  },
});
