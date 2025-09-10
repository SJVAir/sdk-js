

/**
 * The default origin to use when making requests to the SJVAir API
 */
export let origin = "https://www.sjvair.com";

/**
 * Set the default origin to use when making requests to the SJVAir API
 *
 * @param newOrigin The desired origin to use when making requests from the SJVAir API
 */
export function setOrigin(newOrigin: string): void {
  origin = newOrigin;
}

/**
 * Constructs an SJVAir specific URL object
 *
 * @param endpoint Specific route to an endpoint (e.g. "/monitors")
 * @param version The desired api version to use
 * @param searchParams Key/Value object containing search parameters
 *
 * @returns A complete request URL for the SJVAir API
 */
export function getApiUrl(
  endpoint: string,
  searchParams?: Record<string, string>,
): URL {
  const url = new URL(`${origin}/api/2.0/${endpoint}/`);

  if (searchParams) {
    Object.entries(searchParams)
      .forEach((param) => url.searchParams.set(param[0], param[1]));
  }

  return url;
}

}

/**
 *
 *
 */


    }

}
