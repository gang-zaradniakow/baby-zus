import { useState } from 'react';

import { checkStep } from '@/domain/wizards/checkStep';
import { createUpoNumber } from '@/domain/wizards/createUpoNumber';
import { createWizardContext } from '@/domain/wizards/createWizardContext';
import { prefillAnswers } from '@/domain/wizards/prefillAnswers';
import type { SentDocument } from '@/domain/wizards/SentDocument';
import type { StepIssue, WizardAnswers, WizardDefinition } from '@/domain/wizards/Wizard';
import { useToday } from '@/hooks/useToday';
import { useLegalParams } from '@/params';
import { useSession } from '@/session';

/** `intro` — opis kreatora; `step` — jedno pytanie; `review` — „Sprawdź i zatwierdź”. */
export type WizardStage = 'intro' | 'step' | 'review';

/**
 * Stan kreatora: etap, bieżący krok, odpowiedzi (start z profilu), komunikat i złożenie wyniku do
 * „Moje dokumenty”. Ostrzeżenie pokazujemy raz — drugie „Dalej” przechodzi mimo niego.
 */
export function useWizardForm(definition: WizardDefinition) {
  const today = useToday();
  const { profile, sentDocuments, addSentDocument } = useSession();
  const { params } = useLegalParams();
  const ctx = createWizardContext(profile, today, params);
  const steps = definition.steps(ctx);

  const [stage, setStage] = useState<WizardStage>('intro');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(() => prefillAnswers(steps, ctx));
  const [issue, setIssue] = useState<StepIssue | null>(null);

  const step = steps[index];

  const setAnswer = (id: string, value: string) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    setIssue(null);
  };

  const next = () => {
    const found = checkStep(step, answers, ctx);
    const warnedAlready = found?.level === 'warning' && issue?.text === found.text;
    if (found && !warnedAlready) {
      setIssue(found);
      return;
    }
    setIssue(null);
    if (index >= steps.length - 1) setStage('review');
    else setIndex(index + 1);
  };

  /** Wstecz — z pierwszego kroku na wstęp; z podsumowania na ostatni krok. `false` — wyjście z kreatora. */
  const back = (): boolean => {
    setIssue(null);
    if (stage === 'review') {
      setStage('step');
      return true;
    }
    if (stage === 'step' && index > 0) {
      setIndex(index - 1);
      return true;
    }
    if (stage === 'step') {
      setStage('intro');
      return true;
    }
    return false;
  };

  /** Zmiana odpowiedzi z podsumowania. */
  const jumpTo = (stepIndex: number) => {
    setIndex(stepIndex);
    setStage('step');
  };

  /** Tworzy pismo albo wniosek (symulacja eZUS / gov.pl) i zapisuje w „Moje dokumenty”. */
  const submit = (): SentDocument => {
    const result = definition.build(answers, ctx);
    const sequence = sentDocuments.length + 1;
    const document: SentDocument = {
      ...result,
      id: `${definition.id}-${sequence}`,
      wizardId: definition.id,
      createdAt: new Date(),
      applicantName: ctx.applicantName,
      ...(definition.draft && { draft: true }),
      ...(result.kind === 'submission' && { upo: createUpoNumber(today, sequence) }),
    };
    addSentDocument(document);
    return document;
  };

  return {
    ctx,
    steps,
    stage,
    step,
    stepNumber: index + 1,
    answers,
    issue,
    institution: definition.institution(ctx),
    start: () => setStage('step'),
    setAnswer,
    next,
    back,
    jumpTo,
    submit,
  };
}

export type WizardFormApi = ReturnType<typeof useWizardForm>;
