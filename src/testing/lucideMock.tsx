/**
 * Atrapa `lucide-react-native` w testach (podpięta w package.json → jest.moduleNameMapper).
 * Prawdziwy pakiet to ponad tysiąc ikon SVG — ładowany w każdym pliku testów zjadał pamięć.
 * Każda ikona to pusty View z `testID="icon-<Nazwa>"`; ten sam import zawsze zwraca ten sam
 * komponent, więc można porównywać `icon === Check`.
 */
import { View } from 'react-native';

/** Plik jest ładowany przez Jest jako CommonJS — `module` istnieje w runtime. */
declare const module: { exports: unknown };

type IconProps = { color?: string; size?: number; strokeWidth?: number };
type IconComponent = ((props: IconProps) => React.JSX.Element) & { displayName?: string };

const cache = new Map<string, IconComponent>();

function createIcon(name: string): IconComponent {
  const Icon: IconComponent = ({ color }) => (
    <View testID={`icon-${name}`} accessibilityHint={color} />
  );
  Icon.displayName = `Icon(${name})`;
  return Icon;
}

function iconFor(name: string) {
  let Icon = cache.get(name);
  if (!Icon) {
    Icon = createIcon(name);
    cache.set(name, Icon);
  }
  return Icon;
}

module.exports = new Proxy(
  {},
  {
    get: (_target, property) => {
      if (property === '__esModule') return true;
      if (typeof property !== 'string') return undefined;
      return iconFor(property);
    },
  },
);
