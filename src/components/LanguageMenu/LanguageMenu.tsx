import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  TURN_PARENT,
  GROUPED_TURN_CONTAINER,
  ROLE_CONTAINER,
  HAS_USER_PSUEUDO,
  USER_DATA_ATTR,
  CONV_EDIT_BUTTON_ARIA_LABEL,
  LANGUAGE_MENU_CONTAINER,
  CONVERSATION_LEVEL_LABEL,
} from '../../content/AssignDom';
import { useSettings, SettingsProvider } from '../../context/SettingsContext';
import LanguageSelector from './LanguageSelector';

interface LanguageMenuProps {
  handleDefaultEdit: () => void;
  handleWordsmithEdit: () => void;
}

const LanguageMenu: React.FC<LanguageMenuProps> = React.memo(
  ({ handleDefaultEdit, handleWordsmithEdit }) => {
    const observerRef = useRef<MutationObserver>();
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [renderedElements, setRenderedElements] = useState<Set<string>>(
      new Set(),
    );
    const { settings, updateSettings } = useSettings();
    const attachedSelectorsRef = useRef<Set<string>>(new Set());
    const isNewChatRef = useRef<boolean>(false);
    const pendingTurnsRef = useRef<Element[]>([]);

    const checkIfNewChat = useCallback(() => {
      return window.location.href.includes('chatgpt.com/?model=');
    }, []);

    const handleEditClick = useCallback(
      (turnElement: Element): void => {
        handleWordsmithEdit();
        const editButton = turnElement.querySelector<HTMLButtonElement>(
          `[${CONV_EDIT_BUTTON_ARIA_LABEL}]`,
        );
        if (editButton) {
          editButton.click();
        }
      },
      [handleWordsmithEdit],
    );

    const attachButtonListener = useCallback(
      (turnElement: Element | null) => {
        if (!turnElement) return;

        const editButton = turnElement.querySelector<HTMLButtonElement>(
          `[${CONV_EDIT_BUTTON_ARIA_LABEL}]`,
        );
        if (editButton) {
          editButton.addEventListener('mouseup', handleDefaultEdit);
        }
      },
      [handleDefaultEdit],
    );

    const createContainer = useCallback((turnElement: Element) => {
      // Find the group container for the turn
      const groupContainer = turnElement.closest(GROUPED_TURN_CONTAINER);
      if (!groupContainer) return null;

      // Check if this is a user turn by checking for the user pseudo-class
      if (!groupContainer.matches(HAS_USER_PSUEUDO)) return null;

      const container = document.createElement('div');
      container.className = LANGUAGE_MENU_CONTAINER;

      // Check if level label exists and insert before it
      const levelLabel = groupContainer.querySelector('.level-label');
      if (levelLabel) {
        levelLabel.insertAdjacentElement('beforebegin', container);
      } else {
        // Create level label if it doesn't exist
        const label = document.createElement('div');
        label.className = CONVERSATION_LEVEL_LABEL;
        groupContainer.insertBefore(label, groupContainer.firstChild);
        label.insertAdjacentElement('beforebegin', container);
      }

      return container;
    }, []);

    const renderLanguageSelector = useCallback(
      (
        container: HTMLElement,
        turnElement: Element,
        conversationMessageId: string,
      ) => {
        const content = (
          <SettingsProvider>
            <LanguageSelector
              handleEditClick={handleEditClick}
              key={`language-selector-${conversationMessageId}`}
              isInConversation={true}
              turnElement={turnElement}
              conversationMessageId={conversationMessageId}
            />
          </SettingsProvider>
        );

        const root = createRoot(container);
        root.render(content);
        attachedSelectorsRef.current.add(conversationMessageId);
        turnElement.classList.add('language-selector-processed');
        setRenderedElements((prev) => new Set(prev).add(conversationMessageId));
      },
      [handleEditClick],
    );

    const attachLanguageSelector = useCallback(
      (turnElement: Element | null) => {
        if (!turnElement) return;

        // Find the group container
        const groupContainer = turnElement.closest(GROUPED_TURN_CONTAINER);
        if (!groupContainer) return;

        // Check if selector already exists
        if (groupContainer.querySelector('.language-selector-container'))
          return;

        // Get message ID from the role container
        const roleContainer = groupContainer.querySelector(ROLE_CONTAINER);
        if (!roleContainer) return;

        const messageId = roleContainer.getAttribute('data-message-id');
        if (!messageId || attachedSelectorsRef.current.has(messageId)) return;

        const container = createContainer(turnElement);
        if (container) {
          renderLanguageSelector(container, turnElement, messageId);
          attachButtonListener(turnElement);
        }
      },
      [createContainer, renderLanguageSelector, attachButtonListener],
    );

    const processPendingTurns = useCallback(() => {
      console.log(
        'Processing pending turns for language menu:',
        pendingTurnsRef.current.length,
      );

      const turns = Array.from(
        document.querySelectorAll(GROUPED_TURN_CONTAINER),
      );

      pendingTurnsRef.current = []; // Clear pending turns

      // Sort and process turns
      turns.sort((a, b) => {
        const position = a.compareDocumentPosition(b);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

      turns.forEach((turn) => attachLanguageSelector(turn));
      isNewChatRef.current = false;
    }, [attachLanguageSelector]);

    const handleMutations = useCallback(
      (mutations: MutationRecord[]) => {
        // Check for new chat condition
        if (checkIfNewChat() && !isNewChatRef.current) {
          isNewChatRef.current = true;
          pendingTurnsRef.current = [];
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
            console.log(
              'Chat completion detected in LanguageMenu - processing turns',
            );
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
                  attachedSelectorsRef.current.delete(id);
                  setRenderedElements((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                  });
                }
              }
            });

            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;

                // Find conversation turns
                const turns = element.matches(GROUPED_TURN_CONTAINER)
                  ? [element]
                  : Array.from(
                      element.querySelectorAll(GROUPED_TURN_CONTAINER),
                    );

                if (isNewChatRef.current) {
                  // Queue turns for later processing
                  pendingTurnsRef.current.push(...turns);
                  console.log('Queued turns for language menu:', turns.length);
                } else {
                  // Process turns immediately for existing chats
                  turns.forEach((turn) => attachLanguageSelector(turn));
                }
              }
            });
          }
        });
      },
      [checkIfNewChat, processPendingTurns, attachLanguageSelector],
    );

    useEffect(() => {
      // Check if we're starting with a new chat
      isNewChatRef.current = checkIfNewChat();

      observerRef.current = new MutationObserver(handleMutations);
      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
      });

      if (!isNewChatRef.current) {
        // Process existing elements only for existing chats
        const existingTurns = Array.from(
          document.querySelectorAll(GROUPED_TURN_CONTAINER),
        );

        existingTurns.sort((a, b) => {
          const position = a.compareDocumentPosition(b);
          return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });

        existingTurns.forEach((turn) => attachLanguageSelector(turn));
      }

      return () => {
        observerRef.current?.disconnect();
        timerRef.current && clearInterval(timerRef.current);
        pendingTurnsRef.current = [];
        isNewChatRef.current = false;
      };
    }, [handleMutations, attachLanguageSelector, checkIfNewChat]);

    // Handle settings changes
    useEffect(() => {
      renderedElements.forEach((messageId) => {
        const element = document.querySelector(
          `[data-message-id="${messageId}"]`,
        );
        if (element) {
          const turnElement =
            element.closest(GROUPED_TURN_CONTAINER) ||
            element.closest(TURN_PARENT);
          if (turnElement) {
            attachLanguageSelector(turnElement);
          }
        }
      });
    }, [settings.promptEditor, attachLanguageSelector, renderedElements]);

    return null;
  },
);

export default LanguageMenu;
