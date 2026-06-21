import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>CHIP SOCIETY</title>

        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/*
          CRITICAL — These @font-face rules map the expo-font family names
          (Orbitron_400Regular / _700Bold / _900Black) to the real Orbitron
          font from Google Fonts CDN. React Native Web passes fontFamily
          directly to CSS, so the name must match exactly what StyleSheets use.

          The woff2 URL was confirmed by fetching the Google Fonts CSS API
          with a Chrome UA: https://fonts.gstatic.com/s/orbitron/v35/...
        */}
        <style dangerouslySetInnerHTML={{ __html: `
          @font-face {
            font-family: 'Orbitron_400Regular';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url(https://fonts.gstatic.com/s/orbitron/v35/yMJRMIlzdpvBhQQL_Qq7dy0.woff2) format('woff2');
          }
          @font-face {
            font-family: 'Orbitron_700Bold';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: url(https://fonts.gstatic.com/s/orbitron/v35/yMJRMIlzdpvBhQQL_Qq7dy0.woff2) format('woff2');
          }
          @font-face {
            font-family: 'Orbitron_900Black';
            font-style: normal;
            font-weight: 900;
            font-display: swap;
            src: url(https://fonts.gstatic.com/s/orbitron/v35/yMJRMIlzdpvBhQQL_Qq7dy0.woff2) format('woff2');
          }

          /* Dark background while the JS bundle boots — prevents white flash */
          html, body, #root { background-color: #050010; }
        ` }} />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
