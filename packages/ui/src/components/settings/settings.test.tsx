import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vite-plus/test";
import type { HostEditorProps } from "../EditorHost";
import { EditorHostProvider } from "../EditorHost";
import { SettingsDialog } from "./SettingsDialog";
import { SettingsGeneral } from "./SettingsGeneral";
import { SettingsInterface } from "./SettingsInterface";
import { SettingsPage } from "./SettingsPage";
import { SettingsTheme } from "./SettingsTheme";
import type { SettingsCallbacks, SettingsView } from "./types";

// Outside the app there's no Tauri; on macOS the selects are native, which shows their values
vi.mock("@yaakapp-internal/platform", () => ({ platform: { osType: () => "macos" } }));

function StubEditor({ defaultValue }: HostEditorProps) {
  return <div data-editor>{defaultValue}</div>;
}

function render(node: ReactNode) {
  return renderToStaticMarkup(
    <EditorHostProvider value={{ Editor: StubEditor }}>{node}</EditorHostProvider>,
  );
}

/** Text only, so assertions read like the screen */
function text(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const light = { id: "yaak-light", label: "Yaak", dark: false };
const dark = { id: "yaak-dark", label: "Yaak", dark: true };
const hotdog = { id: "hotdog", label: "Hotdog Stand", dark: false };

function stubView(overrides: Partial<SettingsView> = {}): SettingsView {
  return {
    app: {
      name: "Yaak Proxy",
      version: "2026.11.0",
      dataDir: "/data/app.yaak.proxy",
      logDir: "/logs/app.yaak.proxy",
      revealPathLabel: "Reveal in Finder",
    },
    values: {
      appearance: "system",
      themeLight: "missing-theme",
      themeDark: "yaak-dark",
      interfaceFont: null,
      interfaceFontSize: 15,
      editorFont: "Menlo",
      editorFontSize: 13,
      editorKeymap: "vim",
      editorSoftWrap: true,
      coloredMethods: false,
      useNativeTitlebar: false,
      hideWindowControls: false,
    },
    themes: {
      themes: [dark, light, hotdog],
      light: hotdog,
      dark,
      active: hotdog,
      resolvedAppearance: "light",
    },
    fonts: { uiFonts: ["Inter"], editorFonts: ["Menlo"] },
    windowControlsSetting: false,
    ...overrides,
  };
}

const callbacks: SettingsCallbacks = {
  onChange: () => {},
  onApplyNativeTitlebar: () => {},
  onOpenUrl: () => {},
  onRevealPath: () => {},
};

describe("SettingsPage", () => {
  function NoBanner() {
    return null;
  }

  test("puts a banner between the header and the content, each the same gap apart", () => {
    const html = render(
      <SettingsPage title="General" description="About it" banner={<p>Banner</p>}>
        <p>Content</p>
      </SettingsPage>,
    );
    expect(html).toMatch(/<div class="mt-6 [^"]*:hidden"><p>Banner<\/p><\/div>/);
    expect(html).toContain('<div class="mt-6"><p>Content</p></div>');
    expect(text(html)).toBe("General About it Banner Content");
  });

  test("hides the banner slot when the banner renders nothing or only an empty wrapper", () => {
    for (const banner of [<NoBanner key="null" />, <div key="wrapper" className="w-full" />]) {
      const html = render(
        <SettingsPage title="General" banner={banner}>
          <p>Content</p>
        </SettingsPage>,
      );
      // The slot hides itself when nothing inside it has content
      expect(html).toMatch(/<div class="mt-6 \[&amp;:not\(:has\(:not\(:empty\)\)\)\]:hidden">/);
      expect(text(html)).toBe("General Content");
    }
  });
});

describe("SettingsTheme", () => {
  test("renders nothing until the themes load", () => {
    expect(render(<SettingsTheme view={stubView({ themes: null })} callbacks={callbacks} />)).toBe(
      "",
    );
  });

  test("selects the resolved themes and splits them by appearance", () => {
    const html = render(<SettingsTheme view={stubView()} callbacks={callbacks} />);
    expect(text(html)).toContain("Make Yaak Proxy your own by selecting a theme");
    // The setting names a missing light theme; the select shows the one in use
    expect(html).toMatch(/<option value="hotdog" selected="">Hotdog Stand<\/option>/);
    expect(html).toMatch(/<option value="yaak-dark" selected="">Yaak<\/option>/);
    expect(text(html)).toContain("Hotdog Stand (preview)");
  });

  test("shows only the light theme row in light mode", () => {
    const view = stubView();
    const html = render(
      <SettingsTheme
        view={{ ...view, values: { ...view.values, appearance: "light" } }}
        callbacks={callbacks}
      />,
    );
    expect(text(html)).toContain("Light theme");
    expect(text(html)).not.toContain("Dark theme");
  });
});

describe("SettingsInterface", () => {
  test("reads fonts, sizes and editor options, with the app's sections around them", () => {
    const html = render(
      <SettingsInterface
        view={stubView()}
        callbacks={callbacks}
        leadingSections={<p>Leading</p>}
        trailingSections={<p>Trailing</p>}
      />,
    );
    const t = text(html);
    expect(t).toContain("Font used for Yaak Proxy interface controls.");
    expect(html).toMatch(/<option value="15" selected="">15<\/option>/);
    expect(html).toMatch(/<option value="Menlo" selected="">Menlo<\/option>/);
    expect(html).toMatch(/<option value="vim" selected="">Vim<\/option>/);
    expect(t.indexOf("Leading")).toBeLessThan(t.indexOf("Fonts"));
    expect(t.indexOf("Trailing")).toBeGreaterThan(t.indexOf("Native title bar"));
    expect(t).not.toContain("Hide window controls");
  });

  test("offers hiding window controls where the app draws them", () => {
    const t = text(
      render(
        <SettingsInterface
          view={stubView({ windowControlsSetting: true })}
          callbacks={callbacks}
        />,
      ),
    );
    expect(t).toContain("Hide window controls");
  });
});

describe("SettingsDialog", () => {
  test("lists shared and app tabs in order and shows the default one", () => {
    const view = stubView();
    const html = render(
      <SettingsDialog
        titlebar={null}
        defaultTab="proxy"
        tabs={[
          {
            value: "general",
            label: "General",
            icon: "settings",
            content: <SettingsGeneral view={view} callbacks={callbacks} />,
          },
          { value: "proxy", label: "Proxy", icon: "wifi", content: <p>Proxy tab content</p> },
          { value: "hidden", label: "Hidden", icon: "info", hidden: true, content: null },
        ]}
      />,
    );
    const t = text(html);
    expect(t.indexOf("General")).toBeLessThan(t.indexOf("Proxy"));
    expect(t).toContain("Proxy tab content");
    expect(t).not.toContain("Hidden");
  });
});
