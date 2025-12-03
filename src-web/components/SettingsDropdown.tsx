import { openUrl } from '@tauri-apps/plugin-opener';
import { useRef } from 'react';
import { openSettings } from '../commands/openSettings';
import { useExportData } from '../hooks/useExportData';
import { appInfo } from '../lib/appInfo';
import { showDialog } from '../lib/dialog';
import { importData } from '../lib/importData';
import type { DropdownRef } from './core/Dropdown';
import { Dropdown } from './core/Dropdown';
import { Icon } from './core/Icon';
import { IconButton } from './core/IconButton';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';

export function SettingsDropdown() {
  const exportData = useExportData();
  const dropdownRef = useRef<DropdownRef>(null);

  return (
    <Dropdown
      ref={dropdownRef}
      items={[
        {
          label: 'Settings',
          hotKeyAction: 'settings.show',
          leftSlot: <Icon icon="settings" />,
          onSelect: () => openSettings.mutate(null),
        },
        {
          label: 'Keyboard shortcuts',
          hotKeyAction: 'hotkeys.showHelp',
          leftSlot: <Icon icon="keyboard" />,
          onSelect: () => {
            showDialog({
              id: 'hotkey',
              title: 'Keyboard Shortcuts',
              size: 'dynamic',
              render: () => <KeyboardShortcutsDialog />,
            });
          },
        },
        {
          label: 'Plugins',
          leftSlot: <Icon icon="puzzle" />,
          onSelect: () => openSettings.mutate('plugins'),
        },
        { type: 'separator', label: 'Share Workspace(s)' },
        {
          label: 'Import Data',
          leftSlot: <Icon icon="folder_input" />,
          onSelect: () => importData.mutate(),
        },
        {
          label: 'Export Data',
          leftSlot: <Icon icon="folder_output" />,
          onSelect: () => exportData.mutate(),
        },
        {
          label: 'Create Run Button',
          leftSlot: <Icon icon="rocket" />,
          onSelect: () => openUrl('https://yaak.app/button/new'),
        },
      ]}
    >
      <IconButton
        size="sm"
        title="Main Menu"
        icon="settings"
        iconColor="secondary"
        className="pointer-events-auto"
      />
    </Dropdown>
  );
}
