/**
 * Internal readers for the browser environment (cookie and page origin), with
 * a test override. Not re-exported by `mod.ts`.
 *
 * @module
 */

let override: { cookie?: string; origin?: string } | null = null;

function readDocumentCookie(): string | undefined {
  try {
    return (globalThis as { document?: { cookie?: string } }).document
      ?.cookie;
  } catch {
    return undefined;
  }
}

/**
 * Reads a cookie by exact name from `document.cookie`.
 *
 * @param name The cookie name
 *
 * @returns The decoded value, or `undefined` when absent, empty, or not in a browser
 */
export function readCookie(name: string): string | undefined {
  const cookie = override ? override.cookie : readDocumentCookie();
  if (!cookie) return undefined;

  for (const part of cookie.split(";")) {
    const pair = part.trim();
    if (!pair.startsWith(`${name}=`)) continue;
    const raw = pair.slice(name.length + 1);
    if (!raw) return undefined;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

/**
 * Gets the origin of the page the SDK is running in.
 *
 * @returns `location.origin`, or `undefined` when there is none (Deno throws without `--location`)
 */
export function getPageOrigin(): string | undefined {
  if (override) return override.origin;
  try {
    return globalThis.location?.origin;
  } catch {
    return undefined;
  }
}

/**
 * Overrides the cookie and page-origin readers for tests.
 *
 * @param env The values to report, or `null` to restore the real readers
 */
export function setEnvironmentForTests(
  env: { cookie?: string; origin?: string } | null,
): void {
  override = env;
}
