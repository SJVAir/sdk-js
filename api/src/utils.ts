/**
 * The default origin to use when making requests to the SJVAir API
 */
let origin = window.location.origin.includes("localhost")
  ? "http://localhost:8000"
  : "https://www.sjvair.com";

/**
 * Constructs an SJVAir specific URL object
 *
 * @param endpoint Specific route to an endpoint (e.g. "/monitors")
 * @param searchParams Key/Value object containing search parameters
 *
 * @returns A complete request URL for the SJVAir API
 */
export function getUrl<T extends Object>(endpoint: string, searchParams?: T): URL {
  const url = new URL(`${ origin }/api/1.0/${ endpoint }/`);

  if (searchParams) {
    Object.entries(searchParams)
      .forEach(param => url.searchParams.set(param[0], param[1]));
  }

  return url;
}

/**
 * Set the default origin to use when making requests to the SJVAir API
 *
 * @param newOrigin The desired origin to use when making requests from the SJVAir API
 */
export function setOrigin(newOrigin: string): void {
  origin = newOrigin;
}

/**
 * Converts a Date object or string to the format used by the SJVAir API
 *
 * @param date A Date object or string;
 *
 * @returns A date string formatted as "YYYY-MM-DD HH:MM:SS"
 */
export function apiDateFormat(date: Date | string): string {
  date = (date instanceof Date) ? date : new Date(date);

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${ year }-${ month }-${ day } ${ hours }:${ minutes }:${ seconds }`;
}

