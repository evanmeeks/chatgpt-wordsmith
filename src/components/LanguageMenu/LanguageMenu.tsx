import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  TURN_PARENT,
  GROUPED_TURN_CONTAINER,
  ROLE_CONTAINER,
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
      const container = document.createElement('div');
      container.className = LANGUAGE_MENU_CONTAINER;

      // Find the group container for the turn
      const groupContainer = turnElement.closest(GROUPED_TURN_CONTAINER);
      if (!groupContainer) return container;

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

    const handleMutations = useCallback(
      (mutations: MutationRecord[]) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const elementNode = node as Element;

                // Check for turn parent or group container
                if (
                  elementNode.matches(TURN_PARENT) ||
                  elementNode.matches(GROUPED_TURN_CONTAINER)
                ) {
                  attachLanguageSelector(elementNode);
                } else {
                  // Search for nested turn elements
                  elementNode
                    .querySelectorAll(
                      `${TURN_PARENT}, ${GROUPED_TURN_CONTAINER}`,
                    )
                    .forEach(attachLanguageSelector);
                }
              }
            });
          }
        });
      },
      [attachLanguageSelector],
    );

    useEffect(() => {
      observerRef.current = new MutationObserver(handleMutations);
      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Initial scan for existing elements
      document
        .querySelectorAll(`${TURN_PARENT}, ${GROUPED_TURN_CONTAINER}`)
        .forEach(attachLanguageSelector);

      return () => {
        observerRef.current?.disconnect();
        timerRef.current && clearInterval(timerRef.current);
      };
    }, [handleMutations, attachLanguageSelector]);

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
