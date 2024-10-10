import React, {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CHATGPT_WS_LANGUAGES } from '../../constants';
import * as Select from '@radix-ui/react-select';
import { Check } from 'lucide-react';
import { getSettings } from '../../context/settingsManager';
import debounce from 'lodash/debounce';
import { useSettings } from '../../context/SettingsContext';
import './index.css';
interface LanguageSelectorProps {
  turnElement: Element;
  handleEditClick?: (turnElement: Element) => void;
  isInConversation: boolean;
  conversationMessageId: string;
  onChange?: (value: string, conversationMessageId: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  turnElement,
  handleEditClick,
  conversationMessageId,
  isInConversation,
  onChange,
}) => {
  const { settings, updateSettings } = useSettings();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>();
  const [languageId, setLanguageId] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const prevLanguageRef = useRef('');
  const languages = CHATGPT_WS_LANGUAGES;

  const updateTheme = useCallback(() => {
    const colorScheme = document.querySelector('html')?.style.colorScheme;
    const darkMode = colorScheme === 'dark';
    if (darkMode) {
      updateSettings({ theme: 'chatGPTDark' });
    }
    setIsDarkMode(colorScheme === 'dark');
  }, []);

  useEffect(() => {
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
    return () => observer.disconnect();
  }, [updateTheme]);

  const fetchAndSetLanguage = useCallback(async () => {
    const fetchedSettings = await getSettings();
    const setting =
      fetchedSettings[conversationMessageId]?.language ||
      fetchedSettings.promptEditor;
    const languageOption = languages?.find(
      (lang) => lang.id === setting || lang.aliases?.includes(setting),
    );
    if (languageOption && languageOption.id !== prevLanguageRef.current) {
      const newSelectedLang =
        languageOption.aliases?.[0] ??
        (languageOption.id || settings.promptLanguage);
      setSelectedLanguage(newSelectedLang);
      setLanguageId(languageOption.id);
      prevLanguageRef.current = languageOption.id;
    }
  }, [conversationMessageId, languages, settings.promptLanguage]);

  const debouncedFetchAndSetLanguage = useMemo(
    () => debounce(fetchAndSetLanguage, 300),
    [fetchAndSetLanguage],
  );

  useEffect(() => {
    debouncedFetchAndSetLanguage();
    return () => {
      debouncedFetchAndSetLanguage.cancel();
    };
  }, [debouncedFetchAndSetLanguage]);

  useEffect(() => {
    const handleGlobalLanguageChange = (event: CustomEvent) => {
      const { isPrompt } = event.detail;
      if (isPrompt) {
        debouncedFetchAndSetLanguage();
      }
    };

    document.addEventListener(
      'wordsmith-language-change',
      handleGlobalLanguageChange as EventListener,
    );

    return () => {
      document.removeEventListener(
        'wordsmith-language-change',
        handleGlobalLanguageChange as EventListener,
      );
    };
  }, [debouncedFetchAndSetLanguage]);

  const handleLanguageSelect = useCallback(
    (value: string) => {
      const langOption = languages.find((lang) => lang.id === value);
      if (langOption && langOption.id !== prevLanguageRef.current) {
        const selectedLang =
          (langOption.aliases?.[0] ?? langOption.id) || settings.promptLanguage;
        setSelectedLanguage(selectedLang);
        setLanguageId(value);
        prevLanguageRef.current = value;

        const newSettings = isInConversation
          ? { ...settings, [conversationMessageId]: { language: value } }
          : { ...settings, promptEditor: value };

        updateSettings(newSettings);

        const languageChangeEvent = new CustomEvent(
          'wordsmith-language-change',
          {
            bubbles: true,
            detail: {
              language: value,
              conversationId: conversationMessageId,
              messageId: conversationMessageId,
              isPrompt: !isInConversation,
            },
          },
        );

        turnElement.dispatchEvent(languageChangeEvent);
      }
    },
    [
      languages,
      settings,
      conversationMessageId,
      isInConversation,
      updateSettings,
      turnElement,
    ],
  );

  const promptWidth = 'ws-w-full';

  return (
    <div
      data-language-selector-message-id={
        conversationMessageId ?? 'promptEditor'
      }
      data-selected-language={selectedLanguage}
      className={`${promptWidth} ${isDarkMode ? 'dark-mode' : ''} mx-auto flex flex-1 gap-4 text-base ws-relavtive ws-width-auto md:gap-5 lg:gap-6 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem] pr-4 ws-left-9 ws-justify-center`}
    >
      <Select.Root value={languageId} onValueChange={handleLanguageSelect}>
        <Select.Trigger
          className={`SelectTrigger ${promptWidth} border ws-inline-flex ws-h-[35px] ws-items-center ws-justify-between ws-gap-[5px] ws-rounded-lg ws-border-neutral-800 ${
            isDarkMode
              ? 'ws-text-[var(--text-normal)]'
              : 'ws-bg-transparent ws-text-blue-500'
          } ws-px-[15px] ws-text-[13px] ws-leading-none ws-outline-none`}
          aria-label={`Select language: currently ${selectedLanguage}`}
        >
          <Select.Value asChild>
            <span className="show-file-icons ws-flex ws-items-center ws-space-x-2">
              <span
                className={`file-icon ${languageId}-lang-file-icon`}
                aria-hidden="true"
              ></span>
              <span className="selected-lang-text">{selectedLanguage}</span>
            </span>
          </Select.Value>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            sideOffset={5}
            position="popper"
            className={`SelectContent ws-overflow-hidden ws-rounded-md ${
              isDarkMode
                ? 'dark-mode floating-menu ws-bg-[var(--background-secondary)] ws-bg-black ws-text-white'
                : 'floating-menu ws-bg-white'
            }`}
            style={
              isDarkMode
                ? { borderColor: 'var(--interactive-normal)' }
                : { borderColor: '#fff' }
            }
          >
            <Select.Viewport className="SelectViewport ws-p-1">
              {languages.map((lang) => {
                return (
                  <Select.Item
                    key={lang.id}
                    value={lang.id}
                    className={`show-file-icons SelectItem ws-relative ws-flex ws-items-center ws-rounded-[3px] ws-px-[25px] ws-py-[5px] ws-text-[13px] ws-leading-none ${
                      isDarkMode
                        ? 'dark-mode .menu-item:hover ws-text-[var(--text-normal)] hover:ws-bg-[var(--interactive-hover)]'
                        : 'ws-focus:ws-bg-violet ws-focus-within:ws-bg-violet hover:ws-bg-violet-100'
                    } focus:ws-outline-none`}
                  >
                    <Select.ItemText className="SelectItemText">
                      <span
                        className={`file-icon ${lang.id}-lang-file-icon selected-lang-text`}
                        aria-hidden="true"
                      >
                        {lang.aliases?.[0] ?? lang.id}
                      </span>
                    </Select.ItemText>
                    <Select.ItemIndicator className="SelectIndicator ws-absolute ws-right-0 ws-inline-flex ws-w-[25px] ws-items-center ws-justify-center">
                      <Check
                        className={`ws-h-4 ws-w-4 ${isDarkMode ? 'ws-text-[var(--interactive-active)]' : 'ws-text-blue-500'}`}
                        aria-hidden="true"
                      />
                    </Select.ItemIndicator>
                  </Select.Item>
                );
              })}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
};

export default React.memo(LanguageSelector);
