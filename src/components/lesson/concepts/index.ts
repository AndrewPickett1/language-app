import type { Slide } from '@/components/lesson/concept-lesson';
import { GendersLesson } from '@/components/lesson/concepts/genders';
import { PronounsLesson } from '@/components/lesson/concepts/pronouns';
import { VerbsLesson } from '@/components/lesson/concepts/verbs';

/** The slide lessons a Lesson module can show, by the module's `lesson_key`. */
export const ConceptLessons: Record<string, Slide[]> = {
  genders: GendersLesson,
  'pronouns-1': PronounsLesson,
  'verbs-1': VerbsLesson,
};
