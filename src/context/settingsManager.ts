import { IEditorOptions, DEFAULT_SETTINGS } from '../constants';

export async function getSettings(): Promise<IEditorOptions> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('settings', (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve({ ...DEFAULT_SETTINGS, ...result.settings });
      }
    });
  });
}

export function updateSettings(
  newSettings: Partial<IEditorOptions>,
): Promise<IEditorOptions> {
  return new Promise((resolve, reject) => {
    getSettings().then((currentSettings) => {
      const updatedSettings = { ...currentSettings, ...newSettings };
      chrome.storage.local.set({ settings: updatedSettings }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(updatedSettings);
        }
      });
    });
  });
}

export function resetSettings(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ settings: DEFAULT_SETTINGS }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}
