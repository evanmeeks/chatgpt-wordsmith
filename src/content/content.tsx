import * as monaco from 'monaco-editor';
monaco.languages.typescript.javascriptDefaults.setModeConfiguration({
  diagnostics: false,
});
monaco.languages.json.jsonDefaults.setModeConfiguration({
  diagnostics: false,
});
monaco.languages.typescript.typescriptDefaults.setModeConfiguration({
  diagnostics: false,
});
monaco.languages.html.htmlDefaults.setModeConfiguration({
  diagnostics: false,
});

function setupFontLoading(
  fontResources: { family: string; path: string; format: string }[],
) {
  const preconnectLink = document.createElement('link');
  preconnectLink.rel = 'preconnect';
  preconnectLink.href = 'https://fonts.gstatic.com';
  document.head.appendChild(preconnectLink);

  const style = document.createElement('style');
  let fontFaceDeclarations = fontResources
    .map(
      (font) => `
    @font-face {
      font-family: '${font.family}';
      src: url('${chrome.runtime.getURL(font.path)}') format('${font.format}');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
  `,
    )
    .join('\n');

  style.textContent = fontFaceDeclarations;
  document.head.appendChild(style);
}

const fontsToLoad = [
  { family: 'Codicon', path: 'fonts/codicon.ttf', format: 'truetype' },
  { family: 'Seti', path: 'fonts/seti.woff', format: 'woff' },
];

setupFontLoading(fontsToLoad);

async function appendCustomStyles(path: string) {
  const response = await fetch(chrome.runtime.getURL(path));
  const cssContent = await response.text();

  const styleElement = document.createElement('style');
  styleElement.media = 'screen';
  styleElement.className = 'contributedColorTheme';
  styleElement.textContent = cssContent;

  document.head.appendChild(styleElement);
}

appendCustomStyles('css/vs-code.css');

// Listen for URL changes
