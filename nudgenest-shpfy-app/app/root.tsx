import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export default function App() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body {
              margin: 0;
              padding: 0;
              background: #f6f6f7;
            }
            body {
              visibility: hidden;
            }
            body.polaris-loaded {
              visibility: visible;
            }
          `
        }} />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Wait for Polaris styles to load
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                  document.body.classList.add('polaris-loaded');
                });
              } else {
                document.body.classList.add('polaris-loaded');
              }
            })();
          `
        }} />
      </body>
    </html>
  );
}
