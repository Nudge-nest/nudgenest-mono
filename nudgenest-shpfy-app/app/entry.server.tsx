import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import {
  createReadableStreamFromReadable,
  type EntryContext,
} from "@remix-run/node";
import { isbot } from "isbot";
import { addDocumentResponseHeaders } from "./shopify.server";
import * as Sentry from "@sentry/remix";

Sentry.init({
    dsn: process.env.SENTRY_SHOPIFY_DSN,
    environment: process.env.NODE_ENV || "development",
    release: process.env.COMMIT_SHA || "unknown",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    autoInstrumentRemix: true,
    beforeSend(event, hint) {
        const err = hint.originalException;
        // billing.request() always throws Response(401) intentionally — never report it
        // authenticate.admin() throws Response(3xx) for auth redirects — skip those too
        if (err instanceof Response && err.status < 500) return null;
        return event;
    },
});

// Captures errors that bubble up through Remix's handleError pipeline
export const handleError = Sentry.sentryHandleError;

const ABORT_DELAY = 5000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? '')
    ? "onAllReady"
    : "onShellReady";

  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
