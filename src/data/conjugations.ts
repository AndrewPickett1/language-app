export type Tense = 'present' | 'past' | 'future';

export const Tenses: { id: Tense; label: string }[] = [
  { id: 'present', label: 'Present' },
  { id: 'past', label: 'Past' },
  { id: 'future', label: 'Future' },
];

/** yo, tú, él/ella, nosotros, vosotros, ellos/ellas: the order every tense's forms are listed in. */
export const Persons = ['Yo', 'Tú', 'Él / Ella', 'Nosotros', 'Vosotros', 'Ellos / Ellas'] as const;

/** One conjugated form, split so the card can highlight the ending. */
export type VerbForm = { stem: string; ending: string };

export type Conjugation = {
  /** Shown as a chip on the card, e.g. "Regular -ar". */
  group: string;
  /** Six forms per tense, in `Persons` order. */
  forms: Record<Tense, VerbForm[]>;
};

const Endings = {
  ar: {
    present: ['o', 'as', 'a', 'amos', 'áis', 'an'],
    past: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'],
  },
  er: {
    present: ['o', 'es', 'e', 'emos', 'éis', 'en'],
    past: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
  },
  ir: {
    present: ['o', 'es', 'e', 'imos', 'ís', 'en'],
    past: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
  },
};
const FutureEndings = ['é', 'ás', 'á', 'emos', 'éis', 'án'];
const ReflexivePronouns = ['me ', 'te ', 'se ', 'nos ', 'os ', 'se '];

/**
 * Placeholder until conjugations are stored: conjugates the infinitive as a regular verb, so
 * irregular verbs (ser, tener, ir…) come out wrong. Reflexive verbs ("levantarse") get their
 * pronoun in front. Returns undefined when the word isn't an -ar/-er/-ir infinitive.
 */
export function regularConjugation(infinitive: string): Conjugation | undefined {
  const word = infinitive.trim().toLowerCase();
  const reflexive = /[aei]rse$/.test(word);
  const verb = reflexive ? word.slice(0, -2) : word;
  const kind = verb.slice(-2) as keyof typeof Endings;
  if (!(kind in Endings)) return undefined;

  const stem = verb.slice(0, -2);
  const pronoun = (i: number) => (reflexive ? ReflexivePronouns[i] : '');
  const build = (base: string, endings: string[]) => endings.map((ending, i) => ({ stem: pronoun(i) + base, ending }));

  return {
    group: `Regular -${kind}`,
    forms: {
      present: build(stem, Endings[kind].present),
      past: build(stem, Endings[kind].past),
      future: build(verb, FutureEndings),
    },
  };
}
