import { useSettings } from '../../context/SettingsContext';

export const BaseStyleSheet = () => {
  const { settings } = useSettings();
  return (
    <style>
      {`
          @keyframes flash {
            0% { background-color: yellow; }
            100% { background-color: transparent; }
          }

          /* Highlight class to apply flash effect */
          .highlight-flash {
            animation: flash 1.5s ease-in-out;
          }

          ${
            settings.conversation?.widthFull
              ? `
            [slot="content"] ol li {
               max-width: 100%;
               min-width: 100%;
             }
            [slot="trailing"] > div{
                max-width: 97%;
                min-width: 97%;
              }
              .mx-auto {
                 max-width: 100%;
                 min-width: 100%;
               }
             `
              : ''
          }
          ${
            settings.conversation?.widthCustom
              ? `
            [slot="content"] ol li {
             max-width: ${settings.conversation?.widthCustom}px;
             min-width: ${settings.conversation?.widthCustom}px
             }`
              : ''
          }
          @font-face {
            font-family: 'codicon';
            font-display: block;
            src: url('chrome-extension://doapedobaljpnnhdgelealmofflmgepl/public/fonts/codicon.ttf') format('truetype');
          }
      `}
    </style>
  );
};
