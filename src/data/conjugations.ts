export type Tense = 'present' | 'past' | 'future';

export const Tenses: { id: Tense; label: string }[] = [
  { id: 'present', label: 'Present' },
  { id: 'past', label: 'Past' },
  { id: 'future', label: 'Future' },
];

/** How `verb_conjugations.person` names the six forms, in the order the card lists them. */
export const PersonCodes = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'] as const;
export type PersonCode = (typeof PersonCodes)[number];

/** One conjugated form, split so the card can highlight the ending. An irregular form has no ending. */
export type VerbForm = { stem: string; ending: string };

export type Conjugation = {
  /** Six slots per tense, in `PersonCodes` order. A tense or form with no stored row is missing and shows as a dash. */
  forms: Partial<Record<Tense, (VerbForm | undefined)[]>>;
};

/**
 * Splits a stored form against its infinitive: the ending is whatever follows the part the two
 * share, up to the infinitive's stem ("allons" from "aller" → all + ons). A form that shares
 * nothing with it ("vais") gets no ending, so nothing is highlighted.
 */
export function splitForm(form: string, infinitive: string): VerbForm {
  const a = form.toLowerCase();
  const b = infinitive.trim().toLowerCase();
  const max = Math.max(0, b.length - 2);
  let shared = 0;
  while (shared < max && shared < a.length && a[shared] === b[shared]) shared++;
  return shared === 0 ? { stem: form, ending: '' } : { stem: form.slice(0, shared), ending: form.slice(shared) };
}
