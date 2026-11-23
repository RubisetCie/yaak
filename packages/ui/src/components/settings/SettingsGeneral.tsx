import type { ReactNode } from "react";
import { IconButton } from "../IconButton";
import {
  SettingRow,
  SettingRowBoolean,
  SettingRowSelect,
  SettingSelectControl,
  SettingsList,
  SettingsSection,
  SettingValue,
} from "./SettingRow";
import { SettingsPage } from "./SettingsPage";
import type { SettingsCallbacks, SettingsView } from "./types";

export interface SettingsGeneralProps {
  view: SettingsView;
  callbacks: SettingsCallbacks;
  /** Shown under the heading, like the client's commercial-use banner */
  banner?: ReactNode;
  /** Sections only this app has, shown before App Info */
  extraSections?: ReactNode;
}

export function SettingsGeneral({ view, callbacks, banner, extraSections }: SettingsGeneralProps) {
  const { app, values } = view;
  return (
    <SettingsPage
      title="General"
      description="Configure general settings."
      banner={banner}
    >
      <SettingsList className="space-y-8">
        {extraSections}

        <SettingsSection title="App Info">
          <SettingRow title="Version" description={`Current ${app.name} version.`}>
            <SettingValue value={app.version} />
          </SettingRow>
          <SettingRow
            title="Data Directory"
            description={`Where ${app.name} stores application data.`}
            controlClassName="min-w-0 max-w-[min(42rem,55vw)] gap-2"
          >
            <SettingValue
              value={app.dataDir}
              actions={[
                {
                  title: app.revealPathLabel,
                  icon: "folder_open",
                  onClick: () => callbacks.onRevealPath(app.dataDir),
                },
              ]}
            />
          </SettingRow>
          <SettingRow
            title="Logs Directory"
            description={`Where ${app.name} writes application logs.`}
            controlClassName="min-w-0 max-w-[min(42rem,55vw)] gap-2"
          >
            <SettingValue
              value={app.logDir}
              actions={[
                {
                  title: app.revealPathLabel,
                  icon: "folder_open",
                  onClick: () => callbacks.onRevealPath(app.logDir),
                },
              ]}
            />
          </SettingRow>
        </SettingsSection>
      </SettingsList>
    </SettingsPage>
  );
}
