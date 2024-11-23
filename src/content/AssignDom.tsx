import React, { useCallback, useRef, useEffect } from 'react';
// DOM selector classes
export const EDITOR_INITIALIZED_CLASS = 'ws-editor-initialized';
export const MENU_INITIALIZED_CLASS = 'ws-menu-initialized';
export const CHAGPT_PROMPT_SELECTOR = 'chatgpt-prompt-textarea';
export const TURN_PARENT = 'article';
export const CONV_EDIT_BUTTON_ARIA_LABEL = 'aria-label^="Edit"';
export const TURN_DATA_ATTR = '[data-testid^="conversation-turn"]';
export const TEXT_BASE = '.text-base';
export const TEXT_BASE_CHILD = '.mx-auto';
export const CONVERSATION_LIST_MUTATION = '.rounded-3xl';
export const CONV_SUBMIT_BUTTON_ROLE_ATTR = '[as="button"]';
export const HAS_USER_PSUEUDO = ':has([data-message-author-role="user"])';
export const HAS_ASSISTANT_PSUEUDO =
  ':has([data-message-author-role="assistant"])';
export const USER_DATA_ATTR = '[data-message-author-role="user"]';
export const ASSISTANT_DATA_ATTR_SELECTOR =
  '[data-testid^="conversation-turn"]' + HAS_ASSISTANT_PSUEUDO;
export const USER_DATA_ATTR_SELECTOR =
  '[data-testid^="conversation-turn"]' + HAS_USER_PSUEUDO;
export const WORDSMITH_EDIT_BUTTON = 'button';
export const LANGUAGE_MENU_MSG_DATA_ATTR = 'data-language-selector-message-id';
export const CHATGPT_DATA_MSG_DATA_ATTR = '[data-message-id]';
export const CHATGPT_ARIA_LABEL = '[aria-label^="Edit"]';
export const VITE_DEV_DATA = '[data-vite-dev-id]';
export const GROUPED_TURN_CONTAINER = '[class^="group/conversation-turn"]';
export const ROLE_CONTAINER = '[data-message-author-role]';
export const SEND_MSG_BUTTON = '[data-testid="send-button"]';
export const CHATGPT_PROMPT_TEXAREA_ID = '#prompt-textarea';
export const PROSEMIRROR = '.ProseMirror';
export const PROSEMIRROR_PARENT = '._prosemirror-parent_15ceg_1';

// assigned classes
export const MARKED_DATA = 'data-marked';
export const WORDSMITH_EDITABLE_CONVERSATION = 'wordsmith-editable';
export const CHATGPT_PROMPT = 'chatgpt-prompt-textarea';
export const CONV_EDIT = 'CONV_EDIT_BUTTON';

// tailwind classes
export const USER_BG_COLOR = 'ws-bg-blue-500';
export const AGENT_BG_COLOR = 'ws-bg-green-500';
export const USER_BORDER_COLOR = 'ws-border-blue-500';
export const AGENT_BORDER_COLOR = 'ws-border-green-500';
export const LANGUAGE_SELECTOR_SELECT =
  'prompt-language-selector-container bg-[#f4f4f4] dark:bg-token-main-surface-secondary layout_combo_select';
export const CONVERSATION_LEVEL_LABEL = `level-label ws-absolute ws-left-0 ws-top-0 ws-font-bold ws-text-white ws-text-center ws-py-1 ws-px-2 ws-text-xs ws-cursor-pointer ws-rounded ws-flex ws-items-center language-label ws-cursor-pointer ws-text-gray-700 ws-rounded ws-px-2 ws-py-1 ws-text-xs`;
export const COLLAPSIBLE_TOGGLE = 'collapse-toggle-button';
export const LANGUAGE_LABEL =
  'language-label ws-cursor-pointer ws-bg-gray-200 ws-text-gray-700 ws-rounded ws-px-2 ws-py-1 ws-text-xs';
export const LABLELED_CONTENT =
  'turn-container ws-border-1 ws-px-5   ws-border ws-rounded ws-relative';
export const LANGUAGE_MENU_CONTAINER =
  'language-selector-container ws-absolute ws-right-0 ws-top-0 ws-bg-blue-500 ws-font-bold ws-text-white ws-text-center ws-py-1 ws-px-2 ws-text-xs ws-rounded';
export const CONVERSATION_BUTTON_LABEL_CONTENT = COLLAPSIBLE_TOGGLE;
export const TURN_CONTAINER = TEXT_BASE + TEXT_BASE_CHILD;
export const USER_TURN_CONTAINER = TEXT_BASE + HAS_USER_PSUEUDO;
export const AGENT_TURN_CONTAINER = TEXT_BASE + HAS_ASSISTANT_PSUEUDO;
export const MARKED_DATA_ATTR = '[data-marked]';
export const dataAttributeSelector = (attribute: string) => `[${attribute}]`;

// Keep existing constant imports...

