import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  USER_TURN_CONTAINER,
  USER_DATA_ATTR,
  CONV_EDIT_BUTTON_ARIA_LABEL,
  LANGUAGE_MENU_CONTAINER,
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
          CONV_EDIT_BUTTON_ARIA_LABEL,
        );
        if (editButton) {
          editButton.click();
        }
      },
      [handleWordsmithEdit],
    );

    const attachButtonListener = useCallback(
      (turnElement: Element | null) => {
        const editButton = turnElement!.querySelector<HTMLButtonElement>(
          `[${CONV_EDIT_BUTTON_ARIA_LABEL}]`,
        );
        if (editButton) {
          editButton.addEventListener('mouseup', handleDefaultEdit);
        }
      },
      [handleDefaultEdit],
    );

    const createContainer = (turnElement: Element) => {
      const container = document.createElement('div');
      container.className = LANGUAGE_MENU_CONTAINER;
      const conversationTurn = turnElement;
      if (conversationTurn) {
        const insertionPoint = conversationTurn.querySelector('.level-label');
        if (insertionPoint) {
          insertionPoint.insertAdjacentElement('beforebegin', container);
        } else {
          conversationTurn.insertAdjacentElement('beforebegin', container);
        }
      } else {
        (turnElement as HTMLElement).appendChild(container);
      }
      return container;
    };

    const renderLanguageSelector = (
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
    };

    const attachLanguageSelector = useCallback(
      (turnElement: Element | null) => {
        if (!turnElement) return;

        attachButtonListener(turnElement);
        let conversationMessageId: string = 'promptLanguage';

        if (turnElement.querySelector('.language-selector-container')) return;

        const userMessageElement = turnElement.querySelector(USER_DATA_ATTR);
        if (!userMessageElement) return;

        conversationMessageId = userMessageElement.getAttribute(
          'data-message-id',
        ) as string;
        if (!conversationMessageId) return;

        if (attachedSelectorsRef.current.has(conversationMessageId)) return;

        const container = createContainer(turnElement);
        renderLanguageSelector(container, turnElement, conversationMessageId);
      },
      [settings, updateSettings, handleEditClick, attachButtonListener],
    );

    const handleMutations = useCallback(
      (mutations: MutationRecord[]) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const elementNode = node as Element;

                if (elementNode.matches(USER_TURN_CONTAINER)) {
                  attachLanguageSelector(elementNode);
                } else {
                  elementNode
                    .querySelectorAll(USER_TURN_CONTAINER)
                    .forEach(attachLanguageSelector);
                }
              }
            });
          }
        });
      },
      [attachLanguageSelector, attachButtonListener],
    );

    useEffect(() => {
      observerRef.current = new MutationObserver(handleMutations);
      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [handleMutations, attachLanguageSelector]);

    useEffect(() => {
      renderedElements.forEach((messageId) => {
        const element = document.querySelector(
          `[data-message-id="${messageId}"]`,
        );
        if (element) {
          attachLanguageSelector(element.closest(USER_TURN_CONTAINER));
        }
      });
    }, [settings.promptEditor, attachLanguageSelector, renderedElements]);

    return null;
  },
);

export default LanguageMenu;
