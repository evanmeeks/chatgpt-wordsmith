import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PROSEMIRROR, LANGUAGE_SELECTOR_SELECT } from '../../content/AssignDom';
import { SettingsProvider, useSettings } from '../../context/SettingsContext';
import LanguageSelector from '../LanguageMenu/LanguageSelector';
import './index.css';

const noop = () => {};

const PromptMenu: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const languageSelectorRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const promptContainerRef = useRef<HTMLDivElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeEditor = useCallback(() => {
    const homePageSuggestions = document.querySelector('.bottom-full');
    if (homePageSuggestions) {
      homePageSuggestions.classList.replace('bottom-full', 'ws-bottom-24');
    }
    const promptTextArea =
      document.querySelector<HTMLTextAreaElement>(PROSEMIRROR);
    if (!promptTextArea || isInitialized) return;

    const promptContainer = promptTextArea.closest(
      '.flex.w-full.flex-col',
    ) as HTMLDivElement;
    if (!promptContainer) {
      console.error('No prompt container found');
      return;
    }

    promptContainerRef.current = promptContainer;
    if (promptContainer) {
      promptContainer.classList.add('prompt-container');
      promptContainer.style.borderTopLeftRadius = '0px';
      promptContainer.style.borderTopRightRadius = '0px';

      if (!languageSelectorRef.current) {
        languageSelectorRef.current = document.createElement('div');
        languageSelectorRef.current.className = LANGUAGE_SELECTOR_SELECT;

        // Insert the language selector before the input row
        const inputRow = promptContainer.querySelector('.flex.items-end');
        if (inputRow) {
          promptContainer.insertBefore(languageSelectorRef.current, inputRow);
        } else {
          promptContainer.prepend(languageSelectorRef.current);
        }
      }

      if (!rootRef.current && languageSelectorRef.current) {
        rootRef.current = createRoot(languageSelectorRef.current);
      }

      setIsInitialized(true);
    }
  }, [isInitialized]);

  const handleLanguageChange = useCallback(
    (value: string, conversationMessageId: string): void => {
      updateSettings({ promptEditor: value });

      const languageChangeEvent = new CustomEvent('wordsmith-language-change', {
        bubbles: true,
        detail: {
          language: value,
          conversationId: conversationMessageId,
          messageId: conversationMessageId,
        },
      });
      window.dispatchEvent(languageChangeEvent);
    },
    [],
  );

  const renderLanguageSelector = useCallback(() => {
    if (rootRef.current && isInitialized) {
      rootRef.current.render(
        <SettingsProvider>
          <div
            className="prompt-language-container"
            role="menubar"
            tabIndex={0}
          >
            <LanguageSelector
              isInConversation={false}
              handleEditClick={noop}
              conversationMessageId="promptEditor"
              turnElement={document.body}
              onChange={handleLanguageChange}
            />
          </div>
        </SettingsProvider>,
      );
    }
  }, [settings, updateSettings, isInitialized]);

  useEffect(() => {
    initializeEditor();
  }, [initializeEditor]);

  useEffect(() => {
    if (isInitialized) {
      renderLanguageSelector();
    }
  }, [isInitialized, renderLanguageSelector]);

  useEffect(() => {
    return () => {
      setIsInitialized(false);
    };
  }, []);

  return null;
};

export default React.memo(PromptMenu);
