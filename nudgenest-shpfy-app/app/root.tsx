import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

export const loader = async (_: LoaderFunctionArgs) => {
  return json({
    ENV: {
      SENTRY_SHOPIFY_DSN: process.env.SENTRY_SHOPIFY_DSN || "",
      NODE_ENV: process.env.NODE_ENV || "development",
      COMMIT_SHA: process.env.COMMIT_SHA || "",
    },
  });
};

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();

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
          `
        }} />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
