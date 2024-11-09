import React, {
  useEffect,
  useCallback,
  useMemo,
  useState,
  useRef,
} from 'react';
import * as monaco from 'monaco-editor';
import * as Switch from '@radix-ui/react-switch';
import { StateProvider, useAppState, updateState } from './state';
import ConversationEditorWrapper from './components/Conversation';
import { BaseStyleSheet } from './components/Style/BaseStyleSheet';
import PromptEditor from './components/Prompt';
import LanguageMenu from './components/LanguageMenu';
import PromptMenu from './components/PromptMenu';
import AssignDom, { GROUPED_TURN_CONTAINER } from './content/AssignDom';
import { useSettings } from './context/SettingsContext';
import { DebugContext, DebugProvider } from './context/DebugContext';

export default App;

function AppContent() {
  const { dispatch } = useAppState();
  const { settings, updateSettings } = useSettings();
  const routeRef = useRef<number>();
  const settingsKey = useMemo(() => JSON.stringify(settings), [settings]);

  const [routeKey, setRouteKey] = useState(Date.now());
  const langkey = `${routeRef.current}_${document.location.pathname}_${settingsKey}`;

  useEffect(() => {
    updateConversationIdAndPlatform();
  }, [routeRef.current]);

  const updateConversationIdAndPlatform = useCallback(() => {
    const id = window.location.pathname.split('/c/')[1] || '';

    updateState(dispatch, {
      conversationId: id,
      url: window.location.href,
    });
  }, [dispatch]);

  const handleRouteChange = useCallback(() => {
    const newRouteKey = Date.now();
    updateState(dispatch, { routeKey: newRouteKey });

    if (routeRef.current !== newRouteKey) {
      routeRef.current = newRouteKey;
      updateConversationIdAndPlatform();
    }
  }, [dispatch, updateConversationIdAndPlatform]);

  useEffect(() => {
    const theme = document.documentElement.classList.toString().includes('dark')
      ? 'chatGPTDark'
      : 'chatGPTLight';
    updateSettings({ theme });
    const handleRouteChange = () => {
      setRouteKey(Date.now());
    };
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'childList' &&
          mutation.target.nodeType === Node.ELEMENT_NODE
        ) {
          const target = mutation.target as Element;
          if (target.matches('main')) {
            handleRouteChange();
          }
        }
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [handleRouteChange]);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'childList' &&
          mutation.target.nodeType === Node.ELEMENT_NODE &&
          (mutation.target as Element).matches('main')
        ) {
          handleRouteChange();
          break;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-message-author-role'],
    });

    updateConversationIdAndPlatform();

    return () => observer.disconnect();
  }, [handleRouteChange, updateConversationIdAndPlatform]);

  useEffect(() => {
    const handleRouteChange = () => {
      setRouteKey(Date.now());
    };

    // Listen for route changes in the ChatGPT application
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'childList' &&
          mutation.target.nodeType === Node.ELEMENT_NODE
        ) {
          const target = mutation.target as Element;
          if (target.matches('main')) {
            handleRouteChange();
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [handleRouteChange]);

  const scrollElementHandler = (message: {
    payload: { selector: any; role: any };
  }) => {
    const { selector, role } = message.payload;
    const element = document.querySelector(selector);

    if (element) {
      element.classList.add('highlight-flash');

      const turnContainer = element.closest(
        GROUPED_TURN_CONTAINER,
      )?.parentElement;
      turnContainer.classList.add('highlight-flash');

      setTimeout(() => {
        turnContainer.classList.remove('highlight-flash');
      }, 1500); // 1500 milliseconds = 1.5 seconds

      if (turnContainer) {
        if (role === 'user') {
          turnContainer.classList.add(
            'ws-border-1',
            'ws-p-5',
            'ws-border',
            'ws-rounded',
            'ws-border-blue-500',
          );
        } else if (role === 'assistant') {
          turnContainer.classList.add(
            'ws-border-1',
            'ws-border',
            'ws-p-5',
            'ws-rounded',
            'ws-border-green-500',
          );
        }
        turnContainer.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  };

  const filterMessageHandler = (message: {
    payload: { user: any; assistant: any; none: any };
  }) => {
    const { user, assistant, none } = message.payload;
    if (user) {
      document.querySelector('main')?.classList.remove('hide-user');
      document.querySelector('main')?.classList.add('hide-assistant');
    }
    if (assistant) {
      document.querySelector('main')?.classList.add('hide-user');
      document.querySelector('main')?.classList.remove('hide-assistant');
    }
    if (none) {
      document.querySelector('main')?.classList.remove('hide-user');
      document.querySelector('main')?.classList.remove('hide-assistant');
    }
  };

  const scrollToConverationHandler = (message: any) => {
    const { conversationId, role } = message.payload;
    const element = document.querySelector(
      `${GROUPED_TURN_CONTAINER} [data-message-id="${conversationId}"]`,
    );

    if (element) {
      const turnContainer = element.closest(
        GROUPED_TURN_CONTAINER,
      )?.parentElement;

      if (turnContainer) {
        // Add highlight flash
        turnContainer.classList.add('highlight-flash');
        setTimeout(() => {
          turnContainer.classList.remove('highlight-flash');
        }, 1500);

        // Add role-specific styling
        if (role === 'user') {
          turnContainer.classList.add(
            'ws-border-1',
            'ws-p-5',
            'ws-border',
            'ws-rounded',
            'ws-border-blue-500',
          );
        } else if (role === 'assistant') {
          turnContainer.classList.add(
            'ws-border-1',
            'ws-border',
            'ws-p-5',
            'ws-rounded',
            'ws-border-green-500',
          );
        }

        // Scroll logic
        const rect = turnContainer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        if (rect.top < 0 || rect.bottom > viewportHeight) {
          // Element is not fully visible, so we scroll
          const scrollOptions = {
            behavior: 'smooth',
            block: 'center',
          };

          // If the element is close to the bottom of the page, align to 'end' instead of 'center'
          if (rect.bottom > viewportHeight - 100) {
            scrollOptions.block = 'end' as ScrollLogicalPosition;
          }

          turnContainer.scrollIntoView({
            behavior: scrollOptions.behavior as ScrollBehavior,
            block: scrollOptions.block as ScrollLogicalPosition,
          });
        }
      }
    }
  };

  const updateSettingsHandler = (message: any) => {
    setRouteKey(Date.now());
    updateSettings(message.payload);
    const { payload } = message;
    monaco.editor.getEditors().forEach((editor) => {
      editor.updateOptions({
        ...payload,
      });
    });
  };

  const globalLanguageHandler = (message: {
    payload: { language: any; conversationMessageId: any; isPrompt: any };
  }) => {
    const { language, conversationMessageId, isPrompt } = message.payload;
    const languageChangeEvent = new CustomEvent('wordsmith-language-change', {
      bubbles: true,
      detail: {
        language,
        conversationMessageId,
        isPrompt,
      },
    });

    if (isPrompt) {
      updateSettings({
        promptEditor: language,
      });
    } else {
      updateSettings({
        [conversationMessageId]: {
          language,
        },
      });
    }
    document.body.dispatchEvent(languageChangeEvent);
  };

  const messageListener = (
    message: { type?: any; payload: any },
    sender: any,
    sendResponse: (arg0: { reset: boolean }) => void,
  ) => {
    switch (message.type) {
      case 'UPDATE_THEME':
        {
          const currentTheme = message.payload;
          monaco.editor.setTheme(currentTheme || 'ChatGPT');
        }
        break;
      case 'RELOAD_PAGE':
        window.location.reload();
        break;
      case 'RESET_SETTINGS':
        if (
          window.confirm(
            `Reset all WordSmith settings to default?
            ⚠️ This will require page refresh to take effect.`,
          )
        ) {
          sendResponse({ reset: true });
          window.location.reload();
        } else {
          sendResponse({ reset: false });
        }
        break;
      case 'UPDATE_SETTINGS':
        updateSettingsHandler(message);
        break;
      case 'GLOBAL_LANGUAGE_CHANGE':
        globalLanguageHandler(message);
        break;
      case 'FILTER_MESSAGES':
        filterMessageHandler(message);
        break;
      case 'SCROLL_TO_CONVERSATION':
        scrollToConverationHandler(message);
        break;
      case 'SCROLL_TO_ELEMENT':
        scrollElementHandler(message);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  return React.useMemo(
    () => (
      <div className="ws-relavtive chagtpt-app-wrapper ws-cursor-pointer">
        <BaseStyleSheet />
        <AssignDom />
        {settings.codeEditor?.conversation && (
          <LanguageMenu
            handleDefaultEdit={() =>
              updateState(dispatch, { wordsmithEdit: false })
            }
            handleWordsmithEdit={() =>
              updateState(dispatch, { wordsmithEdit: true })
            }
            key={'language-menu-' + langkey}
          />
        )}
        {settings.codeEditor?.conversation && (
          <ConversationEditorWrapper key={`conversation-editor-${langkey}`} />
        )}
        {settings.codeEditor?.prompt ? (
          <PromptMenu key={`prompt-menu-${langkey}`} />
        ) : null}
        {settings.codeEditor?.prompt && (
          <PromptEditor key={`prompt-editor-${langkey}`} />
        )}
      </div>
    ),
    [dispatch, settings, routeKey, langkey],
  );
}

function DebugControlTab() {
  const { isDebugEnabled, toggleDebug } = React.useContext(DebugContext);
  const checked = isDebugEnabled;

  return (
    <div className="ws-fixed ws-left-0 ws-top-0 ws-z-50 ws-rounded-br ws-bg-gray-800 ws-p-2 ws-text-white">
      <div className="ws-flex ws-items-center ws-space-x-2">
        <Switch.Root
          defaultChecked={false}
          checked={checked}
          onCheckedChange={toggleDebug}
          id="debug-mode"
          className="ws-focus:shadow-[0_0_0_2px] ws-focus:shadow-black ws-data-[state=checked]:ws-bg-black ws-relative ws-h-[25px] ws-w-[42px] ws-cursor-default ws-rounded-full ws-bg-blackA6 ws-shadow-[0_2px_10px] ws-shadow-blackA4 ws-outline-none"
        >
          <Switch.Thumb className="ws-[21px] ws-block ws-h-[21px] ws-translate-x-0.5 ws-rounded-full ws-bg-white ws-shadow-[0_2px_2px] ws-shadow-blackA4 ws-transition-transform ws-duration-100 ws-will-change-transform data-[state=checked]:ws-translate-x-[19px]" />
        </Switch.Root>
        <label htmlFor="debug-mode" className="ws-text-sm">
          Debug Mode: {isDebugEnabled ? 'On' : 'Off'}
        </label>
      </div>
    </div>
  );
}

function App() {
  return (
    <StateProvider>
      <DebugProvider>
        <AppContent />
      </DebugProvider>
    </StateProvider>
  );
}
