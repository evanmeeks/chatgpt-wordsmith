import React, { useRef, useCallback, useEffect } from 'react';
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
  'turn-container ws-border-1 ws-px-5 ws-py-[40px] ws-border ws-rounded ws-relative';
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

  const markConversationTurnEditable = useCallback(
    (element: Element, index: number) => {
      // Skip if already processed
      if (element?.hasAttribute(MARKED_DATA)) return;

      // Get unique identifier for element
      const messageId = element
        .querySelector(ROLE_CONTAINER)
        ?.getAttribute('data-message-id');
      if (messageId && processedElementsRef.current.has(messageId)) return;

      // Process edit buttons
      const editButtons = document.querySelectorAll(CHATGPT_ARIA_LABEL);
      editButtons.forEach((button) => {
        if (!button.classList.contains(CONV_EDIT)) {
          button.classList.add(CONV_EDIT);
        }
      });

      // Handle text areas
      const textAreas = [
        element.querySelector(CHATGPT_PROMPT_TEXAREA_ID),
        element.querySelector(PROSEMIRROR),
      ].filter((el): el is HTMLElement => el !== null);

      textAreas.forEach((textArea) => {
        if (!textArea.classList.contains(CHATGPT_PROMPT)) {
          textArea.classList.add(CHATGPT_PROMPT);
        }
      });

      // Mark as editable
      if (!element.classList.contains(WORDSMITH_EDITABLE_CONVERSATION)) {
        element.classList.add(WORDSMITH_EDITABLE_CONVERSATION);

        const editButton = element.querySelector<HTMLElement>(
          `[${CONV_EDIT_BUTTON_ARIA_LABEL}]`,
        );

        if (editButton && !editButton.classList.contains(CONV_EDIT)) {
          editButton.classList.add(CONV_EDIT);
        }
      }

      // Mark as processed
      element.setAttribute(MARKED_DATA, 'true');
      if (messageId) {
        processedElementsRef.current.add(messageId);
      }
    },
    [],
  );

  const addLabels = useCallback((element: Element, index: number) => {
    if (!element) return;

    // Add relative positioning if needed
    if (!element.classList.contains('ws-relative')) {
      element.classList.add('ws-relative');
    }

    // Find role element with more specific targeting
    const roleElement =
      element.querySelector<HTMLElement>(ROLE_CONTAINER) ||
      element.closest(ROLE_CONTAINER) ||
      element.querySelector(TURN_PARENT);

    const role = roleElement?.getAttribute('data-message-author-role');
    if (!roleElement || !role) return;

    // Skip if already labeled
    if (element.classList.contains('labeled')) return;

    // Calculate level index
    const levelIndex = Math.floor(index / 2) + 1;

    // Create label elements
    const conversationLabel = document.createElement('button');
    const roleBgColor = role === 'user' ? USER_BG_COLOR : AGENT_BG_COLOR;
    const roleBorderColor =
      role === 'user' ? USER_BORDER_COLOR : AGENT_BORDER_COLOR;
    const displayRole = role === 'user' ? 'user' : 'chatgpt';

    // Set up label classes
    conversationLabel.className = [
      `${displayRole}-level-${levelIndex}`,
      `level-${levelIndex}`,
      roleBgColor,
      CONVERSATION_LEVEL_LABEL,
    ].join(' ');

    // Create and set up wrapper
    const labelWrapper = document.createElement('span');
    labelWrapper.classList.add('ws-flex', 'ws-items-center');
    labelWrapper.textContent = `${displayRole}-level-${levelIndex}`;
    conversationLabel.appendChild(labelWrapper);

    // Add label and styling to element
    element.prepend(conversationLabel);
    element.className = [
      element.className,
      LABLELED_CONTENT,
      'labeled',
      roleBorderColor,
    ].join(' ');

    // Update z-index for proper stacking
    const existingStyle = element.getAttribute('style') || '';
    element.setAttribute(
      'style',
      `${existingStyle}; position: relative; z-index: ${100 - levelIndex}`,
    );
  }, []);

  const nodeHandler = useCallback(
    (element: Element, index?: number) => {
      const actualIndex = index ?? 0;

      // Handle both direct matches and nested elements
      if (element.matches(GROUPED_TURN_CONTAINER)) {
        addLabels(element, actualIndex);
        markConversationTurnEditable(element, actualIndex);
      } else {
        // Process nested turns
        element
          .querySelectorAll(GROUPED_TURN_CONTAINER)
          .forEach((nestedElement, nestedIndex) => {
            addLabels(nestedElement, actualIndex + nestedIndex);
            markConversationTurnEditable(
              nestedElement,
              actualIndex + nestedIndex,
            );
          });
      }
    },
    [addLabels, markConversationTurnEditable],
  );

  const handleMutations = useCallback(
    (mutations: MutationRecord[]) => {
      const processedNodes = new Set<Node>();

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            // Skip if already processed
            if (processedNodes.has(node)) return;
            processedNodes.add(node);

            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;

              // Check if it's a conversation turn
              if (element.matches(GROUPED_TURN_CONTAINER)) {
                nodeHandler(element);
              } else {
                // Process any nested conversation turns
                const turns = element.querySelectorAll(GROUPED_TURN_CONTAINER);
                turns.forEach((turn, index) => {
                  if (!processedNodes.has(turn)) {
                    processedNodes.add(turn);
                    nodeHandler(turn, index);
                  }
                });
              }
            }
          });
        }
      });
    },
    [nodeHandler],
  );

  useEffect(() => {
    // Set up mutation observer
    const observer = new MutationObserver(handleMutations);

    // Configure observation options
    const observerOptions: MutationObserverInit = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-message-author-role'],
    };

    // Start observing
    observer.observe(document.body, observerOptions);

    // Initial processing of existing elements
    const existingElements = document.querySelectorAll(GROUPED_TURN_CONTAINER);
    existingElements.forEach((element, index) => {
      nodeHandler(element, index);
    });

    // Cleanup
    return () => {
      observer.disconnect();
      processedElementsRef.current.clear();
    };
  }, [handleMutations, nodeHandler]);

  return null;
};

export default React.memo(AssignDom);
