import React, { useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  PROSEMIRROR,
  LANGUAGE_SELECTOR_SELECT,
  MENU_INITIALIZED_CLASS,
} from '../../content/AssignDom';
import { SettingsProvider, useSettings } from '../../context/SettingsContext';
import LanguageSelector from '../LanguageMenu/LanguageSelector';
import './index.css';

const noop = () => {};

const PromptMenu: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const languageSelectorRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const promptContainerRef = useRef<HTMLDivElement | null>(null);

  const checkInitialized = useCallback(() => {
    const promptParent = document
      .querySelector(PROSEMIRROR)
      ?.closest('.flex.w-full.flex-col');
    const isInitialized = promptParent?.classList.contains(
      MENU_INITIALIZED_CLASS,
    );
    console.log('Menu is initialized:', isInitialized);
    return isInitialized;
  }, []);

  const initializeEditor = useCallback(() => {
    console.log('Attempting to initialize menu...');
    const promptTextArea =
      document.querySelector<HTMLTextAreaElement>(PROSEMIRROR);
    const promptContainer = promptTextArea?.closest(
      '.flex.w-full.flex-col',
    ) as HTMLDivElement;

    if (!promptTextArea || !promptContainer) {
      console.error('Required elements not found');
      return;
    }

    // If already initialized, clean up first
    if (checkInitialized()) {
      console.log('Cleaning up existing menu...');
      if (rootRef.current) {
        rootRef.current.unmount();
        rootRef.current = null;
      }
      if (languageSelectorRef.current) {
        languageSelectorRef.current.remove();
      }
      promptContainer.classList.remove(MENU_INITIALIZED_CLASS);
      promptContainer.classList.remove('prompt-container');
    }

    promptContainerRef.current = promptContainer;
    promptContainer.classList.add('prompt-container');
    promptContainer.style.borderTopLeftRadius = '0px';
    promptContainer.style.borderTopRightRadius = '0px';

    // Create language selector container
    languageSelectorRef.current = document.createElement('div');
    languageSelectorRef.current.className = LANGUAGE_SELECTOR_SELECT;

    const inputRow = promptContainer.querySelector('.flex.items-end');
    if (inputRow) {
      promptContainer.insertBefore(languageSelectorRef.current, inputRow);
    } else {
      promptContainer.prepend(languageSelectorRef.current);
    }

    // Initialize React root and render
    rootRef.current = createRoot(languageSelectorRef.current);
    renderLanguageSelector();

    // Mark as initialized
    promptContainer.classList.add(MENU_INITIALIZED_CLASS);
    console.log('Menu initialization complete');
  }, [settings]);

  const renderLanguageSelector = useCallback(() => {
    console.log('Rendering language selector...');
    if (rootRef.current) {
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
      console.log('Language selector rendered');
    }
  }, [settings, updateSettings]);

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

  useEffect(() => {
    const checkMenuPresence = () => {
      if (!checkInitialized()) {
        console.log('Menu not initialized, attempting initialization...');
        initializeEditor();
      }
    };

    checkMenuPresence();
    const interval = setInterval(checkMenuPresence, 1000);

    return () => {
      clearInterval(interval);
      // Cleanup
      const promptContainer = document
        .querySelector(PROSEMIRROR)
        ?.closest('.flex.w-full.flex-col');
      if (promptContainer) {
        promptContainer.classList.remove(MENU_INITIALIZED_CLASS);
        promptContainer.classList.remove('prompt-container');
      }
      if (rootRef.current) {
        rootRef.current.unmount();
      }
      if (languageSelectorRef.current) {
        languageSelectorRef.current.remove();
      }
    };
  }, [initializeEditor, checkInitialized]);

  return null;
};

export default React.memo(PromptMenu);
