import { defineManifest } from '@crxjs/vite-plugin';
import packageData from '../package.json';

const isDev = process.env.NODE_ENV == 'development';

export default defineManifest({
  name: `${packageData.displayName || packageData.name}${isDev ? ' - Dev' : ''}`,
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  icons: {
    16: 'img/icon16.png',
    32: 'img/icon32.png',
    48: 'img/icon48.png',
    128: 'img/icon128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'img/icon16.png',
      32: 'img/icon32.png',
      48: 'img/icon48.png',
      128: 'img/icon128.png',
    },
  },
  content_scripts: [
    {
      matches: ['https://chatgpt.com/*'],
      js: [
        'src/main.tsx',
        'src/content/content.tsx',
        'src/content/AssignDom.tsx',
      ],
      run_at: 'document_end',
    },
  ],
  web_accessible_resources: [
    {
      resources: [
        'css/vs-code.css',
        'img/loading-buffering.gif',
        'fonts/codicon.ttf',
        'fonts/seti.woff',
        'fonts/seti.ttf',
      ],
      matches: ['https://chatgpt.com/*'],
    },
  ],

  permissions: ['storage', 'activeTab', 'scripting', 'nativeMessaging'],
});
