import type { Article } from '@/domain/knowledge/Article';

import { START_ARTICLES } from './startArticles';
import { INSURANCE_ARTICLES } from './insuranceArticles';
import { PREGNANCY_ARTICLES } from './pregnancyArticles';
import { AFTER_BIRTH_ARTICLES } from './afterBirthArticles';
import { DIFFICULT_ARTICLES } from './difficultArticles';
import { CARE_ARTICLES } from './careArticles';
import { RISKS_ARTICLES } from './risksArticles';

/** Wszystkie artykuły, w kolejności rozdziałów. */
export const ARTICLES: readonly Article[] = [
  ...START_ARTICLES,
  ...INSURANCE_ARTICLES,
  ...PREGNANCY_ARTICLES,
  ...AFTER_BIRTH_ARTICLES,
  ...DIFFICULT_ARTICLES,
  ...CARE_ARTICLES,
  ...RISKS_ARTICLES,
];
