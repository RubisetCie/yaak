import type { Settings } from "@yaakapp-internal/models";
import { describe, expect, test } from "vite-plus/test";
import {
  settingsValuesFromModel,
  themesViewFromResolved,
} from "./settingsView";

describe("settingsValuesFromModel", () => {
  test("picks the shared tabs' values and nothing client-only", () => {
    const settings = {
      model: "settings",
      id: "st_1",
      appearance: "dark",
      themeLight: "yaak-light",
      themeDark: "hotdog",
      interfaceFont: "Inter",
      interfaceFontSize: 15,
      editorFont: null,
      editorFontSize: 13,
      editorKeymap: "emacs",
      editorSoftWrap: false,
      coloredMethods: true,
      useNativeTitlebar: true,
      hideWindowControls: true,
      openWorkspaceNewWindow: true,
      clientCertificates: [],
    } as unknown as Settings;

    expect(settingsValuesFromModel(settings)).toEqual({
      appearance: "dark",
      themeLight: "yaak-light",
      themeDark: "hotdog",
      interfaceFont: "Inter",
      interfaceFontSize: 15,
      editorFont: null,
      editorFontSize: 13,
      editorKeymap: "emacs",
      editorSoftWrap: false,
      coloredMethods: true,
      useNativeTitlebar: true,
      hideWindowControls: true,
    });
  });
});

describe("themesViewFromResolved", () => {
  const light = { id: "yaak-light", label: "Yaak", dark: false, base: {} };
  const dark = { id: "yaak-dark", label: "Yaak", dark: true, base: {} };

  test("is null while the themes load", () => {
    expect(themesViewFromResolved(undefined, "dark")).toBeNull();
  });

  test("keeps each theme's id, label and darkness, and the resolved appearance", () => {
    expect(
      themesViewFromResolved({ themes: [dark, light], light, dark, active: dark }, "dark"),
    ).toEqual({
      themes: [
        { id: "yaak-dark", label: "Yaak", dark: true },
        { id: "yaak-light", label: "Yaak", dark: false },
      ],
      light: { id: "yaak-light", label: "Yaak", dark: false },
      dark: { id: "yaak-dark", label: "Yaak", dark: true },
      active: { id: "yaak-dark", label: "Yaak", dark: true },
      resolvedAppearance: "dark",
    });
  });
});
