import * as monaco from 'monaco-editor';
export type EditorOptions = typeof monaco.editor.EditorOption;
export interface IEditorOptions extends monaco.editor.IEditorOptions {
  [key: string]: any;
  [key: number]: any;
  promptEditor?: string;
  codeEditor: {
    prompt: boolean;
    conversation: boolean;
  };
  conversation: {
    widthFull: boolean;
    widthCustom: string | undefined;
  };
  theme?: string;
  promptLanguage?: string;
  lineNumbersEnabled?: boolean;
}

export const CHATGPT_WS_FONT_FAMILY = `Menlo, Monaco, 'Courier New', monospace`;

export const DEFAULT_SETTINGS: IEditorOptions = {
  codeEditor: {
    prompt: true,
    conversation: true,
  },
  conversation: {
    widthFull: true,
    widthCustom: undefined,
  },
  codeLensFontFamily: "Menlo, Monaco, 'Courier New', monospace",
  codeLensFontSize: 14,
  fontSize: 14,
  fontFamily: CHATGPT_WS_FONT_FAMILY,
  lineNumbers: 'off',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  theme: 'chatGPTLight',
  promptEditor: 'plaintext',
};

export const CHATGPT_WS_EDIT_INIT_OPTIONS = monaco.editor.EditorOptions;
export const CHATGPT_WS_LANGUAGES = monaco.languages.getLanguages();
export const CHATGPT_DEFAULT_FONT_SIZE = 14;
export const CHATGPT_WS_EDIT_POPUP_DEFAULTS = [
  'theme',
  'contextmenu',
  'cursorStyle',
  'cursorBlinking',
  'cursorWidth',
  'fontSize',
  'fontFamily',
  'lineNumbers',
];

export const CHATGPT_WS_CONVERSATION_EDIT_DEFAULT_OPTIONS = {
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
};

export const CHATGPT_WS_PROMPT_EDIT_DEFAULT_OPTIONS = {
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,

  scrollbar: {
    vertical: 'visible',
    horizontalSliderSize: 4,
  },
};

export const chatGPTLight: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'foreground', foreground: '0d0d0d' },
    { token: 'background', background: 'f4f4f4' },
    { token: 'params', background: '0d0d0d' },
    { token: 'keyword', foreground: '007ACC' },
    { token: 'identifier', foreground: '001080' },
    { token: 'string', foreground: 'A31515' },
    { token: 'number', foreground: '09885A' },
    { token: 'comment', foreground: '008000', fontStyle: 'italic' },
    { token: 'delimiter', foreground: '000000' },
    { token: 'operator', foreground: '000000' },
  ],
  colors: {
    'editor.foreground': '#0d0d0d',
    'editor.background': '#f4f4f4',
    'editorCursor.foreground': '#000000',
    'editor.lineHighlightBackground': '#F3F3F3',
    'editorLineNumber.foreground': '#BBBBBB',
    'editor.selectionBackground': '#ADD6FF',
    'editor.inactiveSelectionBackground': '#E5EBF1',
    'editorIndentGuide.background': '#D3D3D3',
    'editorIndentGuide.activeBackground': '#A0A0A0',
  },
};

export const chatGPTDark: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'd4d4d4', background: '202123' },
    { token: 'comment', foreground: '6A9955' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'keyword', foreground: '569CD6' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'regexp', foreground: 'D16969' },
    { token: 'type', foreground: '4EC9B0' },
    { token: 'function', foreground: 'DCDCAA' },
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'variable.predefined', foreground: '4FC1FF' },
    { token: 'constant', foreground: '4FC1FF' },
    { token: 'class', foreground: '4EC9B0' },
    { token: 'interface', foreground: '4EC9B0' },
    { token: 'struct', foreground: '4EC9B0' },
    { token: 'enum', foreground: '4EC9B0' },
    { token: 'typeParameter', foreground: '4EC9B0' },
    { token: 'module', foreground: '569CD6' },
    { token: 'control', foreground: 'C586C0' },
    { token: 'meta', foreground: '9B9B9B' },
    { token: 'tag', foreground: '569CD6' },
    { token: 'tag.attribute', foreground: '9CDCFE' },
  ],
  colors: {
    'editor.background': '#202123',
    'editor.foreground': '#d4d4d4',
    'editor.lineHighlightBackground': '#2A2B32',
    'editorCursor.foreground': '#AEAFAD',
    'editorWhitespace.foreground': '#3B3B3B',
    'editorIndentGuide.background': '#404040',
    'editor.selectionBackground': '#264F78',
    'editor.inactiveSelectionBackground': '#3A3D41',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#C6C6C6',
    'dropdown.background': '#2A2B32',
    'dropdown.foreground': '#d4d4d4',
    'input.background': '#2A2B32',
    'input.foreground': '#d4d4d4',
    'input.border': '#3E3F4A',
    'quickInput.background': '#2A2B32',
    'quickInput.foreground': '#d4d4d4',
    'list.hoverBackground': '#2A2B32',
    'list.activeSelectionBackground': '#37383D',
    'list.inactiveSelectionBackground': '#37383D',
    'scrollbarSlider.background': '#4E4F58',
    'scrollbarSlider.hoverBackground': '#5A5B66',
    'scrollbarSlider.activeBackground': '#747580',
  },
};
monaco.editor.defineTheme('chatGPTDark', chatGPTDark);
monaco.editor.defineTheme('chatGPTLight', chatGPTLight);
