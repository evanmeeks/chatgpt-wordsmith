import { AppState } from './types';

export const SET_PLATFORM = 'SET_PLATFORM';
export const FILTER_MESSAGES = 'FILTER_MESSAGES';
export const FETCH_CONVERSATION_REQUEST = 'FETCH_CONVERSATION_REQUEST';
export const FETCH_CONVERSATION_SUCCESS = 'FETCH_CONVERSATION_SUCCESS';
export const FETCH_CONVERSATION_FAILURE = 'FETCH_CONVERSATION_FAILURE';
export const SET_CONVERSATION = 'SET_CONVERSATION';
export const SET_URL = 'SET_URL';
export const SET_CONVERSATION_ID = 'SET_CONVERSATION_ID';
export const SET_ACTIVE_MESSAGE_IDS = 'SET_ACTIVE_MESSAGE_IDS';
export const SET_CLAUDE_ORGANIZATION_ID = 'SET_CLAUDE_ORGANIZATION_ID';
export const SET_ASSISTANT_DATA_ATTR_SELECTOR_ID =
  'SET_ASSISTANT_DATA_ATTR_SELECTOR_ID';
export const UPDATE_STATE = 'UPDATE_STATE';
export const GET_CURRENT_TAB_INFO = 'GET_CURRENT_TAB_INFO';
export const CONTENT_URL_CHANGED = 'CONTENT_URL_CHANGED';
export const GET_STATE = 'GET_STATE';

export type Action =
  | { type: typeof SET_PLATFORM; payload: AppState['platform'] }
  | { type: typeof SET_URL; payload: AppState['url'] }
  | { type: typeof SET_CONVERSATION_ID; payload: AppState['conversationId'] }
  | {
      type: typeof SET_ACTIVE_MESSAGE_IDS;
      payload: AppState['lastActiveMessageId'];
    }
  | {
      type: typeof SET_CLAUDE_ORGANIZATION_ID;
      payload: AppState['claudeOrganizationId'];
    }
  | {
      type: typeof SET_ASSISTANT_DATA_ATTR_SELECTOR_ID;
      payload: AppState['chatgptConversationId'];
    }
  | { type: typeof UPDATE_STATE; payload: Partial<AppState> }
  | { type: typeof CONTENT_URL_CHANGED; payload: Partial<AppState> }
  | { type: typeof GET_CURRENT_TAB_INFO }
  | { type: typeof GET_STATE };

export const filterMessages = (filter: Partial<AppState>) => ({
  type: FILTER_MESSAGES,
  payload: filter,
});

export const contentUrlChanged = (
  dispatch: React.Dispatch<Action>,
  newState: Partial<AppState>,
) => {
  dispatch({ type: CONTENT_URL_CHANGED, payload: newState });
};

export const getState = (dispatch: React.Dispatch<Action>) => {
  chrome.runtime.sendMessage({ type: GET_STATE }, (response: AppState) => {
    dispatch({ type: UPDATE_STATE, payload: response });
  });
};

export const updateState = (
  dispatch: React.Dispatch<Action>,
  newState: Partial<AppState>,
) => {
  dispatch({ type: UPDATE_STATE, payload: newState });
};

export const updateStateAndStorage = (
  dispatch: React.Dispatch<Action>,
  newState: Partial<AppState>,
) => {
  updateState(dispatch, newState);
  chrome.storage.local.set(newState);
};

export const getCurrentTabInfo = (dispatch: React.Dispatch<Action>) => {
  chrome.runtime.sendMessage(
    { type: GET_CURRENT_TAB_INFO },
    (response: Partial<AppState>) => {
      if (response) {
        updateState(dispatch, response);
      }
    },
  );
};

export const setupMessageListener = (dispatch: React.Dispatch<Action>) => {
  const messageListener = (message: any) => {
    switch (message.type) {
      case UPDATE_STATE:
        updateState(dispatch, message.payload);
        break;
      case CONTENT_URL_CHANGED:
        contentUrlChanged(dispatch, message.payload);
        break;
      case GET_STATE:
        getState(dispatch);
        break;
    }
  };

  chrome.runtime.onMessage.addListener(messageListener);

  return () => {
    chrome.runtime.onMessage.removeListener(messageListener);
  };
};
