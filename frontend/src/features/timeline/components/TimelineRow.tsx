import { View } from 'react-native';

import type { TimelineItem } from '@/domain/timeline/TimelineItem';

import { resolveTimelineVisuals } from '../resolveTimelineVisuals';

import { TimelineCard } from './TimelineCard';
import { TimelineDot } from './TimelineDot';
import { styles } from './TimelineRow.styles';

type Props = {
  item: TimelineItem;
  onToggle: (id: string) => void;
};

/** Jeden wiersz osi czasu: kropka na linii + karta obok. */
export function TimelineRow({ item, onToggle }: Props) {
  const visuals = resolveTimelineVisuals(item);

  return (
    <View style={styles.row}>
      <TimelineDot
        visuals={visuals}
        title={item.title}
        done={item.status === 'done'}
        onToggle={() => onToggle(item.id)}
      />
      <TimelineCard item={item} visuals={visuals} />
    </View>
  );
}
