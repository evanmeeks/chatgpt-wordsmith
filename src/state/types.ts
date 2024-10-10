export interface AppState {
  platform: 'chatgpt' | 'claude' | null;
  url: string | null;
  loading: boolean;
  conversationId: string | null;
  lastActiveMessageId: string[];
  claudeOrganizationId: string | null;
  chatgptConversationId: string | null;
  wordsmithEdit: boolean;
  routeKey: number;
}
