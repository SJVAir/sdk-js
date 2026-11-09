import { origin } from "$http";

/**
 * Warms a local open-days endpoint before a test calls it through the SDK.
 *
 * On the local stack, Django debug toolbar's cache panel can't serialize the
 * cached open rows, so the first request for an owner set in a 60-second
 * window answers 500; a retry answers 200. Each page of a bulk endpoint is its
 * own owner set. Production has no toolbar, so the SDK must not work around
 * this: only the tests do, here.
 *
 * @param path The endpoint path under `/api/2.0/`, without a trailing slash
 * @param searchParams Search params to send with every page
 */
export async function warmOpenDays(
  path: string,
  searchParams: Record<string, string | Array<string>> = {},
): Promise<void> {
  const get = async (page: number) => {
    const url = new URL(`/api/2.0/${path}/`, origin);
    for (const [key, value] of Object.entries(searchParams)) {
      for (const v of [value].flat()) url.searchParams.append(key, v);
    }
    url.searchParams.set("page", String(page));
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(url);
      if (response.status !== 500) return await response.json();
      await response.body?.cancel();
    }
    return undefined;
  };

  const first = await get(1);
  const pages = typeof first?.pages === "number" ? first.pages : 1;
  for (let page = 2; page <= pages; page++) await get(page);
}
