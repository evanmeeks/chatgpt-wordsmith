import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState } from './types';
import { reducer } from './reducer';
import {
  Action,
  updateState,
  setupMessageListener,
  getCurrentTabInfo,
} from './actions';

export const initialState: AppState = {
  platform: null,
  loading: false,
  url: null,
  conversationId: null,
  lastActiveMessageId: [],
  claudeOrganizationId: null,
  chatgptConversationId: null,
  routeKey: Date.now(),
  wordsmithEdit: true,
};

const StateContext = createContext<
  | {
      state: AppState;
      dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    chrome.storage.local.get(
      [
        'loading',
        'currentPlatform',
        'currentUrl',
        'claudeOrganizationId',
        'chatgptConversationId',
        'conversation',
        'conversationId',
        'lastActiveMessageId',
      ],
      (result) => {
        updateState(dispatch, {
          loading: result.loading || false,
          platform: result.currentPlatform || null,
          url: result.currentUrl || null,
          claudeOrganizationId: result.claudeOrganizationId || null,
          chatgptConversationId: result.chatgptConversationId || null,
          conversationId: result.conversationId || null,
          lastActiveMessageId: result.lastActiveMessageId || [],
        });
      },
    );
    getCurrentTabInfo(dispatch);
    const cleanup = setupMessageListener(dispatch);

    return cleanup;
  }, []);

  return React.createElement(
    StateContext.Provider,
    { value: { state, dispatch } },
    children,
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within a StateProvider');
  }
  return context;
};
