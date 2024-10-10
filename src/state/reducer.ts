import { AppState } from './types';
import * as actions from './actions';
import { initialState } from './context';

export const reducer = (
  state: AppState = initialState,
  action: actions.Action,
): AppState => {
  switch (action.type) {
    case actions.SET_URL:
      return { ...state, url: action.payload };
    case actions.SET_CONVERSATION_ID:
      return { ...state, conversationId: action.payload };
    case actions.SET_ACTIVE_MESSAGE_IDS:
      return { ...state, lastActiveMessageId: action.payload };
    case actions.SET_CLAUDE_ORGANIZATION_ID:
      return { ...state, claudeOrganizationId: action.payload };
    case actions.SET_ASSISTANT_DATA_ATTR_SELECTOR_ID:
      return { ...state, chatgptConversationId: action.payload };
    case actions.UPDATE_STATE:
    case actions.CONTENT_URL_CHANGED:
      return { ...state, ...action.payload };
    case actions.GET_STATE:
      return state; // The actual update will happen when the response is received
    default:
      return state;
  }
};
