import { StyleSheet } from 'react-native';

import { radius } from '@/theme';

import { DRAWING_OFFSET, HALO_SIZE, ROAD, ROAD_TOP, STAGE } from './strollerGeometry';

export const styles = StyleSheet.create({
  stage: {
    width: STAGE.width,
    height: STAGE.height,
    alignSelf: 'center',
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: radius.pill,
    left: (STAGE.width - HALO_SIZE) / 2,
    top: (STAGE.height - HALO_SIZE) / 2 - ROAD.thickness * 2,
  },
  drawing: {
    position: 'absolute',
    left: DRAWING_OFFSET.left,
    top: DRAWING_OFFSET.top,
  },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ROAD_TOP,
    overflow: 'hidden',
  },
  roadDashes: {
    flexDirection: 'row',
  },
  roadDash: {
    width: ROAD.dash,
    height: ROAD.thickness,
    marginRight: ROAD.gap,
  },
});
