import { useFonts } from "@yaakapp-internal/fonts";
import { patchModel, settingsAtom } from "@yaakapp-internal/models";
import { platform } from "@yaakapp-internal/platform";
import type { SettingsCallbacks, SettingsView } from "@yaakapp-internal/ui";
import { useAtomValue } from "jotai";
import { openExternalUrl } from "../components/core/Link";
import { appInfo } from "../lib/appInfo";
import { revealInFinderText } from "../lib/reveal";
import {
  settingsValuesFromModel,
  themesViewFromResolved,
} from "../lib/settingsView";
import { useResolvedAppearance } from "./useResolvedAppearance";
import { useResolvedTheme } from "./useResolvedTheme";

/** Binds the shared settings tabs to the client's settings model, themes, fonts and license */
export function useSettingsView(): { view: SettingsView; callbacks: SettingsCallbacks } | null {
  const settings = useAtomValue(settingsAtom);
  const appearance = useResolvedAppearance();
  const activeTheme = useResolvedTheme();
  const fonts = useFonts();

  if (settings == null) {
    return null;
  }

  const view: SettingsView = {
    app: {
      name: "Yaak",
      version: appInfo.version,
      dataDir: appInfo.appDataDir,
      logDir: appInfo.appLogDir,
      revealPathLabel: revealInFinderText,
    },
    values: settingsValuesFromModel(settings),
    themes: themesViewFromResolved(activeTheme.data, appearance),
    fonts: fonts.data ?? null,
    windowControlsSetting: platform.osType() !== "macos",
  };

  const callbacks: SettingsCallbacks = {
    onChange: async (patch) => {
      await patchModel(settings, patch);
    },
    onApplyNativeTitlebar: async (useNativeTitlebar) => {
      await patchModel(settings, { useNativeTitlebar });
    },
    onOpenUrl: openExternalUrl,
    onRevealPath: (path) => platform.revealItemInDir(path),
  };

  return { view, callbacks };
}
