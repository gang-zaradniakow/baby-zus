/**
 * Geometria ilustracji wózka. Rysunek powstaje w siatce 64×48 (`VIEWBOX`)
 * i jest skalowany `SCALE` razy; pozostałe wartości to piksele na ekranie.
 */
export const VIEWBOX = { width: 64, height: 48 } as const;
export const SCALE = 2;

/** Pole całej animacji i położenie rysunku w nim. */
export const STAGE = { width: 168, height: 124 } as const;
export const DRAWING_OFFSET = {
  left: (STAGE.width - VIEWBOX.width * SCALE) / 2,
  top: 8,
} as const;

/** Koła w jednostkach siatki rysunku. */
export const WHEEL_RADIUS = 5;
export const WHEEL_CENTERS = [
  { x: 19, y: 41 },
  { x: 38, y: 41 },
] as const;

/** Kółko-tło za wózkiem. */
export const HALO_SIZE = 116;

/** Przerywana jezdnia: długość kreski + przerwa = okres przesuwania. */
export const ROAD = { dash: 8, gap: 6, thickness: 2 } as const;
export const ROAD_PERIOD = ROAD.dash + ROAD.gap;
export const ROAD_TOP = DRAWING_OFFSET.top + (WHEEL_CENTERS[0].y + WHEEL_RADIUS) * SCALE + 2;

/** Czas jednego obrotu koła — jezdnia przesuwa się o jeden okres w tym samym czasie. */
export const WHEEL_TURN_MS = 900;
