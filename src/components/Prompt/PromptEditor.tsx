import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import {
  CHATGPT_WS_LANGUAGES,
  CHATGPT_WS_PROMPT_EDIT_DEFAULT_OPTIONS,
} from '../../constants';
import {
  PROSEMIRROR,
  CHATGPT_PROMPT_TEXAREA_ID,
  SEND_MSG_BUTTON,
  EDITOR_INITIALIZED_CLASS,
} from '../../content/AssignDom';
import { useSettings } from '../../context/SettingsContext';
import './index.css';

const PromptEditor: React.FC = () => {
  const { settings } = useSettings();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | undefined>(
    undefined,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const screenButtonRef = useRef<HTMLButtonElement | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      if (editorRef.current) {
        editorRef.current.trigger('keyboard', 'submit-on-enter', null);
      }
    }
  };

  const handleEditorScroll = (editor: monaco.editor.IStandaloneCodeEditor) => {
    const scrollTop = editor.getScrollTop();

    if (scrollTop === 0) {
      editor.revealLine(0);
    }
  };

  const addEditorActionOnce = (
    editor: monaco.editor.IStandaloneCodeEditor,
    action: monaco.editor.IActionDescriptor,
  ) => {
    const existingAction = editor.getAction(action.id);
    if (!existingAction) {
      editor.addAction(action);
    }
  };

  const sendButton = document.querySelector<HTMLButtonElement>(SEND_MSG_BUTTON);

  const checkInitialized = useCallback(() => {
    const promptParent = document.querySelector(PROSEMIRROR)?.parentElement;
    const isIntialized = promptParent?.classList.contains(
      EDITOR_INITIALIZED_CLASS,
    );
    console.log('Is initialized:', isIntialized);
    return promptParent?.classList.contains(EDITOR_INITIALIZED_CLASS);
  }, []);

  const setupEditorEvents = (
    editor: monaco.editor.IStandaloneCodeEditor,
    promptProseMirror: HTMLElement,
  ) => {
    sendButton?.classList.add('ws-border-2', 'ws-border-white');

    const submitAction = () => {
      if (promptProseMirror) {
        const newValue = editor.getValue();
        updateChatGPTTextarea(newValue);

        promptProseMirror.innerHTML = '';
        promptProseMirror.appendChild(document.createTextNode(newValue));
        promptProseMirror.dispatchEvent(new Event('input', { bubbles: true }));
        editor.setValue('');
      }

      sendButton?.focus();
      sendButton?.click();
    };

    sendButton?.addEventListener('click', submitAction);

    addEditorActionOnce(editor, {
      id: 'submit-on-enter',
      label: 'Submit on Enter',
      contextMenuGroupId: 'navigation',
      keybindings: [monaco.KeyCode.Enter],
      run: (ed) => {
        submitAction();
      },
    });

    addEditorActionOnce(editor, {
      id: 'toggle-fullscreen',
      label: 'Toggle Fullscreen',
      contextMenuGroupId: 'navigation',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.F11],
      run: toggleFullscreen,
    });

    editor.onDidChangeModelContent(() => {
      const newValue = editor.getValue();
      // Update ProseMirror content
      updateChatGPTTextarea(newValue);

      adjustEditorHeight(editor);
    });

    const updateProseMirrorAndSubmit = () => {
      const sendButton =
        document.querySelector<HTMLButtonElement>(SEND_MSG_BUTTON);

      if (promptProseMirror && sendButton) {
        const newValue = editor.getValue();
        promptProseMirror.innerHTML = '';
        promptProseMirror.appendChild(document.createTextNode(newValue));

        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });
        promptProseMirror.dispatchEvent(inputEvent);
        promptProseMirror.dispatchEvent(changeEvent);

        sendButton.click();
      }
      initializeEditor();
    };

    editor.onKeyDown((e: monaco.IKeyboardEvent) => {
      if (e.keyCode === monaco.KeyCode.Enter && !e.shiftKey) {
        e.preventDefault();
        submitAction();

        updateProseMirrorAndSubmit();
      }
    });

    const updateChatGPTTextarea = (content: string) => {
      const chatGPTTextarea = document.querySelector<HTMLTextAreaElement>(
        CHATGPT_PROMPT_TEXAREA_ID,
      );
      if (chatGPTTextarea) {
        chatGPTTextarea.innerHTML = `<p>${content}</p>`;
        chatGPTTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        chatGPTTextarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    editor.onDidScrollChange(() => handleEditorScroll(editor));
  };

  const initializeEditor = useCallback(() => {
    const promptProseMirror = document.querySelector<HTMLElement>(PROSEMIRROR);
    const promptParent = promptProseMirror?.parentElement;

    if (!promptProseMirror || !promptParent) {
      console.error('ProseMirror editor not found');
      return;
    }

    if (checkInitialized()) {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = undefined;
      }
      if (containerRef.current) {
        containerRef.current.remove();
      }
      promptParent.classList.remove(EDITOR_INITIALIZED_CLASS);
      promptProseMirror.classList.remove('hidden');
      const existingButton = promptParent.querySelector('.fullscreen-toggle');
      if (existingButton) existingButton.remove();
    }

    containerRef.current = document.createElement('div');
    containerRef.current.id = 'wordsmith-prompt';

    containerRef.current.setAttribute('data-placeholder', 'Message ChatGPT...');
    containerRef.current.classList.add(
      'border',
      'border-radius',
      'border-gray-300',
      'ws-relative',
      'ws-w-full',
      'ws-h-[200px]',
    );

    promptProseMirror.parentElement?.insertBefore(
      containerRef.current,
      promptProseMirror,
    );

    promptProseMirror.classList.add('hidden');

    if (containerRef.current) {
      containerRef.current.setAttribute('role', 'textbox');
      containerRef.current.setAttribute('aria-multiline', 'true');
      containerRef.current.setAttribute('aria-label', 'Prompt Editor');
    }
    let fullscreenButton = containerRef.current?.parentElement?.querySelector(
      '.fullscreen-toggle',
    ) as HTMLButtonElement | null;

    if (!fullscreenButton) {
      fullscreenButton = document.createElement('button');
      fullscreenButton.type = 'button';
      fullscreenButton.className = 'fullscreen-toggle';
      fullscreenButton.setAttribute('aria-label', 'Toggle Fullscreen');
      fullscreenButton.title = 'Toggle Fullscreen';
      fullscreenButton.innerHTML = '⛶'; // Unicode fullscreen icon
      containerRef.current?.parentElement?.prepend(fullscreenButton);
    }

    fullscreenButton.onclick = toggleFullscreen;
    screenButtonRef.current = fullscreenButton;
    containerRef.current?.classList.add('prompt-max-height');
    containerRef.current?.parentElement?.prepend(fullscreenButton);

    if (fullscreenButton) {
      fullscreenButton.onclick = toggleFullscreen;
      screenButtonRef.current = fullscreenButton;
    }

    try {
      if (!settings) {
        return;
      }
      const language = settings.promptEditor;

      const initialContent = promptProseMirror.textContent ?? '';
      const model = monaco.editor.createModel(initialContent, language);

      const promptSettings = {
        ...CHATGPT_WS_PROMPT_EDIT_DEFAULT_OPTIONS,
        ...settings,
        accessibilitySupport: 'on',
        scrollbar: {
          vertical: 'auto',
          horizontalSliderSize: 17,
        },
        model,
      };

      editorRef.current = monaco.editor.create(containerRef.current, {
        ...promptSettings,
        model,
      } as Partial<monaco.editor.IStandaloneEditorConstructionOptions>);

      setupEditorEvents(editorRef.current, promptProseMirror);
      adjustEditorHeight(editorRef.current);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      promptParent.classList.add(EDITOR_INITIALIZED_CLASS);
      document
        .querySelector('[data-testid="bar-composer-bar"]')
        ?.setAttribute('style', 'overflow: visible');
    } catch (error) {
      console.error('Error initializing editor:', error);
    }
  }, [settings]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    setIsFullscreen((prevState) => {
      const newState = !prevState;
      if (newState) {
        containerRef.current?.classList.add('fullscreen-editor');
        document.body.classList.add('fullscreen-editor');
        document.body.style.overflow = 'hidden';
      } else {
        containerRef.current?.classList.remove('fullscreen-editor');
        document.body.classList.remove('fullscreen-editor');
        document.body.style.overflow = '';
      }
      if (editorRef.current) {
        setTimeout(() => {
          editorRef.current?.layout();
        }, 100);
      }
      return newState;
    });
  }, []);

  const disposeEditor = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    if (editorRef.current) {
      editorRef.current.dispose();
      editorRef.current = undefined;
    }
    if (containerRef.current) containerRef.current?.remove();

    const promptProseMirror = document.querySelector<HTMLElement>(PROSEMIRROR);
    if (promptProseMirror) {
      promptProseMirror.classList.remove('hidden');
    }

    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    isInitializedRef.current = false;
  };

  const adjustEditorHeight = (editor: monaco.editor.IStandaloneCodeEditor) => {
    if (!editor) return;
    const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
    const lineCount = editor.getModel()?.getLineCount() ?? 1;
    const editorElement = editor.getDomNode();

    const minHeight = lineHeight * 3;
    const newHeight = Math.max(
      minHeight,
      Math.min(lineCount * lineHeight, 75 * lineHeight),
    );

    if (containerRef.current) {
      containerRef.current.style.height = `${newHeight}px`;
    }

    if (editorElement) {
      editorElement.style.height = `${newHeight}px`;
    }

    editor.layout();
  };

  const handleLanguageUpdate = useCallback(
    (language: string) => {
      const updatedLanguage = language || settings.promptEditor;
      const monacoLanguage = updatedLanguage ?? 'plaintext';
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, monacoLanguage);
        }
      }
    },
    [settings],
  );

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      const { language, messageId } = event.detail;
      if (editorRef.current) {
        if ('promptEditor' === messageId) {
          handleLanguageUpdate(language);
        }
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
  }, [handleLanguageUpdate]);

  useEffect(() => {
    if (screenButtonRef.current)
      screenButtonRef.current.onclick = toggleFullscreen;
    return () => {
      if (screenButtonRef.current) screenButtonRef.current.onclick = null;
    };
  }, [toggleFullscreen]);

  useEffect(() => {
    const checkEditorPresence = () => {
      const promptParent = document.querySelector(PROSEMIRROR)?.parentElement;
      if (promptParent && !checkInitialized()) {
        initializeEditor();
      }
    };
    initializeEditor();
    const interval = setInterval(checkEditorPresence, 1000);
    return () => {
      clearInterval(interval);
      disposeEditor();
    };
  }, [initializeEditor, checkInitialized]);

  return null;
};

export default React.memo(PromptEditor);
