import { emit } from '@tauri-apps/api/event';
import { openUrl } from '@tauri-apps/plugin-opener';
import { debounce } from '@yaakapp-internal/lib';
import type {
  FormInput,
  InternalEvent,
  JsonPrimitive,
  ShowToastRequest,
} from '@yaakapp-internal/plugins';
import { openSettings } from '../commands/openSettings';
import { Button } from '../components/core/Button';
import { ButtonInfiniteLoading } from '../components/core/ButtonInfiniteLoading';
import { Icon } from '../components/core/Icon';
import { HStack, VStack } from '../components/core/Stacks';

// Listen for toasts
import { listenToTauriEvent } from '../hooks/useListenToTauriEvent';
import { updateAvailableAtom } from './atoms';
import { stringToColor } from './color';
import { generateId } from './generateId';
import { jotaiStore } from './jotai';
import { showPrompt } from './prompt';
import { showPromptForm } from './prompt-form';
import { invokeCmd } from './tauri';
import { showToast } from './toast';

export function initGlobalListeners() {
  listenToTauriEvent<ShowToastRequest>('show_toast', (event) => {
    showToast({ ...event.payload });
  });

  listenToTauriEvent('settings', () => openSettings.mutate(null));

  // Track active dynamic form dialogs so follow-up input updates can reach them
  const activeForms = new Map<string, (inputs: FormInput[]) => void>();

  // Listen for plugin events
  listenToTauriEvent<InternalEvent>('plugin_event', async ({ payload: event }) => {
    if (event.payload.type === 'prompt_text_request') {
      const value = await showPrompt(event.payload);
      const result: InternalEvent = {
        id: generateId(),
        replyId: event.id,
        pluginName: event.pluginName,
        pluginRefId: event.pluginRefId,
        context: event.context,
        payload: {
          type: 'prompt_text_response',
          value,
        },
      };
      await emit(event.id, result);
    } else if (event.payload.type === 'prompt_form_request') {
      if (event.replyId != null) {
        // Follow-up update from plugin runtime — update the active dialog's inputs
        const updateInputs = activeForms.get(event.replyId);
        if (updateInputs) {
          updateInputs(event.payload.inputs);
        }
        return;
      }

      // Initial request — show the dialog with bidirectional support
      const emitFormResponse = (values: Record<string, JsonPrimitive> | null, done: boolean) => {
        const result: InternalEvent = {
          id: generateId(),
          replyId: event.id,
          pluginName: event.pluginName,
          pluginRefId: event.pluginRefId,
          context: event.context,
          payload: {
            type: 'prompt_form_response',
            values,
            done,
          },
        };
        emit(event.id, result);
      };

      const values = await showPromptForm({
        id: event.payload.id,
        title: event.payload.title,
        description: event.payload.description,
        size: event.payload.size,
        inputs: event.payload.inputs,
        confirmText: event.payload.confirmText,
        cancelText: event.payload.cancelText,
        onValuesChange: debounce((values) => emitFormResponse(values, false), 150),
        onInputsUpdated: (cb) => activeForms.set(event.id, cb),
      });

      // Clean up and send final response
      activeForms.delete(event.id);
      emitFormResponse(values, true);
    }
  });
}