const AssignDom: React.FC = () => {
  const processedElementsRef = useRef<Set<string>>(new Set());
  const initializedContainersRef = useRef<Set<string>>(new Set());
  const currentIndexRef = useRef<number>(0);
  const isNewChatRef = useRef<boolean>(false);
  const pendingTurnsRef = useRef<Element[]>([]);

  const markConversationTurnEditable = useCallback(
    (element: Element, index: number) => {
      if (element?.hasAttribute(MARKED_DATA)) return;
      addLabels(element, index);
      document
        .querySelectorAll(CHATGPT_ARIA_LABEL)
        .forEach((button) => button.classList.add(CONV_EDIT));

      const textArea =
        element.querySelector(CHATGPT_PROMPT_TEXAREA_ID) ??
        element.querySelector(PROSEMIRROR);

      if (textArea) textArea.classList.add(CHATGPT_PROMPT);

      if (!element.classList.contains(WORDSMITH_EDITABLE_CONVERSATION)) {
        element.classList.add(WORDSMITH_EDITABLE_CONVERSATION);
        const editButton = element.querySelector(
          `[${CONV_EDIT_BUTTON_ARIA_LABEL}]`,
        );

        if (editButton && !editButton.classList.contains(CONV_EDIT)) {
          editButton.classList.add(CONV_EDIT);
        }
      }
      element.setAttribute(MARKED_DATA, 'true');
    },
    [],
  );

  const addLabels = useCallback((element: Element, index: number) => {
    if (!element) return;
    const parentElement = element.closest(TEXT_BASE_CHILD) || element;
    parentElement.classList.add('ws-relative');
    const roleElement =
      parentElement.querySelector<HTMLDivElement>(ROLE_CONTAINER) ??
      parentElement.querySelector(TURN_PARENT);
    const hasRole =
      roleElement && roleElement.getAttribute('data-message-author-role');
    if (!roleElement || !hasRole) return;

    const role = roleElement.getAttribute('data-message-author-role') ?? 'user';

    const levelIndex = Math.floor(index / 2) + 1;
    const conversationLabel = document.createElement('button');
    const roleBgColor = role === 'user' ? USER_BG_COLOR : AGENT_BG_COLOR;
    const displayRole = role === 'user' ? 'user' : 'chatgpt';

    conversationLabel.className =
      `${displayRole}-level-${levelIndex} level-${levelIndex} ${roleBgColor} ` +
      CONVERSATION_LEVEL_LABEL;

    const labelWrapper = document.createElement('span');
    labelWrapper.classList.add('ws-flex', 'ws-items-center');

    labelWrapper.appendChild(
      document.createTextNode(`${displayRole}-level-${levelIndex}`),
    );

    conversationLabel.textContent = '';
    conversationLabel.appendChild(labelWrapper);

    if (!parentElement.classList.contains('labeled')) {
      parentElement.prepend(conversationLabel);
      parentElement.className =
        parentElement.className +
        LABLELED_CONTENT +
        ` labeled ${role === 'user' ? USER_BORDER_COLOR : AGENT_BORDER_COLOR}`;
    }
  }, []);

  const nodeHandler = useCallback(
    (element: Element, index?: number) => {
      addLabels(element, index ?? 0);

      markConversationTurnEditable(element, index ?? 0);
    },
    [addLabels, markConversationTurnEditable],
  );

  const processPendingTurns = useCallback(() => {
    console.log('Processing pending turns:', pendingTurnsRef.current.length);

    const turns = [...pendingTurnsRef.current];
    pendingTurnsRef.current = []; // Clear pending turns

    // Sort and process turns
    turns.sort((a, b) => {
      const position = a.compareDocumentPosition(b);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    currentIndexRef.current = 0; // Reset index for new chat
    turns.forEach((turn) => nodeHandler(turn));

    isNewChatRef.current = false;
  }, [nodeHandler]);

  const checkIfNewChat = useCallback(() => {
    return window.location.href.includes('chatgpt.com/?model=');
  }, []);

  const handleMutations = useCallback(
    (mutations: MutationRecord[]) => {
      // Check for new chat condition
      if (checkIfNewChat() && !isNewChatRef.current) {
        isNewChatRef.current = true;
        pendingTurnsRef.current = [];
        console.log('New chat detected - will queue turns');
      }

      mutations.forEach((mutation) => {
        // Check for completion signal
        if (
          isNewChatRef.current &&
          mutation.type === 'childList' &&
          mutation.target instanceof Element &&
          mutation.target.matches('.sr-only') &&
          mutation.removedNodes.length === 1 &&
          mutation.addedNodes.length === 0
        ) {
          console.log('Chat completion detected - processing turns');
          processPendingTurns();
          return;
        }

        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach((node) => {
            if (node instanceof Element) {
              const id =
                node.getAttribute('data-message-id') ||
                node
                  .querySelector(ROLE_CONTAINER)
                  ?.getAttribute('data-message-id');
              if (id) {
                initializedContainersRef.current.delete(id);
                processedElementsRef.current.delete(id);
              }
            }
          });

          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;

              // Find conversation turns
              const turns = element.matches(GROUPED_TURN_CONTAINER)
                ? [element]
                : Array.from(element.querySelectorAll(GROUPED_TURN_CONTAINER));

              if (isNewChatRef.current) {
                // Queue turns for later processing
                pendingTurnsRef.current.push(...turns);
                console.log('Queued turns:', turns.length);
              } else {
                // Process turns immediately for existing chats
                turns.forEach((turn) => nodeHandler(turn));
              }
            }
          });
        }
      });
    },
    [checkIfNewChat, processPendingTurns, nodeHandler],
  );

  // Modify initialization effect
  useEffect(() => {
    const observer = new MutationObserver(handleMutations);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    // Check if we're starting with a new chat
    isNewChatRef.current = checkIfNewChat();

    if (!isNewChatRef.current) {
      // Process existing elements only for existing chats
      currentIndexRef.current = 0;
      const existingTurns = Array.from(
        document.querySelectorAll(GROUPED_TURN_CONTAINER),
      );

      existingTurns.sort((a, b) => {
        const position = a.compareDocumentPosition(b);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

      existingTurns.forEach((element) => nodeHandler(element));
    }

    return () => {
      observer.disconnect();
      processedElementsRef.current.clear();
      initializedContainersRef.current.clear();
      currentIndexRef.current = 0;
      pendingTurnsRef.current = [];
      isNewChatRef.current = false;
    };
  }, [handleMutations, nodeHandler, checkIfNewChat]);

  return null;
};

export default React.memo(AssignDom);
