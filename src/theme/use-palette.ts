import { Bright, Fixed, Themes, type Palette } from './tokens';

/** The app is light-only (`userInterfaceStyle: "light"` in app.json), whatever the system theme is. */
const palette: Palette = { ...Themes.light, ...Bright, ...Fixed };

export function usePalette(): Palette {
  return palette;
}
