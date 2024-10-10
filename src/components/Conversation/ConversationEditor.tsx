import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { useSettings } from '../../context/SettingsContext';
import {
  CHATGPT_WS_LANGUAGES,
  CHATGPT_WS_CONVERSATION_EDIT_DEFAULT_OPTIONS,
} from '../../constants';
import {
  CONVERSATION_LIST_MUTATION,
  CONV_SUBMIT_BUTTON_ROLE_ATTR,
  SEND_MSG_BUTTON,
  GROUPED_TURN_CONTAINER,
} from '../../content/AssignDom';

const languageMap = CHATGPT_WS_LANGUAGES;

const getMonacoLanguage = (language: string): string => {
  const foundLanguage = languageMap.find(
    (lang) => lang.id === language || lang.aliases!.includes(language),
  );
  return foundLanguage ? foundLanguage.id : language.toLowerCase();
};

const ConversationEditor = () => {
  const { settings, isLoading, updateSettings } = useSettings();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const observer = useRef<MutationObserver>();
  const editorsRef = useRef<Map<string, monaco.editor.IStandaloneCodeEditor>>(
    new Map(),
  );
  const screenButtonRef = useRef<HTMLButtonElement | null>(null);
  const textAreaHolderRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const mainElement = document.querySelector<HTMLElement>('main');
  const sendButton = document.querySelector<HTMLButtonElement>(SEND_MSG_BUTTON);

  const calculateWidth = useCallback(() => '100%', []);

  const createEditor = useCallback(
    (
      container: HTMLElement,
      value: string,
      language: string,
      conversationId?: string,
    ) => {
      if (isLoading) return;
      const monacoLanguage = language;
      const editorSettings = {
        ...CHATGPT_WS_CONVERSATION_EDIT_DEFAULT_OPTIONS,
        ...settings,
      } as monaco.editor.IStandaloneEditorConstructionOptions;

      const uri = monaco.Uri.parse(`inmemory://model/${conversationId}`);

      let model = monaco.editor.getModel(uri);
      if (!model) {
        model = monaco.editor.createModel(value, monacoLanguage, uri);
      } else {
        model.setValue(value);
        monaco.editor.setModelLanguage(model, monacoLanguage);
      }

      const editor = monaco.editor.create(container, editorSettings);
      editor.setModel(model);

      editor.addAction({
        id: 'submit-on-enter',
        label: 'Submit on Enter',
        keybindings: [monaco.KeyCode.Enter],
        run: function () {
          sendButton!.click();
        },
      });

      editorsRef.current.set(conversationId ?? 'promptEditor', editor);

      return editor;
    },
    [settings, isLoading, sendButton],
  );

  const adjustHeight = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor, container: HTMLElement) => {
      const model = editor.getModel();
      if (!model) return;

      const lineHeight = editor.getOption(
        monaco.editor.EditorOption.lineHeight,
      );
      const lineCount = model.getLineCount();
      const minHeight = 100; // Minimum height for the editor
      const maxHeight = 500; // Maximum height for the editor
      const padding = 5; // Additional padding

      let newHeight = Math.max(
        minHeight,
        Math.min(lineCount * lineHeight + padding, maxHeight),
      );

      editor.layout({ width: container.clientWidth, height: newHeight });
      container.style.height = `${newHeight}px`;

      // Adjust parent elements
      const turnElement = container.closest('.turn') as HTMLElement;
      if (turnElement) {
        turnElement.style.height = `${newHeight}px`;
        const turnParent = turnElement.parentElement as HTMLElement;
        if (turnParent) {
          turnParent.style.height = `${newHeight}px`;
        }
      }
    },
    [],
  );

  const replaceTextareaWithEditor = useCallback(
    async (textarea: HTMLTextAreaElement, sibling: Element) => {
      const turnElement = textarea.parentElement;

      if (!turnElement) return;
      textarea.classList.add('ws-hidden');
      if (turnElement.querySelector('wordsmith-conversation-editor-ready'))
        return;

      const turnRect = turnElement.getBoundingClientRect();
      let containerHeight = turnRect.height;

      if (mainElement && turnRect.height > mainElement.clientHeight) {
        containerHeight = mainElement.clientHeight;
      }

      const languageSelect = turnElement
        .closest('article')
        ?.querySelector('[data-language-selector-message-id]');

      const conversationId =
        languageSelect?.getAttribute('data-language-selector-message-id') ??
        'promptEditor';

      let selectedLang =
        languageSelect?.getAttribute('data-selected-language')?.toLowerCase() ??
        'plaintext';

      const containerStyle = `
        display: block;
        width: ${calculateWidth()};
        height: ${containerHeight}px;
      `;

      textAreaHolderRef.current = textarea?.parentElement?.querySelector(
        '.invisible',
      ) as HTMLElement;
      containerRef.current = document.createElement('div');
      containerRef.current.className = 'wordsmith-conversation-editor-ready';
      // containerRef.current.setAttribute('style', containerStyle);
      turnElement.setAttribute('style', containerStyle);
      const gridElement = sibling.querySelector('.grid') as HTMLElement;
      if (gridElement) {
        gridElement.classList.remove('grid');
        gridElement.classList.add('grid-placeholder');
      }

      if (containerRef.current) {
        containerRef.current.setAttribute('role', 'textbox');
        containerRef.current.setAttribute('aria-multiline', 'true');
        containerRef.current.setAttribute('aria-label', 'Prompt Editor');
      }
      let fullscreenButton = document.createElement('button');
      fullscreenButton.type = 'button';
      fullscreenButton.className = 'fullscreen-conversation-toggle';
      fullscreenButton.setAttribute(
        'aria-label',
        'Toggle Conversation Fullscreen',
      );
      fullscreenButton.title = 'Toggle Fullscreen';
      fullscreenButton.innerHTML = '⛶'; // Unicode fullscreen icon

      fullscreenButton.addEventListener('click', toggleFullscreen);

      screenButtonRef.current = fullscreenButton;
      containerRef.current.classList.add('prompt-max-height');
      // containerRef.current.prepend(fullscreenButton);

      containerRef.current.classList.add(
        'relative',
        'height-container',
        'overflow-x-hidden',
      );

      if (textarea.parentNode) {
        textarea.parentNode.insertBefore(containerRef.current, textarea);
      }

      const editorContainer = document.createElement('div');
      editorContainer.setAttribute(
        'data-editor-conversation-id',
        conversationId,
      );
      editorContainer.id = 'editor-container';
      containerRef.current.appendChild(editorContainer);

      const editor = createEditor(
        editorContainer,
        textarea.innerHTML,
        selectedLang,
        conversationId,
      );

      const monacoContent = editor!.getDomNode();
      if (monacoContent) {
        monacoContent.style.height = `${containerHeight + 25}px`;
        turnElement.style.height = `${containerHeight + 25}px`;
        editorContainer.appendChild(monacoContent);
      }

      if (editor) {
        editor.layout();

        editor.onDidChangeModelContent(() => {
          const currentValue = editor.getValue();
          if (currentValue === '') {
            editor.setValue(' ');
            editor.setPosition({ lineNumber: 1, column: 0 });
          }

          if (textarea.parentElement) {
            adjustHeight(editor, textarea.parentElement);
          }

          if (textarea) {
            textarea.value = editor.getValue();
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
          }
          const holderElement = textAreaHolderRef.current;
          if (holderElement) {
            holderElement.innerText = editor.getValue();
          }
        });
      } else console.error('No editor found');
    },
    [calculateWidth, createEditor, settings, mainElement],
  );

  const handleLanguageUpdate = useCallback(
    (language: string, conversationId: string) => {
      const settingsKey = conversationId ?? 'promptEditor';
      const updatedLanguage =
        language ??
        settings[settingsKey].language ??
        settings.promptEditor ??
        '';
      const monacoLanguage = updatedLanguage;

      const uri = monaco.Uri.parse(`inmemory://model/${conversationId ?? ''}`);

      const model = monaco.editor.getModel(uri);

      if (model) {
        monaco.editor.setModelLanguage(model, monacoLanguage);
      } else {
        console.warn(`No model found for conversationId: ${conversationId}`);
      }
    },
    [settings],
  );

  const attachListenersToEditButtons = useCallback(() => {
    const editButtons = document.querySelectorAll(CONV_SUBMIT_BUTTON_ROLE_ATTR);
    editButtons.forEach((button) => {
      if (!button.hasAttribute('wordsmith-listener')) {
        button.addEventListener('click', editButtonHandler);
        button.setAttribute('wordsmith-listener', 'true');
      }
    });
  }, []);

  const editButtonHandler = useCallback(() => {
    if (textAreaHolderRef.current) {
      textAreaHolderRef.current.removeAttribute('style');
    }
    if (containerRef.current) {
      containerRef.current
        .querySelector('.grid-placeholder')
        ?.classList.add('grid');
      const conversationId = containerRef.current
        .closest<HTMLDivElement>(GROUPED_TURN_CONTAINER)!
        .getAttribute('LANGUAGE_MENU_MSG_DATA_ATTR');
      if (conversationId) {
        const editor = editorsRef.current.get(conversationId);

        if (editor) {
          editor.dispose();
          editorsRef.current.delete(conversationId);
        }
      }
      containerRef.current.remove();
    }
  }, []);

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      const { language, conversationId } = event.detail;

      if (!conversationId) {
        console.warn('ConversationId not provided in language change event');
        return;
      }

      const uri = monaco.Uri.parse(`inmemory://model/${conversationId}`);
      let model = monaco.editor.getModel(uri);

      if (model) {
        const monacoLanguage = language;
        monaco.editor.setModelLanguage(model, monacoLanguage);
      } else {
        console.warn('No model found for conversation:', conversationId);
      }
    };

    document.addEventListener(
      'wordsmith-language-change',
      handleLanguageChange as EventListener,
    );

    return () => {
      document.removeEventListener(
        'wordsmith-language-change',
        handleLanguageChange as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const handleLanguageChange = (message: {
      language: string;
      conversationId: string;
    }) => {
      const { language, conversationId } = message;

      if (!conversationId) {
        console.warn('ConversationId not provided in language change message');
        return;
      }

      const uri = monaco.Uri.parse(`inmemory://model/${conversationId}`);
      let model = monaco.editor.getModel(uri);

      if (model) {
        const monacoLanguage = language;
        monaco.editor.setModelLanguage(model, monacoLanguage);
      } else {
        console.warn('No model found for conversation:', conversationId);
      }
    };

    const changeHandler = (message: {
      type?: any;
      language: any;
      conversationId?: string;
    }) => {
      if (message.type === 'GLOBAL_LANGUAGE_CHANGE') {
        if (message.conversationId) {
          handleLanguageChange(
            message as { language: string; conversationId: string },
          );
        } else {
          console.warn(
            'ConversationId not provided in language change message',
          );
        }
      }
    };

    chrome.runtime.onMessage.addListener(changeHandler);

    return () => {
      chrome.runtime.onMessage.removeListener(changeHandler);
    };
  }, [getMonacoLanguage]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current || !screenButtonRef.current) return;

    setIsFullscreen((prevState) => {
      const newState = !prevState;
      if ((newState && containerRef.current) || screenButtonRef.current) {
        document.body.classList.add('editor-fullscreen');
        containerRef.current!.classList.add('fullscreen-editor');
        screenButtonRef.current!.classList.add('fullscreen-button');
      } else {
        document.body.classList.remove('editor-fullscreen');
        containerRef.current!.classList.remove('fullscreen-editor');
        screenButtonRef.current!.classList.remove('fullscreen-button');
      }
      document
        .querySelector<HTMLDivElement>('#editor-container')!
        .classList.add('fullscreen', 'editor-fullscreen');

      return newState;
    });
  }, []);

  useEffect(() => {
    if (screenButtonRef.current)
      screenButtonRef.current.onclick = toggleFullscreen;
    return () => {
      if (screenButtonRef.current) screenButtonRef.current.onclick = null;
    };
  }, [toggleFullscreen]);

  useEffect(() => {
    const observerCallback = (mutationsList: MutationRecord[]) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              (node as Element).matches(CONVERSATION_LIST_MUTATION)
            ) {
              const textArea = (node as HTMLTextAreaElement).querySelector(
                'textarea',
              );
              if (textArea) {
                attachListenersToEditButtons();
                replaceTextareaWithEditor(textArea, node as Element);
              }
            }
          });
        }
      }
    };

    observer.current = new MutationObserver(observerCallback);
    observer.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [
    attachListenersToEditButtons,
    replaceTextareaWithEditor,
    handleLanguageUpdate,
  ]);

  useEffect(() => {
    const handleSettingsUpdate = (message: any) => {
      if (message.type === 'UPDATE_SETTINGS') {
        const newSettings = message.payload;
        updateSettings(newSettings);

        editorsRef.current.forEach((editor) => {
          editor.updateOptions({
            fontSize: newSettings.fontSize,
            lineNumbers: newSettings.showLineNumbers ? 'on' : 'off',
            minimap: { enabled: newSettings.showMinimap },
            wordWrap: newSettings.wordWrap ? 'on' : 'off',
            theme: newSettings.theme || 'vs',
          });

          if (newSettings.language) {
            const model = editor.getModel();
            if (model) {
              monaco.editor.setModelLanguage(model, newSettings.language);
            }
          }
        });

        if (newSettings.theme) {
          monaco.editor.setTheme(newSettings.theme);
        }
      }
    };

    const messageListener = (message: any) => {
      handleSettingsUpdate(message);
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [settings, editorsRef]);

  useEffect(() => {
    const handleResize = () => {};
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateWidth]);

  useEffect(() => {
    monaco.editor.setTheme(settings.theme ?? 'vs');
  }, [settings.theme]);

  return null;
};

export default React.memo(ConversationEditor);
