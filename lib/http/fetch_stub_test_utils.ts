/**
 * Test-only helper that replaces `globalThis.fetch` with a recording stub.
 *
 * @module
 */

/** Builds a JSON `Response`. */
export function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Stubs `fetch`, recording every call. Rejects with the signal's reason when the
 * request's signal is aborted, before or after the responder runs.
 */
export function stubFetch(
  respond: (
    url: URL,
    init: RequestInit,
    call: number,
  ) => Response | Promise<Response> = () => jsonResponse({ data: null }),
): { calls: Array<{ url: URL; init: RequestInit }>; restore(): void } {
  const original = globalThis.fetch;
  const calls: Array<{ url: URL; init: RequestInit }> = [];

  globalThis.fetch = async (
    input: URL | RequestInfo,
    init: RequestInit = {},
  ): Promise<Response> => {
    const url = input instanceof URL
      ? input
      : new URL(input instanceof Request ? input.url : input);
    const call = calls.length;
    calls.push({ url, init });

    if (init.signal?.aborted) throw init.signal.reason;
    const response = await respond(url, init, call);
    if (init.signal?.aborted) throw init.signal.reason;
    return response;
  };

  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}
