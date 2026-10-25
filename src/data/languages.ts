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
};

export const Languages: Language[] = [
  { code: 'ES', name: 'Spanish', native: 'Español', locale: 'es-ES', praise: '¡Muy bien!' },
  { code: 'FR', name: 'French', native: 'Français', locale: 'fr-FR', praise: 'Très bien !' },
  { code: 'DE', name: 'German', native: 'Deutsch', locale: 'de-DE', praise: 'Sehr gut!' },
  { code: 'IT', name: 'Italian', native: 'Italiano', locale: 'it-IT', praise: 'Molto bene!' },
  { code: 'PT', name: 'Portuguese', native: 'Português', locale: 'pt-PT', praise: 'Muito bem!' },
];

export function getLanguage(code: LanguageCode): Language {
  return Languages.find((l) => l.code === code) ?? Languages[0];
}
