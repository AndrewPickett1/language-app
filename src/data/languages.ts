export type LanguageCode = 'ES' | 'FR' | 'DE' | 'IT' | 'PT';

export type Language = {
  code: LanguageCode;
  name: string;
  /** The language's name for itself. */
  native: string;
  /** BCP 47 tag for text-to-speech. */
  locale: string;
  /** Shown after a correct Study answer. */
  praise: string;
  /** The masculine and feminine definite articles, for the Gender exercise. */
  articles: { M: string; F: string };
};

export const Languages: Language[] = [
  { code: 'ES', name: 'Spanish', native: 'Español', locale: 'es-ES', praise: '¡Muy bien!', articles: { M: 'el', F: 'la' } },
  { code: 'FR', name: 'French', native: 'Français', locale: 'fr-FR', praise: 'Très bien !', articles: { M: 'le', F: 'la' } },
  { code: 'DE', name: 'German', native: 'Deutsch', locale: 'de-DE', praise: 'Sehr gut!', articles: { M: 'der', F: 'die' } },
  { code: 'IT', name: 'Italian', native: 'Italiano', locale: 'it-IT', praise: 'Molto bene!', articles: { M: 'il', F: 'la' } },
  { code: 'PT', name: 'Portuguese', native: 'Português', locale: 'pt-PT', praise: 'Muito bem!', articles: { M: 'o', F: 'a' } },
];

export function getLanguage(code: LanguageCode): Language {
  return Languages.find((l) => l.code === code) ?? Languages[0];
}
