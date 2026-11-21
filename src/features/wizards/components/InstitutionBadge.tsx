import { Badge } from '@/components/atoms/Badge';
import type { WizardInstitution } from '@/domain/wizards/Wizard';
import type { Tone } from '@/theme';

const BADGES: Record<WizardInstitution, { label: string; tone: Tone }> = {
  PRAC: { label: 'Pracodawca / kadry', tone: 'accent' },
  ZUS: { label: 'ZUS (eZUS)', tone: 'primary' },
  USC: { label: 'USC / gov.pl', tone: 'info' },
};

/** Dokąd trafia wynik kreatora — żeby pismo do pracodawcy nie trafiało przez pomyłkę do ZUS. */
export function InstitutionBadge({ institution }: { institution: WizardInstitution }) {
  const badge = BADGES[institution];
  return <Badge label={badge.label} tone={badge.tone} />;
}
