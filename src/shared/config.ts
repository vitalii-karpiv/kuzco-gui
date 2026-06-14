/**
 * Base URL of the kuzco-server API.
 *
 * Set `NEXT_PUBLIC_API_URL` to point at a local server (e.g. http://localhost:3000)
 * during development; defaults to production. Replaces the old comment-toggle base URL.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.kuzcocrm.com";
