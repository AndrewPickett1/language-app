import { PersonCodes, type Conjugation, type PersonCode } from '@/data/conjugations';
import { distractors, gloss, MatchPairs, shuffle, type LessonWord, type Step } from '@/data/lesson';

/** One present-tense form of a verb as a lesson item: "Nous sommes" = "we are", with the pronoun and form apart for fill-the-blank. */
export type DrillForm = { word: LessonWord; pronoun: string; form: string };

/** A verb and the forms its lesson drills. */
export type VerbDrill = { verb: LessonWord; forms: DrillForm[] };

/** How many of each exercise a verb lesson asks, drawn from all its forms. */
const MeaningCount = 6;
const FormCount = 4;
const PickCount = 4;
const ListenCount = 3;
/** A verb needs this many stored forms to be drilled, so every question has three wrong answers. */
const MinForms = 4;

/** English pronouns per person, lined up with the alternatives in `Pronouns` ("Il / Elle" → he, she). */
const English: Record<PersonCode, string[]> = {
  '1sg': ['I'],
  '2sg': ['you'],
  '3sg': ['he', 'she'],
  '1pl': ['we'],
  '2pl': ['you'],
  '3pl': ['they'],
};
/** Tells the two yous apart, as the Pronouns lesson does: tu for friends, vous to be polite or for a group. */
const YouNote: Partial<Record<PersonCode, string>> = { '2sg': ' (casual)', '2pl': ' (polite / plural)' };

const Irregular: Record<string, Record<'I' | 'he' | 'other', string>> = {
  be: { I: 'am', he: 'is', other: 'are' },
  have: { I: 'have', he: 'has', other: 'have' },
};

/** "To be" → "am" for I, "is" for he. Other verbs take an -s for he, she and it: think → thinks, go → goes. */
function englishVerb(meaning: string, person: PersonCode) {
  const [head, ...rest] = meaning.split(';')[0].trim().replace(/^to\s+/i, '').toLowerCase().split(' ');
  const third = person === '3sg';
  const irregular = Irregular[head];
  let verb = head;
  if (irregular) verb = person === '1sg' ? irregular.I : third ? irregular.he : irregular.other;
  else if (third) verb = /(s|sh|ch|x|z|o)$/.test(head) ? `${head}es` : /[^aeiou]y$/.test(head) ? `${head.slice(0, -1)}ies` : `${head}s`;
  return [verb, ...rest].join(' ');
}

/** French drops je to j' before a vowel or a silent h: j'aime, j'habite. */
function withPronoun(pronoun: string, form: string) {
  return pronoun.toLowerCase() === 'je' && /^[aeiouyhàâäéèêëîïôöùûü]/i.test(form) ? `${pronoun.slice(0, 1)}'${form}` : `${pronoun} ${form}`;
}

/**
 * The verb's present-tense forms as lesson items, each with one of its pronouns ("Il" or "Elle", picked
 * at random). Empty when it has fewer than `MinForms` stored, so the module falls back to a word lesson.
 */
export function verbDrill(verb: LessonWord, conjugation: Conjugation | undefined, pronouns: Record<PersonCode, string>): DrillForm[] {
  const present = conjugation?.forms.present ?? [];
  const forms = PersonCodes.flatMap((person, i): DrillForm[] => {
    const stored = present[i];
    if (!stored) return [];
    const form = stored.stem + stored.ending;
    const options = pronouns[person].split(' / ');
    const pick = Math.floor(Math.random() * options.length);
    const pronoun = options[pick];
    const english = English[person][pick] ?? English[person][0];
    const phrase = withPronoun(pronoun, form);
    const word: LessonWord = {
      ...verb,
      id: `${verb.id}-${person}`,
      word: phrase,
      meaning: `${english} ${englishVerb(verb.meaning, person)}${YouNote[person] ?? ''}`,
      kind: 'Conjugation',
      gender: undefined,
      formOf: verb.id,
    };
    // The pronoun as it's written before this form: je, or j' when it elides.
    return [{ word, pronoun: phrase.slice(0, phrase.length - form.length).trim().toLowerCase(), form }];
  });
  return forms.length >= MinForms ? forms : [];
}

/** True when every word in the module is a verb, so it teaches their conjugations instead. */
export function isVerbModule(words: LessonWord[]) {
  return words.length > 0 && words.every((w) => w.kind === 'Verb');
}

/**
 * A verb module's lesson: each verb's word card with its conjugation table, then exercises on the forms
 * alone. Pick the meaning, fill in the form for a pronoun, pick the form for the English, listen & pick,
 * and a match-pairs finale. Wrong answers come only from the same forms.
 */
export function buildVerbLesson(drills: VerbDrill[]): Step[] {
  const steps: Step[] = [];
  let n = 0;
  const key = (kind: string) => `${kind}-${n++}`;
  const forms = drills.flatMap((d) => d.forms);
  const items = forms.map((f) => f.word);
  const quiz = (kind: 'meaning' | 'pick' | 'listen', word: LessonWord): Step => ({
    key: key(kind),
    kind,
    word,
    options: shuffle([word, ...distractors(word, items, [], kind === 'meaning' ? gloss : (w) => w.word.toLowerCase())]),
  });

  for (const { verb } of drills) steps.push({ key: key('verb'), kind: 'verb', verb });

  for (const f of shuffle(forms).slice(0, MeaningCount)) steps.push(quiz('meaning', f.word));

  for (const f of shuffle(forms).slice(0, FormCount)) {
    // Three other forms of the same verb, none spelled like the answer (je pense and il pense share one).
    const others = [...new Set(forms.filter((o) => o.word.formOf === f.word.formOf && o.form !== f.form).map((o) => o.form))];
    steps.push({ key: key('form'), kind: 'form', word: f.word, pronoun: f.pronoun, form: f.form, options: shuffle([f.form, ...shuffle(others).slice(0, 3)]) });
  }

  for (const f of shuffle(forms).slice(0, PickCount)) steps.push(quiz('pick', f.word));
  for (const f of shuffle(forms).slice(0, ListenCount)) steps.push(quiz('listen', f.word));

  const pairs: LessonWord[] = [];
  for (const word of shuffle(items)) {
    if (pairs.length < MatchPairs && !pairs.some((w) => gloss(w).toLowerCase() === gloss(word).toLowerCase())) pairs.push(word);
  }
  if (pairs.length >= 3) steps.push({ key: key('match'), kind: 'match', words: pairs });

  return steps;
}
