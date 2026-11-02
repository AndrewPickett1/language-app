import type { PersonCode } from './conjugations';
import type { LanguageCode } from './languages';

/**
 * The subject pronouns the verb card shows beside each form, per language, keyed by the
 * `person` codes `verb_conjugations` uses. Where one person covers several pronouns
 * (he / she), they're all listed. A language added to `LanguageCode` must be added here too.
 */
export const Pronouns: Record<LanguageCode, Record<PersonCode, string>> = {
  ES: { '1sg': 'Yo', '2sg': 'Tú', '3sg': 'Él / Ella', '1pl': 'Nosotros', '2pl': 'Vosotros', '3pl': 'Ellos / Ellas' },
  FR: { '1sg': 'Je', '2sg': 'Tu', '3sg': 'Il / Elle', '1pl': 'Nous', '2pl': 'Vous', '3pl': 'Ils / Elles' },
  DE: { '1sg': 'Ich', '2sg': 'Du', '3sg': 'Er / Sie', '1pl': 'Wir', '2pl': 'Ihr', '3pl': 'Sie' },
  IT: { '1sg': 'Io', '2sg': 'Tu', '3sg': 'Lui / Lei', '1pl': 'Noi', '2pl': 'Voi', '3pl': 'Loro' },
  PT: { '1sg': 'Eu', '2sg': 'Tu', '3sg': 'Ele / Ela', '1pl': 'Nós', '2pl': 'Vós', '3pl': 'Eles / Elas' },
};
