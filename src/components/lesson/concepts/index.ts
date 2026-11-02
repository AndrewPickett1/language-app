import type { Slide } from '@/components/lesson/concept-lesson';
import { GendersLesson } from '@/components/lesson/concepts/genders';

/** The slide lessons a Lesson module can show, by the module's `lesson_key`. */
export const ConceptLessons: Record<string, Slide[]> = {
  genders: GendersLesson,
};
