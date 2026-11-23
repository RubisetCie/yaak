import type { Settings } from "@yaakapp-internal/models";
import type {
  SettingsThemeOption,
  SettingsThemesView,
  SettingsValues,
} from "@yaakapp-internal/ui";

/** The values the shared settings tabs read, picked off the client's `Settings` model */
export function settingsValuesFromModel(settings: Settings): SettingsValues {
  return {
    appearance: settings.appearance,
    themeLight: settings.themeLight,
    themeDark: settings.themeDark,
    interfaceFont: settings.interfaceFont,
    interfaceFontSize: settings.interfaceFontSize,
    editorFont: settings.editorFont,
    editorFontSize: settings.editorFontSize,
    editorKeymap: settings.editorKeymap,
    editorSoftWrap: settings.editorSoftWrap,
    coloredMethods: settings.coloredMethods,
    useNativeTitlebar: settings.useNativeTitlebar,
    hideWindowControls: settings.hideWindowControls,
  };
}

/** The fields of a theme the settings show */
interface ThemeLike {
  id: string;
  label: string;
  dark: boolean;
}

function themeOption({ id, label, dark }: ThemeLike): SettingsThemeOption {
  return { id, label, dark };
}

/** The resolved themes, as the shared Theme tab shows them; null while they load */
export function themesViewFromResolved(
  data: { themes: ThemeLike[]; light: ThemeLike; dark: ThemeLike; active: ThemeLike } | undefined,
  resolvedAppearance: "light" | "dark",
): SettingsThemesView | null {
  if (data == null) return null;
  return {
    themes: data.themes.map(themeOption),
    light: themeOption(data.light),
    dark: themeOption(data.dark),
    active: themeOption(data.active),
    resolvedAppearance,
  };
}
