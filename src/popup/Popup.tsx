import React, { useState, useMemo, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { sendMessageToContentScript } from '../utils/messaging';
import {
  CHATGPT_WS_LANGUAGES,
  CHATGPT_WS_EDIT_INIT_OPTIONS,
  IEditorOptions,
} from '../constants';
import SearchableOptionsForm from '../components/OptionsForm/TypeaheadHOC';

const themes = [
  { value: 'chatGPTLight', label: 'ChatGPT Light' },
  { value: 'chatGPTDark', label: 'ChatGPT Dark' },
  { value: 'vs', label: 'VS Code Light' },
  { value: 'vs-dark', label: 'VS Code Dark' },
  { value: 'hc-black', label: 'High Contrast Black' },
  { value: 'hc-light', label: 'High Contrast Light' },
];

export const Label: React.FC<{
  children: React.ReactNode;
  props?: any;
  htmlFor?: string;
  className?: string;
}> = ({ className, children, htmlFor, props }) => (
  <label
    {...props}
    htmlFor={htmlFor}
    className={`ws-py-[2px ws-xy-32px] ws-text-xs ${className}`}
  >
    {children}
  </label>
);

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    role="tab"
    className={`ws-flex ws-w-full ws-justify-center ws-whitespace-pre ${
      active
        ? 'ws-bg-blue-500 ws-text-white'
        : 'ws-bg-gray-200 ws-text-gray-700'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

export const Select: React.FC<{
  id: string;
  active?: boolean;
  value: string;
  onChange: (e: { target: { value: any } }) => void;
  children: React.ReactNode;
}> = ({ id, active = true, value, onChange, children, ...props }) => (
  <select
    id={id}
    value={value}
    disabled={!active}
    onChange={onChange}
    className="ws-block ws-w-full ws-border ws-border-blue-100 ws-px-[3px] ws-py-[2px]"
    {...props}
  >
    {children}
  </select>
);

export const Check: React.FC<{
  id: string;
  checked?: boolean;
  active?: boolean;
  value?: string;
  onChange: (e: {
    target: {
      checked: boolean;
    };
  }) => void;
}> = ({ id, active = true, checked, value, onChange, ...props }) => (
  <input
    id={id}
    type="checkbox"
    value={value}
    checked={checked}
    onChange={onChange}
    className="ws-mr-2"
    {...props}
  />
);

export const TextInput: React.FC<{
  id: string;
  active?: boolean;
  value?: string;
  onChange: (e: { target: { value: any } }) => void;
}> = ({ id, active = true, value, onChange, ...props }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    className="ws-block ws-w-full ws-border ws-border-blue-100 ws-px-[3px] ws-py-[2px]"
    {...props}
  />
);

export const NumberInput: React.FC<{
  id: string;
  active?: boolean;
  value?: string;
  min?: number;
  max?: number;
  onChange: (e: { target: { value: any } }) => void;
}> = ({ id, active = true, value, min, max, onChange, ...props }) => (
  <input
    type="number"
    value={value}
    onChange={onChange}
    id={id}
    min={min}
    max={max}
    className="ws-block ws-w-full ws-border ws-border-blue-100 ws-px-[3px] ws-py-[2px]"
  />
);

const TabbedSettingsContainer = () => {
  const [activeTab, setActiveTab] = useState('editor');
  const [pendingSettings, setPendingSettings] =
    useState<Partial<IEditorOptions> | null>();

  const { settings, updateSettings, resetSettings, isLoading } = useSettings();

  const memoSettings = useMemo(() => ({ ...settings }), [settings]);

  const [info, setInfo] = useState({
    codeEditorPrompt: '',
  });

  const handleReset = async () => {
    const response = await sendMessageToContentScript({
      type: 'RESET_SETTINGS',
    });

    if (response?.reset) {
      resetSettings();
    }
  };

  const reloadSettingsHandler = useCallback(
    (newSettings: Partial<IEditorOptions>) => {
      setPendingSettings(newSettings);
      setInfo((prev) => ({
        ...prev,
        codeEditorPrompt: 'Requires page refresh to take effect.',
      }));
    },
    [],
  );

  const handleUpdate = useCallback((newSettings: Partial<IEditorOptions>) => {
    updateSettings(newSettings);
    sendMessageToContentScript({
      type: 'UPDATE_SETTINGS',
      payload: newSettings,
    });
  }, []);

  const handleLanguageChange = useCallback((e: { target: { value: any } }) => {
    const selectedLanguage = e.target.value;
    const newSettings = { ...settings, promptEditor: selectedLanguage };
    updateSettings(newSettings);
    sendMessageToContentScript({
      type: 'UPDATE_SETTINGS',
      payload: newSettings,
    });

    sendMessageToContentScript({
      type: 'GLOBAL_LANGUAGE_CHANGE',
      payload: {
        language: selectedLanguage,
        messageId: 'promptEditor',
        isPrompt: true,
      },
    });
  }, []);

  const handleThemeChange = (event: { target: { value: any } }) => {
    const newTheme = event.target.value;
    const newSettings = { ...settings, theme: newTheme };
    updateSettings(newSettings);
    sendMessageToContentScript({
      type: 'UPDATE_SETTINGS',
      payload: newSettings,
    });
    sendMessageToContentScript({ type: 'UPDATE_THEME', payload: newTheme });
  };

  if (isLoading) return <div aria-live="polite">Loading...</div>;

  return (
    <div className="ws-block ws-max-h-[400px] ws-overflow-auto">
      <div className="ws-flex ws-flex-row ws-overflow-auto">
        <TabButton
          active={activeTab === 'editor'}
          onClick={() => setActiveTab('editor')}
        >
          App Settings
        </TabButton>
        <TabButton
          active={activeTab === 'language'}
          onClick={() => setActiveTab('language')}
        >
          Language & Theme
        </TabButton>
        <TabButton
          active={activeTab === 'other'}
          onClick={() => setActiveTab('other')}
        >
          Text Editor
        </TabButton>
      </div>
      <div className="ws-mt-2 ws-max-h-[calc(400px-2.5rem)] ws-w-full ws-overflow-y-auto">
        <div className="ws-min-w-[calc(100%-17px)]">
          {activeTab === 'other' && (
            <div className="ws-flex ws-flex-col ws-rounded ws-p-[8px]">
              <h3 className="ws-text-lg ws-font-semibold">Text Editor</h3>
              <SearchableOptionsForm
                options={CHATGPT_WS_EDIT_INIT_OPTIONS}
                onChange={handleUpdate}
                currentValues={memoSettings}
              />
              <div className="ws-flex ws-justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Reset all settings to default"
                  className="mt-[10px] mb-0 ws-my-auto ws-max-h-fit ws-max-w-fit ws-rounded ws-bg-blue-700 ws-px-[2px] ws-text-white"
                >
                  Reset All Settings To Default
                </button>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="ws-rounded ws-p-2">
              <h3 className="ws-text-lg ws-font-semibold">
                Conversation Default
              </h3>
              <Label htmlFor="language-select" className="ws-block">
                Select Language:
              </Label>
              <Select
                id="language-select"
                active
                value={memoSettings.promptEditor ?? 'plaintext'}
                onChange={handleLanguageChange}
                aria-label="Select default language for conversation"
              >
                {CHATGPT_WS_LANGUAGES.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.id}
                  </option>
                ))}
              </Select>

              <h3 className="ws-text-lg ws-font-semibold">Theme</h3>
              <Label htmlFor="theme-selector">Select Theme:</Label>
              <Select
                value={memoSettings.theme ?? 'chatGPTLight'}
                id="theme-selector"
                onChange={handleThemeChange}
                aria-label="Select theme"
              >
                {themes.map((theme) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label}
                  </option>
                ))}
              </Select>
              <div id="selected-theme" aria-live="polite" className="ws-mt-2">
                Selected theme: {memoSettings.theme}
              </div>
            </div>
          )}
        </div>
        {info.codeEditorPrompt && (
          <div className="ws-m-[5px] ws-mt-2 ws-flex ws-justify-center ws-space-x-2 ws-rounded ws-border ws-border-blue-500 ws-p-2 ws-text-blue-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="16"
              width="16"
              viewBox="15 15 130 130"
              version="1.0"
              fill="#3b82f6"
              className="ws-cursor-pointer"
            >
              <g>
                <path d="m80 15c-35.88 0-65 29.12-65 65s29.12 65 65 65 65-29.12 65-65-29.12-65-65-65zm0 10c30.36 0 55 24.64 55 55s-24.64 55-55 55-55-24.64-55-55 24.64-55 55-55z"></path>
                <path
                  d="m57.373 18.231a9.3834 9.1153 0 1 1 -18.767 0 9.3834 9.1153 0 1 1 18.767 0z"
                  transform="matrix(1.1989 0 0 1.2342 21.214 28.75)"
                ></path>
                <path d="m90.665 110.96c-0.069 2.73 1.211 3.5 4.327 3.82l5.008 0.1v5.12h-39.073v-5.12l5.503-0.1c3.291-0.1 4.082-1.38 4.327-3.82v-30.813c0.035-4.879-6.296-4.113-10.757-3.968v-5.074l30.665-1.105"></path>
              </g>
            </svg>
            <span>{info?.codeEditorPrompt}</span>
            <button
              className="ws-ml-2 ws-max-h-fit ws-max-w-fit ws-rounded ws-bg-blue-500 ws-px-[2px] ws-text-white"
              onClick={() => {
                if (pendingSettings) {
                  updateSettings(pendingSettings);
                  sendMessageToContentScript({
                    type: 'UPDATE_SETTINGS',
                    payload: pendingSettings,
                  });
                  setPendingSettings(null);
                }
                setInfo((prev) => ({
                  ...prev,
                  codeEditorPrompt: '',
                }));
                sendMessageToContentScript({ type: 'RELOAD_PAGE' });
              }}
            >
              Refresh
            </button>
          </div>
        )}
        {activeTab === 'editor' && (
          <>
            <div className="ws-rounded ws-p-2">
              <h3 className="ws-text-lg ws-font-semibold">Code Editor</h3>
              <Label htmlFor="replace-conversation">
                <Check
                  id="replace-conversation"
                  checked={memoSettings.codeEditor?.conversation}
                  onChange={() => {
                    const newSettings = {
                      ...memoSettings,
                      codeEditor: {
                        ...memoSettings.codeEditor,
                        conversation: !memoSettings.codeEditor?.conversation,
                      },
                    };

                    reloadSettingsHandler(newSettings);
                  }}
                />
                <span>Conversation Editor</span>
              </Label>
              <Label
                htmlFor="replace-prompt"
                className="ws-flex ws-items-center"
              >
                <Check
                  id="replace-prompt"
                  checked={memoSettings.codeEditor?.prompt}
                  onChange={() => {
                    const newSettings = {
                      ...memoSettings,
                      codeEditor: {
                        ...memoSettings.codeEditor,
                        prompt: !memoSettings.codeEditor?.prompt,
                      },
                    };
                    reloadSettingsHandler(newSettings);
                  }}
                />
                <span>Prompt Editor</span>
              </Label>
            </div>
            <div className="ws-rounded ws-p-2">
              <h3 className="ws-text-lg ws-font-semibold">
                Conversation Style
              </h3>
              <Label
                htmlFor="conversation-width"
                className="ws-flex ws-items-center"
              >
                <span className="ws-mr-2">Width</span>
                <Check
                  id="conversation-width"
                  checked={memoSettings.conversation.widthFull}
                  onChange={() => {
                    const newSettings = {
                      ...memoSettings,
                      conversation: {
                        ...memoSettings.conversation,
                        widthFull: !memoSettings.conversation.widthFull,
                      },
                    };
                    handleUpdate(newSettings);
                  }}
                />
                <span>
                  {memoSettings.conversation.widthFull ? 'Full' : 'Original'}
                </span>
              </Label>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(TabbedSettingsContainer);
