export type LanguageCode = 'ES' | 'FR' | 'DE' | 'JA' | 'IT' | 'PT' | 'KO' | 'ZH';

export type Language = {
  code: LanguageCode;
  name: string;
  /** The language's name for itself. */
  native: string;
  /** BCP 47 tag for text-to-speech. */
  locale: string;
};

export const Languages: Language[] = [
  { code: 'ES', name: 'Spanish', native: 'Español', locale: 'es-ES' },
  { code: 'FR', name: 'French', native: 'Français', locale: 'fr-FR' },
  { code: 'DE', name: 'German', native: 'Deutsch', locale: 'de-DE' },
  { code: 'JA', name: 'Japanese', native: '日本語', locale: 'ja-JP' },
  { code: 'IT', name: 'Italian', native: 'Italiano', locale: 'it-IT' },
  { code: 'PT', name: 'Portuguese', native: 'Português', locale: 'pt-PT' },
  { code: 'KO', name: 'Korean', native: '한국어', locale: 'ko-KR' },
  { code: 'ZH', name: 'Chinese', native: '中文', locale: 'zh-CN' },
];

export function getLanguage(code: LanguageCode): Language {
  return Languages.find((l) => l.code === code) ?? Languages[0];
}
