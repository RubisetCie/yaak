import { emit } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { debounce } from "@yaakapp-internal/lib";
import type {
  FormInput,
  InternalEvent,
  JsonPrimitive,
  ShowToastRequest,
} from "@yaakapp-internal/plugins";
import { HStack, Icon, VStack } from "@yaakapp-internal/ui";
import { openSettings } from "../commands/openSettings";
import { Button } from "../components/core/Button";
import { ButtonInfiniteLoading } from "../components/core/ButtonInfiniteLoading";

// Listen for toasts
import { listenToTauriEvent } from "../hooks/useListenToTauriEvent";
import { updateAvailableAtom } from "./atoms";
import { stringToColor } from "./color";
import { generateId } from "./generateId";
import { jotaiStore } from "./jotai";
import { showPrompt } from "./prompt";
import { showPromptForm } from "./prompt-form";
import { invokeCmd } from "./tauri";
import { showToast } from "./toast";

export function initGlobalListeners() {
  listenToTauriEvent<ShowToastRequest>("show_toast", (event) => {
    showToast({ ...event.payload });
  });

  // Show errors for any plugins that failed to load during startup
  void invokeCmd<[string, string][]>("cmd_plugin_init_errors").then((errors) => {
    for (const [dir, err] of errors) {
      const name = dir.split(/[/\\]/).pop() ?? dir;
      showToast({
        id: `plugin-init-error-${name}`,
        color: "danger",
        timeout: null,
        message: `Failed to load plugin "${name}": ${err}`,
      });
    }
  });

  listenToTauriEvent("settings", () => openSettings.mutate(null));

  // Track active dynamic form dialogs so follow-up input updates can reach them
  const activeForms = new Map<string, (inputs: FormInput[]) => void>();

  // Listen for plugin events
  listenToTauriEvent<InternalEvent>("plugin_event", async ({ payload: event }) => {
    if (event.payload.type === "prompt_text_request") {
      const value = await showPrompt(event.payload);
      const result: InternalEvent = {
        id: generateId(),
        replyId: event.id,
        pluginName: event.pluginName,
        pluginRefId: event.pluginRefId,
        context: event.context,
        payload: {
          type: "prompt_text_response",
          value,
        },
      };
      await emit(event.id, result);
    } else if (event.payload.type === "prompt_form_request") {
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
            type: "prompt_form_response",
            values,
            done,
          },
        };
        void emit(event.id, result);
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
